import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

export function useGroupStore(selector) {
  const token = useAuthStore((s) => s.token)
  const items = (useQuery(api.groups.list, token ? { token } : 'skip') ?? []).map(mapId)
  const createMutation = useMutation(api.groups.create)
  const updateMutation = useMutation(api.groups.update)
  const removeMutation = useMutation(api.groups.remove)

  return selector({
    items,
    create: (name) => createMutation({ token, name }),
    update: (id, name) => updateMutation({ token, id, name }),
    remove: (id) => removeMutation({ token, id }),
  })
}
