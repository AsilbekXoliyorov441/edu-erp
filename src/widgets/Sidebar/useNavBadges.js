import { useAuthStore } from '@/entities/session/model/store'
import { useGiftOrders } from '@/entities/gift-order/model/store'
import { ORDER_STATUS } from '@/entities/gift-order/model/status'
import { usePendingClaimCount } from '@/entities/town/model/store'
import { useMyOpenHomeworkCount } from '@/entities/homework/model/store'
import { ROLES } from '@/shared/config/constants'

/** Counters shown next to nav items, keyed by the item's `badge`. Teachers see how many
 * gift orders (and, for admins, insurance claims) wait for a decision. */
export function useNavBadges() {
  const role = useAuthStore((s) => s.role)
  const { items } = useGiftOrders()
  const claims = usePendingClaimCount()
  const homework = useMyOpenHomeworkCount()
  if (role === ROLES.STUDENT) return { homework }
  if (role !== ROLES.TEACHER) return {}
  return { orders: items.filter((o) => o.status === ORDER_STATUS.PENDING).length, claims }
}
