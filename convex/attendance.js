import { query } from './_generated/server'
import { v } from 'convex/values'
import { getScopedStudentIdSet } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const studentIdSet = await getScopedStudentIdSet(ctx, token)
    const records = await ctx.db.query('attendance').collect()
    return records.filter((r) => studentIdSet.has(r.studentId))
  },
})
