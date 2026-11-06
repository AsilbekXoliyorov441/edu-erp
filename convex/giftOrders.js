import { query, mutation, internalQuery, internalMutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScope, requireStudentOwner } from './lib/scoping'
import { notify, getOrderHandlerIds } from './lib/notify'

/** Orders a student can have waiting at once — stops one session from flooding the queue. */
const MAX_PENDING_ORDERS = 3
const PIN_MAX_ATTEMPTS = 5
const PIN_LOCK_MS = 15 * 60 * 1000

async function getBalance(ctx, studentId) {
  const transactions = await ctx.db
    .query('transactions')
    .withIndex('by_student', (q) => q.eq('studentId', studentId))
    .collect()
  return transactions.reduce((sum, t) => (t.type === 'coin_given' ? sum + t.amount : sum - t.amount), 0)
}

async function getStudentOrders(ctx, studentId) {
  return await ctx.db
    .query('giftOrders')
    .withIndex('by_student', (q) => q.eq('studentId', studentId))
    .collect()
}

/** Balance minus coins reserved by the student's still-pending orders. */
async function getAvailable(ctx, studentId) {
  const balance = await getBalance(ctx, studentId)
  const orders = await getStudentOrders(ctx, studentId)
  const reserved = orders.filter((o) => o.status === 'pending').reduce((sum, o) => sum + o.giftPrice, 0)
  return { balance, reserved, available: balance - reserved, orders }
}

async function requireStudentSession(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'student') throw new ConvexError("Bu amal faqat o'quvchi uchun")
  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.status !== 'active') throw new ConvexError("O'quvchi topilmadi")
  return { scope, student }
}

/** The group's own teacher, or any admin of the order's center. */
async function requireOrderHandler(ctx, token, orderId) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
  const order = await ctx.db.get(orderId)
  if (!order) throw new ConvexError('Buyurtma topilmadi')
  if (order.centerId !== scope.centerId) throw new ConvexError("Bu buyurtmaga ruxsatingiz yo'q")
  if (!scope.all) {
    const group = await ctx.db.get(order.groupId)
    if (!group || group.teacherId !== scope.teacherId) throw new ConvexError("Bu buyurtmaga ruxsatingiz yo'q")
  }
  return { scope, order }
}

async function enrich(ctx, orders, { withBalance }) {
  const cache = new Map()
  const get = async (id) => {
    if (!id) return null
    if (!cache.has(id)) cache.set(id, await ctx.db.get(id))
    return cache.get(id)
  }
  const balances = new Map()
  const result = []
  for (const order of orders) {
    const student = await get(order.studentId)
    const group = await get(order.groupId)
    const handler = await get(order.handledBy)
    let studentBalance
    if (withBalance) {
      if (!balances.has(order.studentId)) balances.set(order.studentId, await getAvailable(ctx, order.studentId))
      studentBalance = balances.get(order.studentId)
    }
    result.push({
      ...order,
      studentName: student?.fullName ?? "O'chirilgan o'quvchi",
      groupName: group?.name ?? "O'chirilgan guruh",
      groupDirection: group?.direction ?? null,
      handledByName: handler?.fullName ?? null,
      ...(studentBalance ? { studentBalance: studentBalance.balance, studentReserved: studentBalance.reserved } : {}),
    })
  }
  return result.sort((a, b) => b.createdAt - a.createdAt)
}

/** Teacher/admin: every order of the groups they handle. Student: only their own. */
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin) return []

    if (scope.session.role === 'student') {
      return await enrich(ctx, await getStudentOrders(ctx, scope.session.userId), { withBalance: false })
    }

    const orders = await ctx.db
      .query('giftOrders')
      .withIndex('by_center', (q) => q.eq('centerId', scope.centerId))
      .collect()
    if (scope.all) return await enrich(ctx, orders, { withBalance: true })

    const ownGroups = await ctx.db
      .query('groups')
      .withIndex('by_teacher', (q) => q.eq('teacherId', scope.teacherId))
      .collect()
    const ownGroupIds = new Set(ownGroups.map((g) => g._id))
    return await enrich(
      ctx,
      orders.filter((o) => ownGroupIds.has(o.groupId)),
      { withBalance: true },
    )
  },
})

