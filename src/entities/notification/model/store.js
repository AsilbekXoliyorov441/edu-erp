import { useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

export function useNotifications() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const enabled = token && role !== 'platform_admin'
  const data = useQuery(api.notifications.list, enabled ? { token } : 'skip')
  const markReadMutation = useMutation(api.notifications.markRead)
  const markAllReadMutation = useMutation(api.notifications.markAllRead)

  return useMemo(
    () => ({
      items: (data?.items ?? []).map(mapId),
      unreadCount: data?.unreadCount ?? 0,
      loaded: data !== undefined,
      markRead: (id) => markReadMutation({ token, id }),
      markAllRead: () => markAllReadMutation({ token }),
    }),
    [data, token, markReadMutation, markAllReadMutation],
  )
}
