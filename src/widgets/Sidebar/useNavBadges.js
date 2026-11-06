import { useAuthStore } from '@/entities/session/model/store'
import { useGiftOrders } from '@/entities/gift-order/model/store'
import { ORDER_STATUS } from '@/entities/gift-order/model/status'
import { ROLES } from '@/shared/config/constants'

/** Counters shown next to nav items, keyed by the item's `badge`. Teachers see how many
 * gift orders wait for a decision. */
export function useNavBadges() {
  const role = useAuthStore((s) => s.role)
  const { items } = useGiftOrders()
  if (role !== ROLES.TEACHER) return {}
  return { orders: items.filter((o) => o.status === ORDER_STATUS.PENDING).length }
}
