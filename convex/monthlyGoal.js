import { query, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { getScopedStudentIdSet } from './lib/scoping'
import {
  computeMonthlyProgress,
  getMonthKey,
  getPreviousMonthKey,
  isGoalMonth,
  isMonthClosable,
} from '../src/shared/lib/stats/monthlyGoal.js'

/** Frozen results of already-closed months, for the student profile and admin views. */
export const listResults = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const studentIdSet = await getScopedStudentIdSet(ctx, token)
    const results = await ctx.db.query('monthlyGoalResults').collect()
    return results.filter((r) => studentIdSet.has(r.studentId))
  },
})

/** Closes a month: every student who was on a roster that month and didn't reach the goal
 * loses the coins they earned in it (a `coin_burned` transaction). The burn is capped at the
 * student's current balance so it can never go negative — coins already spent on a gift are
 * gone either way. Runs daily from `crons.js` for the previous month, once its grace period (`CLOSE_GRACE_DAYS`) is over; a student who already
 * has a result row for the month is skipped, so re-runs are no-ops. */
export const closeMonth = internalMutation({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, { month }) => {
    const monthKey = month ?? getPreviousMonthKey(getMonthKey())
    if (!isGoalMonth(monthKey) || !isMonthClosable(monthKey)) return { monthKey, processed: 0, burnedStudents: 0 }

    const lessons = (await ctx.db.query('lessons').collect())
      .filter((l) => getMonthKey(l.date) === monthKey)
      .map((l) => ({ id: l._id, date: l.date }))

    const attendance = []
    const coinEntries = []
    for (const lesson of lessons) {
      const byLesson = (q) => q.eq('lessonId', lesson.id)
      attendance.push(...(await ctx.db.query('attendance').withIndex('by_lesson', byLesson).collect()))
      coinEntries.push(...(await ctx.db.query('coinEntries').withIndex('by_lesson', byLesson).collect()))
    }

    const progress = computeMonthlyProgress({ monthKey, lessons, attendance, coinEntries })
    const alreadyClosed = new Set(
      (await ctx.db.query('monthlyGoalResults').withIndex('by_month', (q) => q.eq('month', monthKey)).collect()).map(
        (r) => r.studentId,
      ),
    )

    const now = new Date().toISOString()
    let processed = 0
    let burnedStudents = 0

    for (const [studentId, p] of progress) {
      if (alreadyClosed.has(studentId) || p.possible === 0) continue

      let burned = 0
      if (!p.reached && p.earned > 0) {
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_student', (q) => q.eq('studentId', studentId))
          .collect()
        const balance = transactions.reduce((sum, t) => (t.type === 'coin_given' ? sum + t.amount : sum - t.amount), 0)
        burned = Math.max(0, Math.min(p.earned, balance))
        if (burned > 0) {
          await ctx.db.insert('transactions', {
            studentId,
            type: 'coin_burned',
            amount: burned,
            month: monthKey,
            timestamp: now,
          })
          burnedStudents += 1
        }
      }

      await ctx.db.insert('monthlyGoalResults', {
        studentId,
        month: monthKey,
        earned: p.earned,
        possible: p.possible,
        percent: p.percent,
        reached: p.reached,
        burned,
        processedAt: now,
      })
      processed += 1
    }

    return { monthKey, processed, burnedStudents }
  },
})
