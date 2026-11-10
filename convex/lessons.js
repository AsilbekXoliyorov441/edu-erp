import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { collectByGroups, collectByStudents, getScopedGroupIdSet, requireGroupOwner, requireLessonOwner } from './lib/scoping'
import { COIN_CATEGORY_LIST, LESSONS_PER_MONTH } from '../src/shared/config/constants'
import { getDayKey } from '../src/shared/lib/stats/monthlyGoal.js'

const CATEGORY_MAX = Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, c.max]))

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    return await collectByGroups(ctx, 'lessons', groupIdSet)
  },
})

/** Atomically creates the lesson + every non-zero coin entry/transaction for it.
 * `nextLessonNumber`/`monthIndex` are computed here (not trusted from the client) so two
 * concurrent sessions for the same group can't collide on the same lesson number. */
export const saveSession = mutation({
  args: {
    token: v.string(),
    groupId: v.id('groups'),
    scores: v.array(v.object({ studentId: v.id('students'), category: v.string(), value: v.number() })),
    attendance: v.array(
      v.object({ studentId: v.id('students'), status: v.union(v.literal('present'), v.literal('late'), v.literal('absent')) })
    ),
    date: v.string(),
  },
  handler: async (ctx, { token, groupId, scores, attendance, date }) => {
    await requireGroupOwner(ctx, token, groupId)

    const groupLessons = await ctx.db
      .query('lessons')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    // One lesson per group per day: re-grading an already graded day would double its coins.
    const dayKey = getDayKey(date)
    if (groupLessons.some((l) => getDayKey(l.date) === dayKey)) {
      throw new ConvexError("Bu sana uchun dars allaqachon baholangan. Boshqa kunni tanlang.")
    }
    const lessonNumber = groupLessons.length ? Math.max(...groupLessons.map((l) => l.lessonNumber)) + 1 : 1
    const monthIndex = Math.ceil(lessonNumber / LESSONS_PER_MONTH)
    const lessonId = await ctx.db.insert('lessons', { groupId, date, lessonNumber, monthIndex })

    let entriesCount = 0
    let coinsGiven = 0

    for (const score of scores) {
      const maxValue = CATEGORY_MAX[score.category]
      if (maxValue === undefined) continue
      const value = Math.max(0, Math.min(score.value, maxValue))
      if (value <= 0) continue

      const entryId = await ctx.db.insert('coinEntries', {
        studentId: score.studentId,
        lessonId,
        category: score.category,
        value,
        maxValue,
        givenAt: date,
      })
      await ctx.db.insert('transactions', {
        studentId: score.studentId,
        type: 'coin_given',
        amount: value,
        relatedEntryId: entryId,
        timestamp: date,
      })
      entriesCount += 1
      coinsGiven += value
    }

    let presentCount = 0
    let lateCount = 0
    let absentCount = 0

    for (const record of attendance) {
      await ctx.db.insert('attendance', { lessonId, studentId: record.studentId, status: record.status })
      if (record.status === 'present') presentCount += 1
      else if (record.status === 'late') lateCount += 1
      else if (record.status === 'absent') absentCount += 1
    }

    return { lessonId, lessonNumber, monthIndex, entriesCount, coinsGiven, presentCount, lateCount, absentCount }
  },
})

/** Deletes one or many lessons together with their coin entries, transactions, and attendance. */
export const removeCascade = mutation({
  args: { token: v.string(), ids: v.array(v.id('lessons')) },
  handler: async (ctx, { token, ids }) => {
    for (const id of ids) await requireLessonOwner(ctx, token, id)
    const lessonIdSet = new Set(ids)

    const byLesson = (table) =>
      Promise.all(
        [...lessonIdSet].map((lessonId) =>
          ctx.db
            .query(table)
            .withIndex('by_lesson', (q) => q.eq('lessonId', lessonId))
            .collect(),
        ),
      ).then((rows) => rows.flat())

    const entriesToDelete = await byLesson('coinEntries')
    const entryIdSet = new Set(entriesToDelete.map((e) => e._id))

    const affectedStudentIds = new Set(entriesToDelete.map((e) => e.studentId))
    const studentTransactions = await collectByStudents(ctx, 'transactions', affectedStudentIds)
    const transactionsToDelete = studentTransactions.filter((t) => t.relatedEntryId && entryIdSet.has(t.relatedEntryId))

    const attendanceToDelete = await byLesson('attendance')

    for (const txn of transactionsToDelete) await ctx.db.delete(txn._id)
    for (const entry of entriesToDelete) await ctx.db.delete(entry._id)
    for (const record of attendanceToDelete) await ctx.db.delete(record._id)
    for (const lessonId of ids) await ctx.db.delete(lessonId)
  },
})
