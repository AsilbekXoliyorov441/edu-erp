import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireLessonOwner, getScopedGroupIdSet } from './lib/scoping'

async function requireTestOwner(ctx, token, testId) {
  const test = await ctx.db.get(testId)
  if (!test) throw new ConvexError('Test topilmadi')
  await requireLessonOwner(ctx, token, test.lessonId)
  return test
}

export const listForTeacher = query({
  args: { token: v.string(), lessonId: v.id('lessons') },
  handler: async (ctx, { token, lessonId }) => {
    await requireLessonOwner(ctx, token, lessonId)
    const tests = await ctx.db
      .query('tests')
      .withIndex('by_lesson', (q) => q.eq('lessonId', lessonId))
      .collect()
    const questions = await ctx.db.query('testQuestions').collect()
    return tests.map((t) => ({
      ...t,
      questionCount: questions.filter((q) => q.testId === t._id).length,
    }))
  },
})

/** Every lessonId (within the caller's scope) that has at least one test attached —
 * used by the student "Testlar" list to filter down an already-fetched lessons list. */
export const listLessonIdsWithTests = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    const lessons = await ctx.db.query('lessons').collect()
    const scopedLessons = groupIdSet === null ? lessons : lessons.filter((l) => groupIdSet.has(l.groupId))
    const scopedLessonIdSet = new Set(scopedLessons.map((l) => l._id))

    const tests = await ctx.db.query('tests').collect()
    const lessonIdsWithTests = new Set(tests.filter((t) => scopedLessonIdSet.has(t.lessonId)).map((t) => t.lessonId))
    return [...lessonIdsWithTests]
  },
})

export const create = mutation({
  args: { token: v.string(), lessonId: v.id('lessons'), title: v.string() },
  handler: async (ctx, { token, lessonId, title }) => {
    await requireLessonOwner(ctx, token, lessonId)
    return await ctx.db.insert('tests', { lessonId, title, createdAt: new Date().toISOString() })
  },
})

export const update = mutation({
  args: { token: v.string(), id: v.id('tests'), title: v.string() },
  handler: async (ctx, { token, id, title }) => {
    await requireTestOwner(ctx, token, id)
    await ctx.db.patch(id, { title })
  },
})

export const remove = mutation({
  args: { token: v.string(), id: v.id('tests') },
  handler: async (ctx, { token, id }) => {
    await requireTestOwner(ctx, token, id)
    const questions = await ctx.db
      .query('testQuestions')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const question of questions) await ctx.db.delete(question._id)
    await ctx.db.delete(id)
  },
})
