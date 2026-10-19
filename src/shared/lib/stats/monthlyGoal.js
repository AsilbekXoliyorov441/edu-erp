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

/** Weekly lesson days (JS `getDay()` numbers): 3 lessons a week, either the "toq kunlar"
 * (Mon/Wed/Fri) or the "juft kunlar" (Tue/Thu/Sat) track. */
export const LESSON_WEEKDAYS = { odd: [1, 3, 5], even: [2, 4, 6] }

function tashkentWeekday(value) {
  return toTashkent(value).getUTCDay()
}

function tashkentDayOfMonth(value) {
  return toTashkent(value).getUTCDate()
}

/** Which weekly track a group follows, inferred from the weekdays its lessons were actually
 * held on (groups don't store a schedule). Defaults to Mon/Wed/Fri until it has lessons. */
export function inferGroupSchedule(groupLessons) {
  let odd = 0
  let even = 0
  groupLessons.forEach((l) => {
    const day = tashkentWeekday(l.date)
    if (LESSON_WEEKDAYS.odd.includes(day)) odd += 1
    else if (LESSON_WEEKDAYS.even.includes(day)) even += 1
  })
  return even > odd ? 'even' : 'odd'
}

function lastDayOfMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** How many lesson days `schedule` has in `monthKey` between days `fromDay` and `toDay`
 * (1-based, inclusive) — so the total differs month to month (e.g. 13 Mon/Wed/Fri days in
 * one month, 14 in another). */
export function countLessonDays(monthKey, schedule, fromDay = 1, toDay = lastDayOfMonth(monthKey)) {
  const [year, month] = monthKey.split('-').map(Number)
  const weekdays = LESSON_WEEKDAYS[schedule]
  let count = 0
  for (let day = fromDay; day <= toDay; day += 1) {
    if (weekdays.includes(new Date(Date.UTC(year, month - 1, day)).getUTCDay())) count += 1
  }
  return count
}

/** Per-student progress toward the monthly goal for `monthKey`.
 *
 * - `possible` (the month's total) = the lesson days the student's group has in the whole
 *   calendar month (3 a week, see `countLessonDays`) × `LESSON_MAX_COINS`. A student who
 *   joined mid-month, or a group that started mid-month, counts from the first lesson. It
 *   comes from the calendar only — extra lessons entered on top never raise the total.
 * - `earned` = coins given in that month's lessons. Missing a lesson still counts against
 *   the goal, since it stays in the total.
 *
 * `lessons` must be ALL lessons (any month) with `id`, `groupId` and `date` — older ones
 * are needed to infer each group's weekly track. Runs in the browser and in the cron. */
export function computeMonthlyProgress({ monthKey, lessons, attendance, coinEntries, now = new Date() }) {
  const lessonsByGroup = new Map()
  lessons.forEach((l) => {
    if (!lessonsByGroup.has(l.groupId)) lessonsByGroup.set(l.groupId, [])
    lessonsByGroup.get(l.groupId).push(l)
  })
  const scheduleByGroup = new Map([...lessonsByGroup].map(([groupId, list]) => [groupId, inferGroupSchedule(list)]))

  const groupFirstMonth = new Map(
    [...lessonsByGroup].map(([groupId, list]) => [groupId, list.map((l) => getMonthKey(l.date)).sort()[0]]),
  )

  const monthLessonById = new Map(lessons.filter((l) => getMonthKey(l.date) === monthKey).map((l) => [l.id, l]))
  const firstLessonDayByGroup = new Map()
  monthLessonById.forEach((l) => {
    const day = tashkentDayOfMonth(l.date)
    if (!firstLessonDayByGroup.has(l.groupId) || day < firstLessonDayByGroup.get(l.groupId)) {
      firstLessonDayByGroup.set(l.groupId, day)
    }
  })

  // How far into the month we are: today for the current month, the last day for a past one.
  const lastDay = lastDayOfMonth(monthKey)
  const currentMonthKey = getMonthKey(now)
  const today = monthKey === currentMonthKey ? tashkentDayOfMonth(now) : monthKey < currentMonthKey ? lastDay : 0

  const progress = new Map()
  const ensure = (studentId) => {
    if (!progress.has(studentId)) progress.set(studentId, { earned: 0, heldLessons: 0, lastLesson: null, firstDay: 99 })
    return progress.get(studentId)
  }

  attendance.forEach((record) => {
    const lesson = monthLessonById.get(record.lessonId)
    if (!lesson) return
    const p = ensure(record.studentId)
    p.heldLessons += 1
    p.firstDay = Math.min(p.firstDay, tashkentDayOfMonth(lesson.date))
    if (!p.lastLesson || lesson.date > p.lastLesson.date) p.lastLesson = lesson
  })
  coinEntries.forEach((entry) => {
    const lesson = monthLessonById.get(entry.lessonId)
    if (!lesson) return
    const p = ensure(entry.studentId)
    p.earned += entry.value
    // Lessons saved before attendance existed have coins but no attendance rows — still
    // enough to tell which group/month the student was in.
    p.firstDay = Math.min(p.firstDay, tashkentDayOfMonth(lesson.date))
    if (!p.lastLesson || lesson.date > p.lastLesson.date) p.lastLesson = lesson
  })

  const result = new Map()
  progress.forEach(({ earned, heldLessons, lastLesson, firstDay }, studentId) => {
    if (!lastLesson) return
    const groupId = lastLesson.groupId
    // On the roster from the group's first lesson of the month → the whole month counts;
    // otherwise (joined/transferred later) only from their own first lesson. A group that
    // only started this month counts from its very first lesson.
    const groupStartedThisMonth = groupFirstMonth.get(groupId) === monthKey
    const fromDay =
      firstDay > firstLessonDayByGroup.get(groupId) || groupStartedThisMonth ? firstDay : 1
    const schedule = scheduleByGroup.get(groupId) ?? 'odd'
    const totalLessons = countLessonDays(monthKey, schedule, fromDay)
    const elapsedLessons = Math.min(totalLessons, Math.max(heldLessons > 0 ? 1 : 0, countLessonDays(monthKey, schedule, fromDay, today)))
    result.set(studentId, summarizeProgress(earned, totalLessons, elapsedLessons))
  })
  return result
}

