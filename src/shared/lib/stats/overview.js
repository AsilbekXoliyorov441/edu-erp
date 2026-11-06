import { COIN_CATEGORIES, STUDENT_STATUS } from '@/shared/config/constants'
import { getTotalCoinsDistributed } from '@/shared/lib/stats/balance'
import { LESSON_MAX_COINS, getDayKey, getMonthKey } from '@/shared/lib/stats/monthlyGoal'

export function getDashboardOverview({ groups, students, coinEntries, lessons, transactions }) {
  const activeStudents = students.filter((s) => s.status === STUDENT_STATUS.ACTIVE)

  // Real calendar month in Tashkent time (same as the monthly goal), not the legacy
  // "12 lessons = 1 oy" bucket.
  const thisMonth = getMonthKey()
  const lessonIdsThisMonth = new Set(lessons.filter((l) => getMonthKey(l.date) === thisMonth).map((l) => l.id))
  const coinsThisMonth = coinEntries
    .filter((e) => lessonIdsThisMonth.has(e.lessonId))
    .reduce((sum, e) => sum + e.value, 0)

  return {
    totalStudents: activeStudents.length,
    totalGroups: groups.length,
    totalCoinsDistributed: getTotalCoinsDistributed(transactions),
    coinsThisMonth,
  }
}

export function getGroupStats(group, students, lessons, coinEntries) {
  const groupStudents = students.filter((s) => s.groupId === group.id && s.status === STUDENT_STATUS.ACTIVE)
  const groupLessons = [...lessons.filter((l) => l.groupId === group.id)].sort((a, b) => b.lessonNumber - a.lessonNumber)
  const lastLesson = groupLessons[0] ?? null
  const groupStudentIds = new Set(groupStudents.map((s) => s.id))
  const totalCoins = coinEntries
    .filter((e) => groupStudentIds.has(e.studentId))
    .reduce((sum, e) => sum + e.value, 0)

  return {
    studentCount: groupStudents.length,
    lessonCount: groupLessons.length,
    lastLessonDate: lastLesson?.date ?? null,
    avgCoins: groupStudents.length ? Math.round(totalCoins / groupStudents.length) : 0,
  }
}

/** Lifetime lesson count and most recent lesson date for a student's group, for the
 * lesson-progress widget's headline tiles. */
export function getLessonProgress(group, lessons) {
  const groupLessons = [...lessons.filter((l) => l.groupId === group?.id)].sort((a, b) => a.lessonNumber - b.lessonNumber)
  const lastLesson = groupLessons[groupLessons.length - 1] ?? null

  return {
    totalLessons: groupLessons.length,
    lastLessonDate: lastLesson?.date ?? null,
  }
}

/** One student's per-lesson coins on a fixed scale: 0 coins = 0%, the lesson maximum
 * (`LESSON_MAX_COINS`) = 100%. Walks every lesson the group has held (not just ones with
 * entries) so lessons where the student earned 0 still show up at the bottom of the chart. */
export function getStudentLessonScores(studentId, group, lessons, coinEntries) {
  const groupLessons = [...lessons.filter((l) => l.groupId === group?.id)].sort((a, b) => a.lessonNumber - b.lessonNumber)

  const coinsByLesson = new Map()
  coinEntries
    .filter((e) => e.studentId === studentId)
    .forEach((e) => coinsByLesson.set(e.lessonId, (coinsByLesson.get(e.lessonId) ?? 0) + e.value))

  return groupLessons.map((lesson) => {
    const coins = coinsByLesson.get(lesson.id) ?? 0
    const percent = Math.min(100, (coins / LESSON_MAX_COINS) * 100)
    return { lessonNumber: lesson.lessonNumber, date: lesson.date, coins, percent }
  })
}

/** Coin totals over time for the trend chart. One group → one point per lesson; several
 * groups → one point per calendar day (lessons of different groups share lesson numbers, so
 * per-lesson points would be mixed up). Always chronological. */
export function getCoinTrend(lessons, coinEntries, { perLesson = false } = {}) {
  const coinsByLesson = new Map()
  coinEntries.forEach((e) => coinsByLesson.set(e.lessonId, (coinsByLesson.get(e.lessonId) ?? 0) + e.value))
  const sorted = [...lessons].sort((a, b) => a.date.localeCompare(b.date) || a.lessonNumber - b.lessonNumber)

  if (perLesson) {
    return sorted.map((lesson) => ({
      key: lesson.id,
      label: `${lesson.lessonNumber}-dars`,
      date: lesson.date,
      total: coinsByLesson.get(lesson.id) ?? 0,
    }))
  }

  const byDay = new Map()
  sorted.forEach((lesson) => {
    const day = getDayKey(lesson.date)
    const point = byDay.get(day) ?? { key: day, label: `${day.slice(8)}.${day.slice(5, 7)}`, date: lesson.date, total: 0, lessons: 0 }
    point.total += coinsByLesson.get(lesson.id) ?? 0
    point.lessons += 1
    byDay.set(day, point)
  })
  return [...byDay.values()]
}

/** Coins handed out per group, attributed by the lesson's group (a transferred student's old
 * coins stay with the group that gave them). Pass already period-scoped lessons. */
export function getGroupComparison(groups, coinEntries, lessons) {
  const groupByLesson = new Map(lessons.map((l) => [l.id, l.groupId]))
  const totals = new Map()
  coinEntries.forEach((e) => {
    const groupId = groupByLesson.get(e.lessonId)
    if (groupId) totals.set(groupId, (totals.get(groupId) ?? 0) + e.value)
  })
  return groups.map((group) => ({ groupId: group.id, groupName: group.name, total: totals.get(group.id) ?? 0 }))
}

/** Coins per category. Retired categories (Sinf ishi) are shown only when the entries
 * still contain them — older months were graded with them. */
export function getCategoryDistribution(coinEntries) {
  const totals = new Map()
  coinEntries.forEach((e) => totals.set(e.category, (totals.get(e.category) ?? 0) + e.value))
  return Object.values(COIN_CATEGORIES)
    .filter((c) => !c.retired || (totals.get(c.key) ?? 0) > 0)
    .map((c) => ({ key: c.key, label: c.label, total: totals.get(c.key) ?? 0 }))
}
