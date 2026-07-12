import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** Teacher-side: tests attached to one lesson, with CRUD. */
export function useTestsForLesson(lessonId) {
  const token = useAuthStore((s) => s.token)
  const items = (useQuery(api.tests.listForTeacher, token && lessonId ? { token, lessonId } : 'skip') ?? []).map(mapId)
  const createMutation = useMutation(api.tests.create)
  const updateMutation = useMutation(api.tests.update)
  const removeMutation = useMutation(api.tests.remove)

  return {
    items,
    create: (title) => createMutation({ token, lessonId, title }),
    update: (id, title) => updateMutation({ token, id, title }),
    remove: (id) => removeMutation({ token, id }),
  }
}

/** Every lessonId (within the caller's scope) that has at least one test attached. */
export function useTestedLessonIds() {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.tests.listLessonIdsWithTests, token ? { token } : 'skip') ?? []
}
