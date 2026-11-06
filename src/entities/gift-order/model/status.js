export const ORDER_STATUS = {
  PENDING: 'pending',
  ORDERED: 'ordered',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

/** Label + badge tone per status. Teachers and students read the same words. */
export const ORDER_STATUS_META = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  ordered: { label: 'Buyurtma berildi', tone: 'default' },
  delivered: { label: 'Topshirildi', tone: 'success' },
  rejected: { label: 'Rad etildi', tone: 'destructive' },
  cancelled: { label: 'Bekor qilindi', tone: 'secondary' },
}

/** Coins a student has reserved in still-pending orders. */
export function getReservedCoins(orders, studentId) {
  return orders
    .filter((o) => o.studentId === studentId && o.status === ORDER_STATUS.PENDING)
    .reduce((sum, o) => sum + o.giftPrice, 0)
}
