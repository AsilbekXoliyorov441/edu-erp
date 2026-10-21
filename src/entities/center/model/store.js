import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'
import { ROLES } from '@/shared/config/constants'

export function useCenterStore(selector) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const canQuery = role === ROLES.PLATFORM_ADMIN && !!token
 
  const items = (useQuery(api.centers.list, canQuery ? { token } : 'skip') ?? []).map(mapId)

  const createMutation = useMutation(api.centers.create)
  const updateStatusMutation = useMutation(api.centers.updateStatus)
  const renewMutation = useMutation(api.centers.renewSubscription)
  const createDirectorAction = useAction(api.teachersActions.createDirector)

  return selector({
    items,
    create: (name, subscriptionPrice, periodDays) => createMutation({ token, name, subscriptionPrice, periodDays }),
    updateStatus: (centerId, status) => updateStatusMutation({ token, centerId, status }),
    renew: (centerId, amount, periodDays, note) => renewMutation({ token, centerId, amount, periodDays, note }),
    createDirector: (centerId, username, password, fullName) =>
      createDirectorAction({ token, centerId, username, password, fullName }),
  })
}
