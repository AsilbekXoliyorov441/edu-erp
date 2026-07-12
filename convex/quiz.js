import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireSession } from './lib/authz'
import { requireLessonAccess, requireLessonOwner } from './lib/scoping'

async function getLessonQuestions(ctx, lessonId) {
  const tests = await ctx.db
    .query('tests')
    .withIndex('by_lesson', (q) => q.eq('lessonId', lessonId))
    .collect()
  const testIdSet = new Set(tests.map((t) => t._id))
  const allQuestions = await ctx.db.query('testQuestions').collect()
  return allQuestions.filter((q) => testIdSet.has(q.testId)).sort((a, b) => a.order - b.order)
}

/** The lesson's combined quiz, with every attached test's questions merged into one
 * list — `correctIndex` is never included in this response. */
export const getQuizForLesson = query({
  args: { token: v.string(), lessonId: v.id('lessons') },
  handler: async (ctx, { token, lessonId }) => {
    await requireLessonAccess(ctx, token, lessonId)
    const questions = await getLessonQuestions(ctx, lessonId)
    return {
      lessonId,
      totalQuestions: questions.length,
      questions: questions.map((q) => ({ id: q._id, text: q.text, isCode: !!q.isCode, options: q.options })),
    }
  },
})

/** Reveals whether one answer is correct, right when the student picks it (for the
 * instant per-question animation) — scoped the same as `getQuizForLesson`. This only
 * exposes the ONE question just answered, never the rest of the quiz's answer key. */
export const checkAnswer = query({
  args: { token: v.string(), questionId: v.id('testQuestions'), selectedIndex: v.number() },
  handler: async (ctx, { token, questionId, selectedIndex }) => {
    const question = await ctx.db.get(questionId)
    if (!question) throw new ConvexError('Savol topilmadi')
    const test = await ctx.db.get(question.testId)
    if (!test) throw new ConvexError('Test topilmadi')
    await requireLessonAccess(ctx, token, test.lessonId)
    return { correct: selectedIndex === question.correctIndex, correctIndex: question.correctIndex }
  },
})

/** Scores the attempt server-side against the real stored answers — the client never
 * supplies (or is trusted for) a score. `totalQuestions` is the lesson's actual question
 * count, not `answers.length`, so skipping questions can't inflate the percentage. */
export const submitAttempt = mutation({
  args: {
    token: v.string(),
    lessonId: v.id('lessons'),
    answers: v.array(v.object({ questionId: v.id('testQuestions'), selectedIndex: v.number() })),
  },
  handler: async (ctx, { token, lessonId, answers }) => {
    const { scope } = await requireLessonAccess(ctx, token, lessonId)
    if (scope.session.role !== 'student') throw new ConvexError("Faqat o'quvchi test topshira oladi")

    const questions = await getLessonQuestions(ctx, lessonId)
    const correctByQuestion = new Map(questions.map((q) => [q._id, q.correctIndex]))

    let score = 0
    for (const answer of answers) {
      if (correctByQuestion.get(answer.questionId) === answer.selectedIndex) score += 1
    }

    const totalQuestions = questions.length
    const percent = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0

    await ctx.db.insert('testAttempts', {
      studentId: scope.session.userId,
      lessonId,
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

/** Teacher-only: every student attempt recorded for one lesson, for the "Natijalar" tab. */
export const listAttemptsForLesson = query({
  args: { token: v.string(), lessonId: v.id('lessons') },
  handler: async (ctx, { token, lessonId }) => {
    await requireLessonOwner(ctx, token, lessonId)
    return await ctx.db
      .query('testAttempts')
      .withIndex('by_lesson', (q) => q.eq('lessonId', lessonId))
      .collect()
  },
})
