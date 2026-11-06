import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireSession } from './lib/authz'

const PAGE_SIZE = 30

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireSession(ctx, token)
    const items = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientId', session.userId))
      .order('desc')
      .take(PAGE_SIZE)
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_recipient_read', (q) => q.eq('recipientId', session.userId).eq('read', false))
      .collect()
    return { items, unreadCount: unread.length }
  },
})

export const markRead = mutation({
  args: { token: v.string(), id: v.id('notifications') },
  handler: async (ctx, { token, id }) => {
    const session = await requireSession(ctx, token)
    const item = await ctx.db.get(id)
    if (!item || item.recipientId !== session.userId) throw new ConvexError('Bildirishnoma topilmadi')
    if (!item.read) await ctx.db.patch(id, { read: true })
  },
})

export const markAllRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireSession(ctx, token)
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_recipient_read', (q) => q.eq('recipientId', session.userId).eq('read', false))
      .collect()
    for (const item of unread) await ctx.db.patch(item._id, { read: true })
  },
})
