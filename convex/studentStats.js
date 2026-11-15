import { query, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { getScopedGroupIdSet } from './lib/scoping'
import { refreshStudentStats } from './lib/studentStats'
import { internal } from './_generated/api'

/** Balance and coins-per-month for every student the caller can see — what the leaderboard
 * needs, without downloading the whole coin history. */
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    const rows = []
    for (const groupId of groupIdSet) {
      rows.push(
        ...(await ctx.db
          .query('studentStats')
          .withIndex('by_group', (q) => q.eq('groupId', groupId))
          .collect()),
      )
    }
    return rows.map((r) => ({ studentId: r.studentId, balance: r.balance, earnedByMonth: r.earnedByMonth }))
  },
})

/** Rebuild every row from the raw history. Backfill after deploying, and run nightly as a
 * safety net. Paged so one run stays within mutation limits:
 *   npx convex run studentStats:recomputeAll */
export const recomputeAll = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query('students').paginate({ cursor: cursor ?? null, numItems: 40 })
    await refreshStudentStats(ctx, page.page.map((s) => s._id))
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.studentStats.recomputeAll, { cursor: page.continueCursor })
    } else {
      // drop rows of students that no longer exist
      for (const row of await ctx.db.query('studentStats').collect()) {
        if (!(await ctx.db.get(row.studentId))) await ctx.db.delete(row._id)
      }
    }
    return { done: page.isDone, count: page.page.length }
  },
})
