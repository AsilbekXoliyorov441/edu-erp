import { query, mutation, internalQuery } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScopedGroupIdSet, requireGroupOwner, getScope } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    const groups = await ctx.db.query('groups').collect()
    return groupIdSet === null ? groups : groups.filter((g) => groupIdSet.has(g._id))
  },
})

export const create = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, { token, name }) => {
    const scope = await getScope(ctx, token)
    if (scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
    return await ctx.db.insert('groups', { name, createdAt: new Date().toISOString(), teacherId: scope.session.userId })
  },
})

export const update = mutation({
  args: { token: v.string(), id: v.id('groups'), name: v.string() },
  handler: async (ctx, { token, id, name }) => {
    await requireGroupOwner(ctx, token, id)
    await ctx.db.patch(id, { name })
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