/** One student's results for every calendar month they had lessons in, oldest first —
 * the same numbers the goal uses, for the profile's month-by-month chart. */
export function getStudentMonthlyHistory(studentId, { lessons, attendance, coinEntries }) {
  const lessonById = new Map(lessons.map((l) => [l.id, l]))
  const monthKeys = new Set()
  ;[...attendance, ...coinEntries].forEach((row) => {
    if (row.studentId !== studentId) return
    const lesson = lessonById.get(row.lessonId)
    if (lesson) monthKeys.add(getMonthKey(lesson.date))
  })

  return [...monthKeys].sort().map((monthKey) => {
    const progress = computeMonthlyProgress({ monthKey, lessons, attendance, coinEntries }).get(studentId)
    return { monthKey, ...progress }
  })
}

/** Derived numbers for one student's month — shared by the live view and the cron.
 * `percent` is against the whole month's total; `pacePercent` only against the scheduled
 * lessons up to today, i.e. whether the student is on track mid-month. */
export function summarizeProgress(earned, totalLessons, elapsedLessons = totalLessons) {
  const possible = totalLessons * LESSON_MAX_COINS
  const percent = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0
  const goalCoins = Math.ceil((possible * MONTHLY_GOAL.PERCENT) / 100)
  const remainingLessons = Math.max(0, totalLessons - elapsedLessons)
  const elapsedPossible = elapsedLessons * LESSON_MAX_COINS
  const reached = possible > 0 && earned >= goalCoins
  const halfCoins = Math.floor((possible * MONTHLY_GOAL.HALF_PERCENT) / 100) + 1
  const halfReached = reached || (possible > 0 && earned >= halfCoins)
  return {
    earned,
    possible,
    percent,
    goalCoins,
    coinsToGoal: Math.max(0, goalCoins - earned),
    reached,
    /** Above `HALF_PERCENT` — if the month closed now, half of its coins would be kept. */
    halfReached,
    halfCoins,
    coinsToHalf: Math.max(0, halfCoins - earned),
    /** Coins that would burn if the month closed with this result. */
    burnAmount: getBurnAmount({ earned, reached, halfReached }),
    totalLessons,
    elapsedLessons,
    remainingLessons,
    pacePercent: elapsedPossible > 0 ? Math.round((earned / elapsedPossible) * 1000) / 10 : 0,
    /** Even full marks in every remaining lesson can't reach the goal any more. */
    goalUnreachable: !reached && earned + remainingLessons * LESSON_MAX_COINS < goalCoins,
    /** …nor the half line. */
    halfUnreachable: !halfReached && earned + remainingLessons * LESSON_MAX_COINS < halfCoins,
  }
}

/** ≥ goal → nothing burns; above the half line → half burns (rounded in the student's
 * favour, they keep the odd coin); otherwise the whole month's coins burn. */
export function getBurnAmount({ earned, reached, halfReached }) {
  if (reached) return 0
  if (halfReached) return Math.floor(earned / 2)
  return earned
}

/** Live-view tone: secured → good; can no longer make it → danger; otherwise judged by the
 * pace so far, so a student who is on track mid-month isn't shown red just because the
 * month isn't over. */
export function getProgressTone(progress) {
  if (!progress || progress.possible === 0) return 'good'
  if (progress.reached) return 'good'
  if (progress.goalUnreachable) return progress.halfUnreachable ? 'danger' : 'warning'
  return getGoalTone(progress.pacePercent)
}

/** UI tone for a percentage: goal reached, above the half line, or below it. */
export function getGoalTone(percent) {
  if (percent >= MONTHLY_GOAL.PERCENT) return 'good'
  if (percent > MONTHLY_GOAL.HALF_PERCENT) return 'warning'
  return 'danger'
}
