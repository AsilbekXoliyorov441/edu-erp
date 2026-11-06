import { useMemo } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** Teacher/admin: orders of the groups they handle. Student: their own orders. */
export function useGiftOrders() {
  const token = useAuthStore((s) => s.token)
  const data = useQuery(api.giftOrders.list, token ? { token } : 'skip')
  return useMemo(() => ({ items: (data ?? []).map(mapId), loading: data === undefined }), [data])
}

export function useMyPinStatus() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  return useQuery(api.giftOrders.myPinStatus, token && role === 'student' ? { token } : 'skip')
}

export function useGiftOrderActions() {
  const token = useAuthStore((s) => s.token)
  const placeOrder = useAction(api.giftOrdersActions.placeOrder)
  const setPin = useAction(api.giftOrdersActions.setPin)
  const cancel = useMutation(api.giftOrders.cancel)
  const markOrdered = useMutation(api.giftOrders.markOrdered)
  const markDelivered = useMutation(api.giftOrders.markDelivered)
  const reject = useMutation(api.giftOrders.reject)
  const resetStudentPin = useMutation(api.giftOrders.resetStudentPin)

  return {
    placeOrder: (giftId, pin) => placeOrder({ token, giftId, pin }),
    setPin: (pin, currentPin) => setPin({ token, pin, currentPin }),
    cancel: (orderId) => cancel({ token, orderId }),
    markOrdered: (orderId) => markOrdered({ token, orderId }),
    markDelivered: (orderId) => markDelivered({ token, orderId }),
    reject: (orderId, reason) => reject({ token, orderId, reason }),
    resetStudentPin: (studentId) => resetStudentPin({ token, studentId }),
  }
}
