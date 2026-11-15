import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// 00:05 Tashkent time (UTC+5). `closeMonth` is a no-op until the previous month's grace
// period is over (on the 4th); the daily repeat after that is a safety net in case a run is
// missed — students already evaluated are skipped.
crons.daily('close monthly coin goal', { hourUTC: 19, minuteUTC: 5 }, internal.monthlyGoal.closeMonth, {})

// 00:30 Tashkent: rebuild the leaderboard totals from the raw coin history, so a missed
// refresh anywhere can never leave a wrong balance for more than a day.
crons.daily('recompute student stats', { hourUTC: 19, minuteUTC: 30 }, internal.studentStats.recomputeAll, {})

export default crons