/** Student's own purchase-PIN state (never the hash). */
export const myPinStatus = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { student } = await requireStudentSession(ctx, token)
    const lockedUntil = student.pinLockedUntil && student.pinLockedUntil > Date.now() ? student.pinLockedUntil : null
    return { hasPin: Boolean(student.purchasePinHash), lockedUntil }
  },
})

// ---- Internal helpers for the PIN-checking actions in `giftOrdersActions.js` ----

export const getPinContext = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { student } = await requireStudentSession(ctx, token)
    return {
      studentId: student._id,
      pinHash: student.purchasePinHash ?? null,
      lockedUntil: student.pinLockedUntil ?? 0,
    }
  },
})

export const recordPinFailure = internalMutation({
  args: { studentId: v.id('students') },
  handler: async (ctx, { studentId }) => {
    const student = await ctx.db.get(studentId)
    const attempts = (student?.pinFailedAttempts ?? 0) + 1
    if (attempts >= PIN_MAX_ATTEMPTS) {
      await ctx.db.patch(studentId, { pinFailedAttempts: 0, pinLockedUntil: Date.now() + PIN_LOCK_MS })
      return { locked: true, remaining: 0 }
    }
    await ctx.db.patch(studentId, { pinFailedAttempts: attempts })
    return { locked: false, remaining: PIN_MAX_ATTEMPTS - attempts }
  },
})

export const savePinHash = internalMutation({
  args: { studentId: v.id('students'), pinHash: v.string() },
  handler: async (ctx, { studentId, pinHash }) => {
    await ctx.db.patch(studentId, { purchasePinHash: pinHash, pinFailedAttempts: 0, pinLockedUntil: undefined })
  },
})

/** Runs only after the action verified the PIN. Re-checks everything server-side. */
export const createOrder = internalMutation({
  args: { token: v.string(), giftId: v.id('gifts') },
  handler: async (ctx, { token, giftId }) => {
    const { scope, student } = await requireStudentSession(ctx, token)
    await ctx.db.patch(student._id, { pinFailedAttempts: 0 })

    if (!scope.centerId) throw new ConvexError("Guruhingiz markazga biriktirilmagan")
    const gift = await ctx.db.get(giftId)
    if (!gift || gift.centerId !== scope.centerId) throw new ConvexError("Sovg'a topilmadi")

    const { available, orders } = await getAvailable(ctx, student._id)
    const pendingCount = orders.filter((o) => o.status === 'pending').length
    if (pendingCount >= MAX_PENDING_ORDERS) {
      throw new ConvexError(`Bir vaqtda ${MAX_PENDING_ORDERS} tadan ortiq kutilayotgan buyurtma bo'lishi mumkin emas`)
    }
    if (available < gift.price) {
      throw new ConvexError(`Coin yetarli emas: ${available} coin mavjud, ${gift.price} coin kerak`)
    }

    const group = await ctx.db.get(student.groupId)
    const orderId = await ctx.db.insert('giftOrders', {
      studentId: student._id,
      groupId: student.groupId,
      centerId: scope.centerId,
      giftId,
      giftName: gift.name,
      giftPrice: gift.price,
      giftImage: gift.image,
      giftIcon: gift.icon,
      status: 'pending',
      createdAt: Date.now(),
    })

    await notify(ctx, await getOrderHandlerIds(ctx, group, scope.centerId), {
      type: 'order_new',
      title: 'Yangi buyurtma',
      body: `${student.fullName} (${group?.name ?? 'guruhsiz'}) — ${gift.name}, ${gift.price} coin`,
      orderId,
    })
    return orderId
  },
})

// ---- Student actions ----

export const cancel = mutation({
  args: { token: v.string(), orderId: v.id('giftOrders') },
  handler: async (ctx, { token, orderId }) => {
    const { scope, student } = await requireStudentSession(ctx, token)
    const order = await ctx.db.get(orderId)
    if (!order || order.studentId !== student._id) throw new ConvexError('Buyurtma topilmadi')
    if (order.status !== 'pending') throw new ConvexError("Bu buyurtmani endi bekor qilib bo'lmaydi")

    await ctx.db.patch(orderId, { status: 'cancelled', closedAt: Date.now() })
    const group = await ctx.db.get(order.groupId)
    await notify(ctx, await getOrderHandlerIds(ctx, group, scope.centerId), {
      type: 'order_cancelled',
      title: 'Buyurtma bekor qilindi',
      body: `${student.fullName} "${order.giftName}" buyurtmasini bekor qildi`,
      orderId,
    })
  },
})

