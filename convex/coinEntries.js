import { query } from './_generated/server'
import { v } from 'convex/values'
import { getScopedStudentIdSet } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const studentIdSet = await getScopedStudentIdSet(ctx, token)
    const entries = await ctx.db.query('coinEntries').collect()
    return entries.filter((e) => studentIdSet.has(e.studentId))
  },
})
