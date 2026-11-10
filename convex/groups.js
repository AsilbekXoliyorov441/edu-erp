import { query, mutation, internalQuery } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScopedGroups, requireGroupOwner, getScope } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await getScopedGroups(ctx, token)
  },
})

const groupFields = {
  schedule: v.union(v.literal('odd'), v.literal('even')),
  startTime: v.string(),
  endTime: v.string(),
  direction: v.union(v.literal('frontend'), v.literal('python'), v.literal('ai'), v.literal('cyber'), v.literal('other')),
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function cleanFields({ name, startTime, endTime, ...rest }) {
  const trimmed = name.trim()
  if (!trimmed) throw new ConvexError('Guruh nomi kiritilmagan')
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) throw new ConvexError("Dars vaqti noto'g'ri")
  if (endTime <= startTime) throw new ConvexError("Dars tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak")
  return { name: trimmed, startTime, endTime, ...rest }
}

export const create = mutation({
  args: { token: v.string(), name: v.string(), ...groupFields },
  handler: async (ctx, { token, ...fields }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin || scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
    return await ctx.db.insert('groups', {
      ...cleanFields(fields),
      createdAt: new Date().toISOString(),
      teacherId: scope.session.userId,
    })
  },
})

export const update = mutation({
  args: { token: v.string(), id: v.id('groups'), name: v.string(), ...groupFields },
  handler: async (ctx, { token, id, ...fields }) => {
    await requireGroupOwner(ctx, token, id)
    await ctx.db.patch(id, cleanFields(fields))
  },
})

export const remove = mutation({
  args: { token: v.string(), id: v.id('groups') },
  handler: async (ctx, { token, id }) => {
    await requireGroupOwner(ctx, token, id)
    await ctx.db.delete(id)
  },
})

/** Used from Node actions (which have no `ctx.db`) to enforce group ownership before writing. */
export const requireGroupOwnerToken = internalQuery({
  args: { token: v.string(), groupId: v.id('groups') },
  handler: async (ctx, { token, groupId }) => {
    await requireGroupOwner(ctx, token, groupId)
  },
})
