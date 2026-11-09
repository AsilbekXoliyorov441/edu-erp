import { query, mutation, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v, ConvexError } from 'convex/values'
import { getScope, requireGroupOwner, requireTestOwner } from './lib/scoping'
import { notify } from './lib/notify'
import { LESSON_QUIZ, STUDENT_STATUS } from '../src/shared/config/constants'

const QUESTION_MS = LESSON_QUIZ.SECONDS_PER_QUESTION * 1000

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function isOpen(quiz) {
  return quiz.status === 'active' && Date.now() - quiz.createdAt < LESSON_QUIZ.MAX_AGE_MS
}

async function requireQuizHost(ctx, token, quizId) {
  const quiz = await ctx.db.get(quizId)
  if (!quiz) throw new ConvexError('Savol-javob topilmadi')
  const session = await requireGroupOwner(ctx, token, quiz.groupId)
  return { quiz, session }
}

/** The calling student; must be in the quiz's group. */
async function requireQuizStudent(ctx, token, quiz) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'student') throw new ConvexError("Faqat o'quvchi qatnasha oladi")
  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.groupId !== quiz.groupId) throw new ConvexError("Bu savol-javob sizning guruhingiz uchun emas")
  return student
}

async function findAttempt(ctx, quizId, studentId) {
  return await ctx.db
    .query('lessonQuizAttempts')
    .withIndex('by_quiz_student', (q) => q.eq('quizId', quizId).eq('studentId', studentId))
    .unique()
}

async function scheduleTimeout(ctx, attempt) {
  const delay = attempt.questionStartedAt - Date.now() + QUESTION_MS + LESSON_QUIZ.GRACE_MS
  await ctx.scheduler.runAfter(Math.max(0, delay), internal.lessonQuiz.timeout, {
    attemptId: attempt._id,
    index: attempt.index,
  })
}

/** Records one answer (or a timeout with `selectedIndex` -1) and opens the next question. */
async function recordAnswer(ctx, attempt, selectedIndex, correct) {
  const answers = [...attempt.answers, { selectedIndex, correct }]
  const index = attempt.index + 1
  const done = index >= attempt.questionIds.length
  const patch = {
    answers,
    index,
    correctCount: attempt.correctCount + (correct ? 1 : 0),
    questionStartedAt: Date.now() + LESSON_QUIZ.FEEDBACK_MS,
    ...(done ? { status: 'done', finishedAt: Date.now() } : {}),
  }
  await ctx.db.patch(attempt._id, patch)
  if (!done) await scheduleTimeout(ctx, { ...attempt, ...patch })
  return { correct, done, correctCount: patch.correctCount }
}

/** Teacher: opens the lesson's Q&A for a group from the chosen topics and notifies every
 * student. Any earlier open Q&A of the group is closed — one at a time per group. */
export const create = mutation({
  args: { token: v.string(), groupId: v.id('groups'), testIds: v.array(v.id('tests')) },
  handler: async (ctx, { token, groupId, testIds }) => {
    const session = await requireGroupOwner(ctx, token, groupId)
    if (testIds.length === 0) throw new ConvexError('Kamida bitta mavzu tanlang')

    const titles = []
    const questionIds = []
    for (const testId of new Set(testIds)) {
      const { test } = await requireTestOwner(ctx, token, testId)
      titles.push(test.title)
      const questions = await ctx.db
        .query('testQuestions')
        .withIndex('by_test', (q) => q.eq('testId', testId))
        .collect()
      questionIds.push(...questions.map((q) => q._id))
    }
    if (questionIds.length === 0) throw new ConvexError("Tanlangan mavzularda hali savol yo'q")

    const previous = await ctx.db
      .query('lessonQuizzes')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    for (const quiz of previous) {
      if (quiz.status === 'active') await ctx.db.patch(quiz._id, { status: 'closed', closedAt: Date.now() })
    }

    const title = titles.join(', ')
    const quizId = await ctx.db.insert('lessonQuizzes', {
      groupId,
      hostId: session.userId,
      testIds: [...new Set(testIds)],
      title,
      questionIds,
      status: 'active',
      createdAt: Date.now(),
    })

    const students = await ctx.db
      .query('students')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    await notify(
      ctx,
      students.filter((s) => s.status === STUDENT_STATUS.ACTIVE).map((s) => s._id),
      {
        type: 'lesson_quiz',
        title: 'Darsdagi savol-javob boshlandi!',
        body: `${LESSON_QUIZ.QUESTION_COUNT} ta savol, har biriga ${LESSON_QUIZ.SECONDS_PER_QUESTION} soniya — ${title}`,
      },
    )
    return quizId
  },
})

/** Teacher: closes the Q&A (on save or cancel). Late answers are no longer accepted. */
export const close = mutation({
  args: { token: v.string(), quizId: v.id('lessonQuizzes'), lessonId: v.optional(v.id('lessons')) },
  handler: async (ctx, { token, quizId, lessonId }) => {
    const { quiz } = await requireQuizHost(ctx, token, quizId)
    await ctx.db.patch(quiz._id, {
      status: 'closed',
      closedAt: quiz.closedAt ?? Date.now(),
      ...(lessonId ? { lessonId } : {}),
    })
  },
})

