import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** Teacher-side: questions belonging to one test, with CRUD (includes `correctIndex` —
 * editing view only, never exposed to students via this hook). */
export function useQuestionsForTest(testId) {
  const token = useAuthStore((s) => s.token)
  const items = (useQuery(api.testQuestions.listForTeacher, token && testId ? { token, testId } : 'skip') ?? []).map(mapId)
  const createMutation = useMutation(api.testQuestions.create)
  const updateMutation = useMutation(api.testQuestions.update)
  const removeMutation = useMutation(api.testQuestions.remove)

  return {
    items,
    create: (question) => createMutation({ token, testId, ...question }),
    update: (id, question) => updateMutation({ token, id, ...question }),
    remove: (id) => removeMutation({ token, id }),
  }
}
