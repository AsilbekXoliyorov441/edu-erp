// Relative import on purpose: this module is shared with the Convex backend
// (`convex/monthlyGoal.js`), whose bundler doesn't know the `@/` alias.
import { COIN_CATEGORY_LIST, MONTHLY_GOAL } from '../../config/constants.js'

const HOUR_MS = 3600000

/** Most coins a student can earn in a single lesson (sum of every category's max). */
export const LESSON_MAX_COINS = COIN_CATEGORY_LIST.reduce((sum, c) => sum + c.max, 0)

/** A Date shifted so its UTC fields read as Tashkent wall-clock time. */
function toTashkent(value) {
  return new Date(new Date(value).getTime() + MONTHLY_GOAL.TZ_OFFSET_HOURS * HOUR_MS)
}

/** `YYYY-MM` calendar month of a timestamp, in Tashkent time. */
export function getMonthKey(value = new Date()) {
  const d = toTashkent(value)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function getPreviousMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}

/** Whether the goal rule applies to this month at all (it starts at `START_MONTH`). */
export function isGoalMonth(monthKey) {
  return monthKey >= MONTHLY_GOAL.START_MONTH
}

/** Whether `monthKey`'s grace period is over at `now`, i.e. the month may be closed. */
export function isMonthClosable(monthKey, now = new Date()) {
  const current = getMonthKey(now)
  if (monthKey >= current) return false
  if (monthKey < getPreviousMonthKey(current)) return true
  return toTashkent(now).getUTCDate() > MONTHLY_GOAL.CLOSE_GRACE_DAYS
}

/** Calendar days left in the current month, today included. */
export function getDaysLeftInMonth(now = new Date()) {
  const d = toTashkent(now)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  return lastDay - d.getUTCDate() + 1
}

/** Per-student progress toward the monthly goal for `monthKey`.
 *
 * - `possible` = lessons the student was on the roster for that month (every saved lesson
 *   writes one attendance row per student, absent ones included) × `LESSON_MAX_COINS`.
 *   Missing a lesson therefore still counts against the goal.
 * - `earned` = coins actually given in those same lessons.
 *
 * Inputs are plain arrays with a normalized `id` on lessons (the caller maps Convex `_id`),
 * so the same function runs in the browser and inside the monthly cron. */
export function computeMonthlyProgress({ monthKey, lessons, attendance, coinEntries }) {
  const monthLessonIds = new Set(lessons.filter((l) => getMonthKey(l.date) === monthKey).map((l) => l.id))
  const progress = new Map()

  const ensure = (studentId) => {
    if (!progress.has(studentId)) progress.set(studentId, { earned: 0, lessonCount: 0 })
    return progress.get(studentId)
  }

  attendance.forEach((record) => {
    if (monthLessonIds.has(record.lessonId)) ensure(record.studentId).lessonCount += 1
  })
  coinEntries.forEach((entry) => {
    if (monthLessonIds.has(entry.lessonId)) ensure(entry.studentId).earned += entry.value
  })

  const result = new Map()
  progress.forEach(({ earned, lessonCount }, studentId) => {
    result.set(studentId, summarizeProgress(earned, lessonCount * LESSON_MAX_COINS))
  })
  return result
}

/** Derived numbers for one student's month — shared by the live view and the cron. */
export function summarizeProgress(earned, possible) {
  const percent = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0
  const goalCoins = Math.ceil((possible * MONTHLY_GOAL.PERCENT) / 100)
  return {
    earned,
    possible,
    percent,
    goalCoins,
    coinsToGoal: Math.max(0, goalCoins - earned),
    reached: possible > 0 && percent >= MONTHLY_GOAL.PERCENT,
  }
}

/** UI tone for a percentage: comfortably on track, close to the line, or below it. */
export function getGoalTone(percent) {
  if (percent >= MONTHLY_GOAL.PERCENT) return 'good'
  if (percent >= MONTHLY_GOAL.PERCENT - 15) return 'warning'
  return 'danger'
}
