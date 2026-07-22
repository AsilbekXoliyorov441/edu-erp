import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

/** One-time migration for the multi-teacher rollout. Promotes the sole pre-existing
 * teacher to superadmin and backfills `teacherId` on every existing group so old data
 * stays attached to them instead of becoming ownerless. Refuses to run once a second
 * teacher exists (by then the "one owner for everything old" assumption is no longer safe).
 * Run via: npx convex run migrations:backfillTeacherOwnership '{}' */
export const backfillTeacherOwnership = internalMutation({
  args: {},
  handler: async (ctx) => {
    const teachers = await ctx.db.query('teachers').collect()
    if (teachers.length !== 1) {
      return { ok: false, error: `Expected exactly 1 teacher, found ${teachers.length}. Aborted.` }
    }
    const [owner] = teachers
    if (!owner.isSuperAdmin) {
      await ctx.db.patch(owner._id, { isSuperAdmin: true })
    }

    const groups = await ctx.db.query('groups').collect()
    let patched = 0
    for (const group of groups) {
      if (!group.teacherId) {
        await ctx.db.patch(group._id, { teacherId: owner._id })
        patched += 1
      }
    }

    return { ok: true, superAdminId: owner._id, groupsPatched: patched, totalGroups: groups.length }
  },
})

/** One-time migration for the "tests" rework: a test used to belong to one lesson (so the
 * same quiz had to be recreated per group); now it's a reusable topic owned by a teacher and
 * attached to any number of groups via `testAssignments`. Backfills `teacherId` from the old
 * `lessonId` -> group chain, creates the equivalent assignment row, and rewrites attempts to
 * point at `testId` instead of `lessonId`. Safe to re-run — already-migrated rows (no
 * `lessonId`) are skipped. Run via: npx convex run migrations:backfillTestsToTopics '{}' */
export const backfillTestsToTopics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tests = await ctx.db.query('tests').collect()
    const oldLessonIdByTestId = new Map()
    let testsPatched = 0
    let testsSkippedOrphaned = 0

    for (const test of tests) {
      if (!test.lessonId) continue
      oldLessonIdByTestId.set(test._id, test.lessonId)

      const lesson = await ctx.db.get(test.lessonId)
      const group = lesson ? await ctx.db.get(lesson.groupId) : null
      if (!lesson || !group) {
        testsSkippedOrphaned += 1
        await ctx.db.patch(test._id, { lessonId: undefined })
        continue
      }

      await ctx.db.patch(test._id, { teacherId: group.teacherId, lessonId: undefined })
      await ctx.db.insert('testAssignments', { testId: test._id, groupId: group._id, createdAt: test.createdAt })
      testsPatched += 1
    }

    const testIdsByLessonId = new Map()
    for (const [testId, lessonId] of oldLessonIdByTestId) {
      const list = testIdsByLessonId.get(lessonId) ?? []
      list.push(testId)
      testIdsByLessonId.set(lessonId, list)
    }

    const attempts = await ctx.db.query('testAttempts').collect()
    let attemptsMigrated = 0
    let attemptsDroppedAmbiguous = 0

    for (const attempt of attempts) {
      if (!attempt.lessonId) continue
      const candidates = testIdsByLessonId.get(attempt.lessonId) ?? []
      if (candidates.length === 1) {
        await ctx.db.patch(attempt._id, { testId: candidates[0], lessonId: undefined })
        attemptsMigrated += 1
      } else {
        // 0 tests (lesson had none, or it's an orphan) or 2+ tests (old merged-quiz score
        // can't be attributed to a single new topic) — drop rather than leave unmigratable.
        await ctx.db.delete(attempt._id)
        attemptsDroppedAmbiguous += 1
      }
    }

    return { ok: true, testsPatched, testsSkippedOrphaned, attemptsMigrated, attemptsDroppedAmbiguous }
  },
})

/** One-time migration for the multi-tenant rollout. Creates the first `centers` row from
 * all of today's data, attaches every existing teacher to it (old `isSuperAdmin` teachers
 * become that center's `director`, everyone else becomes a plain `teacher`), and attaches
 * every existing gift to it too (the coin market used to be global). Nothing is deleted —
 * `teacher.isSuperAdmin` is left in place, just superseded by `role`. Refuses to run once
 * any teacher already has a `role` (by then multi-tenancy is already bootstrapped).
 * Run via: npx convex run migrations:bootstrapMultiTenant '{"centerName":"..."}' */
export const bootstrapMultiTenant = internalMutation({
  args: { centerName: v.string() },
  handler: async (ctx, { centerName }) => {
    const teachers = await ctx.db.query('teachers').collect()
    if (teachers.some((t) => t.role)) {
      return { ok: false, error: 'Already migrated to multi-tenant — a teacher already has a role.' }
    }

    const now = new Date()
    const fiveYearsOut = new Date(now)
    fiveYearsOut.setFullYear(fiveYearsOut.getFullYear() + 5)

    const centerId = await ctx.db.insert('centers', {
      name: centerName,
      status: 'active',
      createdAt: now.toISOString(),
      subscriptionPrice: 0,
      subscriptionEndsAt: fiveYearsOut.toISOString(),
      coinPriceSom: 130,
    })

    let directors = 0
    let regularTeachers = 0
    for (const teacher of teachers) {
      const role = teacher.isSuperAdmin ? 'director' : 'teacher'
      await ctx.db.patch(teacher._id, { role, centerId })
      if (role === 'director') directors += 1
      else regularTeachers += 1
    }

    const gifts = await ctx.db.query('gifts').collect()
    for (const gift of gifts) {
      await ctx.db.patch(gift._id, { centerId })
    }

    return { ok: true, centerId, directors, regularTeachers, giftsPatched: gifts.length }
  },
})
