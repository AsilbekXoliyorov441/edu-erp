import { query } from './_generated/server'
import { v } from 'convex/values'
import { collectByStudents, getScopedStudentIdSet } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const studentIdSet = await getScopedStudentIdSet(ctx, token)
    return await collectByStudents(ctx, 'attendance', studentIdSet)
  },
})
