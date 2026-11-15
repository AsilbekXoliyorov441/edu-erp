import { query } from './_generated/server'
import { v } from 'convex/values'
import { collectScopedHistory } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await collectScopedHistory(ctx, token, 'attendance')
  },
})