/** Teacher: live per-student progress — drives the grading table's Savol-javob cells. */
export const getForTeacher = query({
  args: { token: v.string(), quizId: v.id('lessonQuizzes') },
  handler: async (ctx, { token, quizId }) => {
    const { quiz } = await requireQuizHost(ctx, token, quizId)
    const attempts = await ctx.db
      .query('lessonQuizAttempts')
      .withIndex('by_quiz', (q) => q.eq('quizId', quizId))
      .collect()
    return {
      id: quiz._id,
      title: quiz.title,
      status: quiz.status,
      createdAt: quiz.createdAt,
      results: attempts.map((a) => ({
        studentId: a.studentId,
        status: a.status,
        answered: a.answers.length,
        total: a.questionIds.length,
        correctCount: a.correctCount,
        // 1-based numbers of the questions answered correctly → the lit Q&A cells.
        correctSlots: a.answers.flatMap((ans, i) => (ans.correct ? [i + 1] : [])),
      })),
    }
  },
})

/** Student: the open Q&A of their group and how far they got — drives the banner. */
export const activeForMe = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin || scope.session.role !== 'student') return null
    const student = await ctx.db.get(scope.session.userId)
    if (!student) return null
    const quizzes = await ctx.db
      .query('lessonQuizzes')
      .withIndex('by_group', (q) => q.eq('groupId', student.groupId))
      .order('desc')
      .take(5)
    const quiz = quizzes.find(isOpen)
    if (!quiz) return null
    const attempt = await findAttempt(ctx, quiz._id, student._id)
    return {
      id: quiz._id,
      title: quiz.title,
      myStatus: attempt?.status ?? 'new',
      correctCount: attempt?.correctCount ?? 0,
    }
  },
})

/** Student: the full state of their own run — the open question never includes its answer. */
export const getMine = query({
  args: { token: v.string(), quizId: v.id('lessonQuizzes') },
  handler: async (ctx, { token, quizId }) => {
    const quiz = await ctx.db.get(quizId)
    if (!quiz) return null
    const student = await requireQuizStudent(ctx, token, quiz)
    const attempt = await findAttempt(ctx, quizId, student._id)
    const base = {
      quizId,
      title: quiz.title,
      open: isOpen(quiz),
      total: Math.min(LESSON_QUIZ.QUESTION_COUNT, quiz.questionIds.length),
    }
    if (!attempt) return { ...base, attempt: null }

    let question = null
    if (attempt.status === 'active') {
      const q = await ctx.db.get(attempt.questionIds[attempt.index])
      if (q) {
        question = {
          id: q._id,
          text: q.text,
          isCode: !!q.isCode,
          imageUrl: q.imageStorageId ? await ctx.storage.getUrl(q.imageStorageId) : null,
          options: q.options,
        }
      }
    }
    return {
      ...base,
      total: attempt.questionIds.length,
      attempt: {
        id: attempt._id,
        status: attempt.status,
        index: attempt.index,
        questionStartedAt: attempt.questionStartedAt,
        answers: attempt.answers,
        correctCount: attempt.correctCount,
      },
      question,
    }
  },
})

/** Student: starts (or resumes) their run with their own random questions. */
export const start = mutation({
  args: { token: v.string(), quizId: v.id('lessonQuizzes') },
  handler: async (ctx, { token, quizId }) => {
    const quiz = await ctx.db.get(quizId)
    if (!quiz) throw new ConvexError('Savol-javob topilmadi')
    const student = await requireQuizStudent(ctx, token, quiz)
    const existing = await findAttempt(ctx, quizId, student._id)
    if (existing) return existing._id
    if (!isOpen(quiz)) throw new ConvexError('Savol-javob yakunlangan')

    const now = Date.now()
    const attemptId = await ctx.db.insert('lessonQuizAttempts', {
      quizId,
      studentId: student._id,
      questionIds: shuffle(quiz.questionIds).slice(0, LESSON_QUIZ.QUESTION_COUNT),
      index: 0,
      questionStartedAt: now + LESSON_QUIZ.LEAD_IN_MS,
      answers: [],
      correctCount: 0,
      status: 'active',
      startedAt: now,
    })
    await scheduleTimeout(ctx, await ctx.db.get(attemptId))
    return attemptId
  },
})

/** Student: answers the open question. Checked against the server clock — an answer after
 * the countdown (plus a small grace for the network) counts as wrong. */
export const answer = mutation({
  args: {
    token: v.string(),
    attemptId: v.id('lessonQuizAttempts'),
    index: v.number(),
    selectedIndex: v.number(),
  },
  handler: async (ctx, { token, attemptId, index, selectedIndex }) => {
    const attempt = await ctx.db.get(attemptId)
    if (!attempt) throw new ConvexError('Urinish topilmadi')
    const quiz = await ctx.db.get(attempt.quizId)
    const student = await requireQuizStudent(ctx, token, quiz)
    if (attempt.studentId !== student._id) throw new ConvexError("Bu sizning urinishingiz emas")
    if (attempt.status !== 'active' || attempt.index !== index) return { stale: true }
    if (!isOpen(quiz)) throw new ConvexError('Savol-javob yakunlangan')

    const elapsed = Date.now() - attempt.questionStartedAt
    if (elapsed < -LESSON_QUIZ.GRACE_MS) return { stale: true }
    const inTime = elapsed <= QUESTION_MS + LESSON_QUIZ.GRACE_MS
    const question = await ctx.db.get(attempt.questionIds[index])
    const correct = inTime && selectedIndex >= 0 && question?.correctIndex === selectedIndex
    return await recordAnswer(ctx, attempt, inTime ? selectedIndex : -1, correct)
  },
})

/** Time ran out on a question nobody answered (student left, lost connection, …). */
export const timeout = internalMutation({
  args: { attemptId: v.id('lessonQuizAttempts'), index: v.number() },
  handler: async (ctx, { attemptId, index }) => {
    const attempt = await ctx.db.get(attemptId)
    if (!attempt || attempt.status !== 'active' || attempt.index !== index) return
    await recordAnswer(ctx, attempt, -1, false)
  },
})
