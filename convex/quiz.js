import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireSession } from './lib/authz'
import { requireTestAccess, requireTestOwner } from './lib/scoping'

async function getTestQuestions(ctx, testId) {
  const questions = await ctx.db
    .query('testQuestions')
    .withIndex('by_test', (q) => q.eq('testId', testId))
    .collect()
  return questions.sort((a, b) => a.order - b.order)
}

/** One topic's quiz — `correctIndex` is never included in this response. */
export const getQuizForTest = query({
  args: { token: v.string(), testId: v.id('tests') },
  handler: async (ctx, { token, testId }) => {
    const { test } = await requireTestAccess(ctx, token, testId)
    const questions = await getTestQuestions(ctx, testId)
    return {
      testId,
      title: test.title,
      totalQuestions: questions.length,
      questions: await Promise.all(
        questions.map(async (q) => ({
          id: q._id,
          text: q.text,
          isCode: !!q.isCode,
          imageUrl: q.imageStorageId ? await ctx.storage.getUrl(q.imageStorageId) : null,
          options: q.options,
        })),
      ),
    }
  },
})

/** Reveals whether one answer is correct, right when the student picks it (for the
 * instant per-question animation) — scoped the same as `getQuizForTest`. This only
 * exposes the ONE question just answered, never the rest of the quiz's answer key. */
export const checkAnswer = query({
  args: { token: v.string(), questionId: v.id('testQuestions'), selectedIndex: v.number() },
  handler: async (ctx, { token, questionId, selectedIndex }) => {
    const question = await ctx.db.get(questionId)
    if (!question) throw new ConvexError('Savol topilmadi')
    await requireTestAccess(ctx, token, question.testId)
    return { correct: selectedIndex === question.correctIndex, correctIndex: question.correctIndex }
  },
})

/** Scores the attempt server-side against the real stored answers — the client never
 * supplies (or is trusted for) a score. `totalQuestions` is the topic's actual question
 * count, not `answers.length`, so skipping questions can't inflate the percentage. */
export const submitAttempt = mutation({
  args: {
    token: v.string(),
    testId: v.id('tests'),
    answers: v.array(v.object({ questionId: v.id('testQuestions'), selectedIndex: v.number() })),
  },
  handler: async (ctx, { token, testId, answers }) => {
    const { scope } = await requireTestAccess(ctx, token, testId)
    if (scope.session.role !== 'student') throw new ConvexError("Faqat o'quvchi test topshira oladi")

    const questions = await getTestQuestions(ctx, testId)
    const correctByQuestion = new Map(questions.map((q) => [q._id, q.correctIndex]))

    let score = 0
    for (const answer of answers) {
      if (correctByQuestion.get(answer.questionId) === answer.selectedIndex) score += 1
    }

    const totalQuestions = questions.length
    const percent = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0

    await ctx.db.insert('testAttempts', {
      studentId: scope.session.userId,
      testId,
      score,
      totalQuestions,
      answeredAt: new Date().toISOString(),
    })

    return { score, totalQuestions, percent }
  },
})

/** The calling student's own attempt history — used to show a "best score" badge. */
export const listMyAttempts = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireSession(ctx, token)
    if (session.role !== 'student') return []
    return await ctx.db
      .query('testAttempts')
      .withIndex('by_student', (q) => q.eq('studentId', session.userId))
      .collect()
  },
})

/** Teacher-only: every student attempt recorded for one topic, for the "Natijalar" tab. */
export const listAttemptsForTest = query({
  args: { token: v.string(), testId: v.id('tests') },
  handler: async (ctx, { token, testId }) => {
    await requireTestOwner(ctx, token, testId)
    return await ctx.db
      .query('testAttempts')
      .withIndex('by_test', (q) => q.eq('testId', testId))
      .collect()
  },
})
