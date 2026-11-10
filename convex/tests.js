import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScope, requireTestOwner, getCenterTeacherIdSet } from './lib/scoping'
import { PRESET_TESTS } from './lib/presetTests'

function requireTeacherScope(scope) {
  if (scope.platformAdmin || scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
}

/** Every topic ("mavzu") the caller owns, with its question count and how many groups it's
 * currently attached to — the "Testlar" management list. */
export const listForTeacher = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    requireTeacherScope(scope)

    const teacherIds = scope.all ? [...(await getCenterTeacherIdSet(ctx, scope.centerId))] : [scope.teacherId]
    const tests = (
      await Promise.all(
        teacherIds.map((teacherId) =>
          ctx.db
            .query('tests')
            .withIndex('by_teacher', (q) => q.eq('teacherId', teacherId))
            .collect(),
        ),
      )
    ).flat()

    const byTest = (table, testId) =>
      ctx.db
        .query(table)
        .withIndex('by_test', (q) => q.eq('testId', testId))
        .collect()

    const groupNameCache = new Map()
    const groupName = async (id) => {
      if (!groupNameCache.has(id)) groupNameCache.set(id, ctx.db.get(id).then((g) => g?.name))
      return await groupNameCache.get(id)
    }

    const rows = await Promise.all(
      tests.map(async (t) => {
        const [questions, assignments, attempts] = await Promise.all([
          byTest('testQuestions', t._id),
          byTest('testAssignments', t._id),
          byTest('testAttempts', t._id),
        ])
        const groupIds = assignments.map((a) => a.groupId)
        return {
          ...t,
          questionCount: questions.length,
          groupCount: groupIds.length,
          groupIds,
          groupNames: (await Promise.all(groupIds.map(groupName))).filter(Boolean),
          attemptCount: attempts.length,
        }
      }),
    )
    return rows.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const create = mutation({
  args: { token: v.string(), title: v.string(), subject: v.optional(v.string()), section: v.optional(v.string()) },
  handler: async (ctx, { token, title, subject, section }) => {
    const scope = await getScope(ctx, token)
    requireTeacherScope(scope)
    return await ctx.db.insert('tests', {
      title,
      ...(subject ? { subject } : {}),
      ...(section?.trim() ? { section: section.trim() } : {}),
      createdAt: new Date().toISOString(),
      teacherId: scope.session.userId,
    })
  },
})

/** Copies the ready-made HTML / CSS / HTML+CSS topics into the caller's question bank.
 * Topics the caller already has (matched by title) are skipped, so it's safe to re-run. */
export const importPresets = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    requireTeacherScope(scope)
    const teacherId = scope.session.userId

    const existing = await ctx.db
      .query('tests')
      .withIndex('by_teacher', (q) => q.eq('teacherId', teacherId))
      .collect()
    const existingTitles = new Set(existing.map((t) => t.title))

    let added = 0
    for (const preset of PRESET_TESTS) {
      if (existingTitles.has(preset.title)) continue
      const testId = await ctx.db.insert('tests', {
        title: preset.title,
        subject: preset.subject,
        createdAt: new Date().toISOString(),
        teacherId,
      })
      for (const [index, question] of preset.questions.entries()) {
        await ctx.db.insert('testQuestions', { testId, ...question, order: index + 1 })
      }
      added += 1
    }
    return { added }
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id('tests'),
    title: v.string(),
    subject: v.optional(v.string()),
    section: v.optional(v.string()),
  },
  handler: async (ctx, { token, id, title, subject, section }) => {
    await requireTestOwner(ctx, token, id)
    await ctx.db.patch(id, {
      title,
      ...(subject ? { subject } : {}),
      // "" clears the section (the topic goes back to "Umumiy").
      ...(section !== undefined ? { section: section.trim() || undefined } : {}),
    })
  },
})

/** Deletes the topic together with its questions (and any uploaded question images),
 * group assignments, and recorded attempts. */
export const remove = mutation({
  args: { token: v.string(), id: v.id('tests') },
  handler: async (ctx, { token, id }) => {
    await requireTestOwner(ctx, token, id)

    const questions = await ctx.db
      .query('testQuestions')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const question of questions) {
      if (question.imageStorageId) await ctx.storage.delete(question.imageStorageId)
      await ctx.db.delete(question._id)
    }

    const assignments = await ctx.db
      .query('testAssignments')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const assignment of assignments) await ctx.db.delete(assignment._id)

    const attempts = await ctx.db
      .query('testAttempts')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const attempt of attempts) await ctx.db.delete(attempt._id)

    await ctx.db.delete(id)
  },
})
