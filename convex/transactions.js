import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScopedStudentIdSet, requireStudentOwner } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const studentIdSet = await getScopedStudentIdSet(ctx, token)
    const transactions = await ctx.db.query('transactions').collect()
    return transactions.filter((t) => studentIdSet.has(t.studentId))
  },
})

/** Recomputes the student's balance from the transaction log server-side and rejects
 * atomically if it's insufficient, instead of trusting a client-precomputed balance. */
export const redeemGift = mutation({
  args: { token: v.string(), studentId: v.id('students'), giftId: v.id('gifts') },
  handler: async (ctx, { token, studentId, giftId }) => {
    await requireStudentOwner(ctx, token, studentId)

    const gift = await ctx.db.get(giftId)
    if (!gift) throw new ConvexError("Sovg'a topilmadi")

    const student = await ctx.db.get(studentId)
    const group = student ? await ctx.db.get(student.groupId) : null
    const owner = group?.teacherId ? await ctx.db.get(group.teacherId) : null
    if (!owner || owner.centerId !== gift.centerId) throw new ConvexError("Bu sovg'a boshqa markazga tegishli")

    const studentTransactions = await ctx.db
      .query('transactions')
      .withIndex('by_student', (q) => q.eq('studentId', studentId))
      .collect()
    const balance = studentTransactions.reduce(
      (sum, t) => (t.type === 'coin_given' ? sum + t.amount : sum - t.amount),
      0,
    )
    if (balance < gift.price) throw new ConvexError("Balansda yetarli coin yo'q")

    await ctx.db.insert('transactions', {
      studentId,
      type: 'gift_redeemed',
      amount: gift.price,
      relatedGiftId: giftId,
      timestamp: new Date().toISOString(),
    })
  },
})
