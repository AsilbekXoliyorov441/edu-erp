import { useQuery, useMutation, useConvex } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** The combined quiz for one lesson (every attached test's questions merged) — never
 * includes the correct answer; used by both the teacher preview and the student flow. */
export function useQuizForLesson(lessonId) {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.quiz.getQuizForLesson, token && lessonId ? { token, lessonId } : 'skip')
}

/** Imperative (not reactive) check for one answer, called right when the student picks
 * it — the instant per-question feedback that `getQuizForLesson` deliberately can't give. */
export function useCheckAnswer() {
  const token = useAuthStore((s) => s.token)
  const convex = useConvex()
  return (questionId, selectedIndex) => convex.query(api.quiz.checkAnswer, { token, questionId, selectedIndex })
}

export function useSubmitAttempt() {
  const token = useAuthStore((s) => s.token)
  const submitMutation = useMutation(api.quiz.submitAttempt)
  return (lessonId, answers) => submitMutation({ token, lessonId, answers })
}

/** The logged-in student's own attempt history, for a "best score" badge per lesson. */
export function useMyAttempts() {
  const token = useAuthStore((s) => s.token)
  return (useQuery(api.quiz.listMyAttempts, token ? { token } : 'skip') ?? []).map(mapId)
}

/** Teacher-side: every student attempt recorded for one lesson. */
export function useLessonAttempts(lessonId) {
  const token = useAuthStore((s) => s.token)
  return (useQuery(api.quiz.listAttemptsForLesson, token && lessonId ? { token, lessonId } : 'skip') ?? []).map(mapId)
}
