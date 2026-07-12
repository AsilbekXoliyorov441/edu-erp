import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireLessonOwner } from './lib/scoping'

function validateOptions(options, correctIndex) {
  if (options.length !== 4) throw new ConvexError("Aynan 4 ta javob varianti bo'lishi kerak")
  if (correctIndex < 0 || correctIndex > 3) throw new ConvexError("To'g'ri javob 1-4 orasida tanlanishi kerak")
}

async function requireTestOwnerByTestId(ctx, token, testId) {
  const test = await ctx.db.get(testId)
  if (!test) throw new ConvexError('Test topilmadi')
  await requireLessonOwner(ctx, token, test.lessonId)
  return test
}

async function requireQuestionOwner(ctx, token, questionId) {
  const question = await ctx.db.get(questionId)
  if (!question) throw new ConvexError('Savol topilmadi')
  await requireTestOwnerByTestId(ctx, token, question.testId)
  return question
}

/** Full question data, including `correctIndex` — teacher-side editing view only. */
export const listForTeacher = query({
  args: { token: v.string(), testId: v.id('tests') },
  handler: async (ctx, { token, testId }) => {
    await requireTestOwnerByTestId(ctx, token, testId)
    const questions = await ctx.db
      .query('testQuestions')
      .withIndex('by_test', (q) => q.eq('testId', testId))
      .collect()
    return questions.sort((a, b) => a.order - b.order)
  },
})

export const create = mutation({
  args: {
    token: v.string(),
    testId: v.id('tests'),
    text: v.string(),
    isCode: v.optional(v.boolean()),
    options: v.array(v.string()),
    correctIndex: v.number(),
  },
  handler: async (ctx, { token, testId, text, isCode, options, correctIndex }) => {
    await requireTestOwnerByTestId(ctx, token, testId)
    validateOptions(options, correctIndex)

    const existing = await ctx.db
      .query('testQuestions')
      .withIndex('by_test', (q) => q.eq('testId', testId))
      .collect()
    const order = existing.length ? Math.max(...existing.map((q) => q.order)) + 1 : 1

    return await ctx.db.insert('testQuestions', { testId, text, isCode, options, correctIndex, order })
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id('testQuestions'),
    text: v.string(),
    isCode: v.optional(v.boolean()),
    options: v.array(v.string()),
    correctIndex: v.number(),
  },
  handler: async (ctx, { token, id, text, isCode, options, correctIndex }) => {
    await requireQuestionOwner(ctx, token, id)
    validateOptions(options, correctIndex)
    await ctx.db.patch(id, { text, isCode, options, correctIndex })
  },
})

export const remove = mutation({
  args: { token: v.string(), id: v.id('testQuestions') },
  handler: async (ctx, { token, id }) => {
    await requireQuestionOwner(ctx, token, id)
    await ctx.db.delete(id)
  },
})
