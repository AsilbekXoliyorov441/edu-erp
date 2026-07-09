/**
 * @typedef {Object} Gift
 * @property {string} id
 * @property {string} name
 * @property {string} icon - lucide-react icon key
 * @property {number} price
 */

import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

export function useGiftStore(selector) {
  const token = useAuthStore((s) => s.token)
  const items = (useQuery(api.gifts.list) ?? []).map(mapId)
  const createMutation = useMutation(api.gifts.create)
  const updateMutation = useMutation(api.gifts.update)
  const removeMutation = useMutation(api.gifts.remove)

  return selector({
    items,
    create: ({ name, icon, price, image }) => createMutation({ token, name, icon, price, image }),
    update: (id, { name, icon, price, image }) => updateMutation({ token, id, name, icon, price, image }),
    remove: (id) => removeMutation({ token, id }),
  })
}
