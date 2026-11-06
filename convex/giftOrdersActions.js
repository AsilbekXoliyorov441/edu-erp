'use node'

import { v, ConvexError } from 'convex/values'
import { action } from './_generated/server'
import { internal } from './_generated/api'
import { hashPassword, verifyPassword } from './lib/passwords'

const PIN_RE = /^\d{4,6}$/

function isWeakPin(pin) {
  if (/^(\d)\1+$/.test(pin)) return true // 0000, 1111
  const digits = pin.split('').map(Number)
  const step = digits[1] - digits[0]
  return Math.abs(step) === 1 && digits.every((d, i) => i === 0 || d - digits[i - 1] === step) // 1234, 4321
}

function lockMessage(lockedUntil) {
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000))
  return `PIN ko'p marta noto'g'ri kiritildi. ${minutes} daqiqadan keyin urinib ko'ring.`
}

/** Verifies the PIN with lockout. Throws on failure. */
async function checkPin(ctx, pinContext, pin) {
  if (pinContext.lockedUntil > Date.now()) throw new ConvexError(lockMessage(pinContext.lockedUntil))
  if (!pinContext.pinHash) throw new ConvexError("Avval xarid PIN-kodini o'rnating")
  if (!PIN_RE.test(pin) || !verifyPassword(pin, pinContext.pinHash)) {
    const { locked, remaining } = await ctx.runMutation(internal.giftOrders.recordPinFailure, {
      studentId: pinContext.studentId,
    })
    if (locked) throw new ConvexError(lockMessage(Date.now() + 15 * 60 * 1000))
    throw new ConvexError(`PIN noto'g'ri. Yana ${remaining} ta urinish qoldi.`)
  }
}

/** Places a gift order — only with the student's own purchase PIN. */
export const placeOrder = action({
  args: { token: v.string(), giftId: v.id('gifts'), pin: v.string() },
  handler: async (ctx, { token, giftId, pin }) => {
    const pinContext = await ctx.runQuery(internal.giftOrders.getPinContext, { token })
    await checkPin(ctx, pinContext, pin)
    return await ctx.runMutation(internal.giftOrders.createOrder, { token, giftId })
  },
})

/** Sets the purchase PIN the first time, or changes it (then `currentPin` is required). */
export const setPin = action({
  args: { token: v.string(), pin: v.string(), currentPin: v.optional(v.string()) },
  handler: async (ctx, { token, pin, currentPin }) => {
    const pinContext = await ctx.runQuery(internal.giftOrders.getPinContext, { token })
    if (pinContext.pinHash) await checkPin(ctx, pinContext, currentPin ?? '')

    if (!PIN_RE.test(pin)) throw new ConvexError("PIN 4–6 ta raqamdan iborat bo'lishi kerak")
    if (isWeakPin(pin)) throw new ConvexError("Juda oddiy PIN (masalan 1111 yoki 1234). Boshqasini tanlang")

    await ctx.runMutation(internal.giftOrders.savePinHash, { studentId: pinContext.studentId, pinHash: hashPassword(pin) })
  },
})
