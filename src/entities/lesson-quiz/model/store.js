import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

/** Student: the open lesson Q&A of their group, if any (drives the banner). */
export function useActiveLessonQuizForMe() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  return useQuery(api.lessonQuiz.activeForMe, token && role === 'student' ? { token } : 'skip')
}

/** Student: their own run of one Q&A. */
export function useMyLessonQuiz(quizId) {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.lessonQuiz.getMine, token && quizId ? { token, quizId } : 'skip')
}

/** Teacher: live per-student results. */
export function useLessonQuizResults(quizId) {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.lessonQuiz.getForTeacher, token && quizId ? { token, quizId } : 'skip')
}

export function useLessonQuizActions() {
  const token = useAuthStore((s) => s.token)
  const create = useMutation(api.lessonQuiz.create)
  const close = useMutation(api.lessonQuiz.close)
  const start = useMutation(api.lessonQuiz.start)
  const answer = useMutation(api.lessonQuiz.answer)
  return {
    create: (groupId, testIds) => create({ token, groupId, testIds }),
    close: (quizId, lessonId) => close({ token, quizId, ...(lessonId ? { lessonId } : {}) }),
    start: (quizId) => start({ token, quizId }),
    answer: (attemptId, index, selectedIndex) => answer({ token, attemptId, index, selectedIndex }),
  }
}