// ---- Teacher / admin actions ----

/** "Buyurtma berdim" — the gift was actually ordered: coins are deducted now. */
export const markOrdered = mutation({
  args: { token: v.string(), orderId: v.id('giftOrders') },
  handler: async (ctx, { token, orderId }) => {
    const { scope, order } = await requireOrderHandler(ctx, token, orderId)
    if (order.status !== 'pending') throw new ConvexError("Buyurtma allaqachon ko'rib chiqilgan")

    // This order's own reservation is part of `reserved`, so compare against balance minus
    // the *other* pending orders.
    const { balance, reserved } = await getAvailable(ctx, order.studentId)
    if (balance - (reserved - order.giftPrice) < order.giftPrice) {
      throw new ConvexError(`O'quvchi balansida coin yetarli emas (${balance} coin). Buyurtmani rad eting.`)
    }

    const now = Date.now()
    const transactionId = await ctx.db.insert('transactions', {
      studentId: order.studentId,
      type: 'gift_redeemed',
      amount: order.giftPrice,
      relatedGiftId: order.giftId,
      timestamp: new Date(now).toISOString(),
    })
    await ctx.db.patch(orderId, { status: 'ordered', orderedAt: now, handledBy: scope.session.userId, transactionId })
    await notify(ctx, [order.studentId], {
      type: 'order_ordered',
      title: 'Buyurtmangiz qabul qilindi',
      body: `"${order.giftName}" buyurtma qilindi. Balansingizdan ${order.giftPrice} coin yechildi.`,
      orderId,
    })
  },
})

export const markDelivered = mutation({
  args: { token: v.string(), orderId: v.id('giftOrders') },
  handler: async (ctx, { token, orderId }) => {
    const { scope, order } = await requireOrderHandler(ctx, token, orderId)
    if (order.status !== 'ordered') throw new ConvexError('Avval "Buyurtma berdim" ni tasdiqlang')

    await ctx.db.patch(orderId, { status: 'delivered', deliveredAt: Date.now(), handledBy: scope.session.userId })
    await notify(ctx, [order.studentId], {
      type: 'order_delivered',
      title: "Sovg'angiz topshirildi",
      body: `"${order.giftName}" sizga topshirildi. Tabriklaymiz! 🎉`,
      orderId,
    })
  },
})

export const reject = mutation({
  args: { token: v.string(), orderId: v.id('giftOrders'), reason: v.optional(v.string()) },
  handler: async (ctx, { token, orderId, reason }) => {
    const { scope, order } = await requireOrderHandler(ctx, token, orderId)
    if (order.status !== 'pending') throw new ConvexError("Faqat kutilayotgan buyurtmani rad etish mumkin")

    const cleanReason = reason?.trim().slice(0, 300) || undefined
    await ctx.db.patch(orderId, {
      status: 'rejected',
      closedAt: Date.now(),
      handledBy: scope.session.userId,
      rejectReason: cleanReason,
    })
    await notify(ctx, [order.studentId], {
      type: 'order_rejected',
      title: 'Buyurtma rad etildi',
      body: `"${order.giftName}" rad etildi${cleanReason ? `: ${cleanReason}` : ''}. Coinlaringiz joyida.`,
      orderId,
    })
  },
})

/** For a student who forgot their PIN, or whose PIN was set by someone else. */
export const resetStudentPin = mutation({
  args: { token: v.string(), studentId: v.id('students') },
  handler: async (ctx, { token, studentId }) => {
    await requireStudentOwner(ctx, token, studentId)
    await ctx.db.patch(studentId, { purchasePinHash: undefined, pinFailedAttempts: 0, pinLockedUntil: undefined })
    await notify(ctx, [studentId], {
      type: 'pin_reset',
      title: 'Xarid PIN-kodi tiklandi',
      body: "Ustozingiz PIN-kodingizni o'chirdi. Keyingi buyurtmada yangi PIN o'rnating.",
    })
  },
})
