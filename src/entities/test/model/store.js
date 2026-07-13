import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** Teacher-side: every topic ("mavzu") the caller owns, with CRUD — the reusable question
 * bank that gets attached to groups instead of being recreated per lesson. */
export function useTopics() {
  const token = useAuthStore((s) => s.token)
  const items = (useQuery(api.tests.listForTeacher, token ? { token } : 'skip') ?? []).map(mapId)
  const createMutation = useMutation(api.tests.create)
  const updateMutation = useMutation(api.tests.update)
  const removeMutation = useMutation(api.tests.remove)

  return {
    items,
    create: (title) => createMutation({ token, title }),
    update: (id, title) => updateMutation({ token, id, title }),
    remove: (id) => removeMutation({ token, id }),
  }
}
