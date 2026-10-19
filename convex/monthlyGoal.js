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
 * loses coins earned in that calendar month (1st to last day, Tashkent time) — half of them
 * when they still got above `HALF_PERCENT`, all of them otherwise (see `getBurnAmount`) — as
 * a `coin_burned` transaction. Coins from other months are never touched: the burn is capped
 * at the balance as of the month's end (so later coins are safe) and at the current balance
 * (so it never goes negative — coins already spent on a gift are gone either way). Runs daily
 * from `crons.js` for the previous month, once its grace period (`CLOSE_GRACE_DAYS`) is over;
 * a student who already has a result row for the month is skipped, so re-runs are no-ops. */
export const closeMonth = internalMutation({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, { month }) => {
    const monthKey = month ?? getPreviousMonthKey(getMonthKey())
    if (!isGoalMonth(monthKey) || !isMonthClosable(monthKey)) return { monthKey, processed: 0, burnedStudents: 0 }

    // All lessons (not just this month's) — older ones tell which weekly track each group is on.
    const lessons = (await ctx.db.query('lessons').collect()).map((l) => ({ id: l._id, groupId: l.groupId, date: l.date }))
    const monthLessons = lessons.filter((l) => getMonthKey(l.date) === monthKey)

    const attendance = []
    const coinEntries = []
    for (const lesson of monthLessons) {
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
      if (p.burnAmount > 0) {
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_student', (q) => q.eq('studentId', studentId))
          .collect()
        const applyTxn = (sum, t) => (t.type === 'coin_given' ? sum + t.amount : sum - t.amount)
        const balance = transactions.reduce(applyTxn, 0)
        // Balance as it stood when the month ended — coins earned after it (e.g. Nov 1–3,
        // before the month is closed on the 4th) must never be burned for this month.
        const monthEndBalance = transactions.filter((t) => getMonthKey(t.timestamp) <= monthKey).reduce(applyTxn, 0)
        burned = Math.max(0, Math.min(p.burnAmount, monthEndBalance, balance))
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
