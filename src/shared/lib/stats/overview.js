import { COIN_CATEGORY_LIST, STUDENT_STATUS } from '@/shared/config/constants'
import { getTotalCoinsDistributed } from '@/shared/lib/stats/balance'
import { LESSON_MAX_COINS } from '@/shared/lib/stats/monthlyGoal'

export function getDashboardOverview({ groups, students, coinEntries, lessons, transactions }) {
  const activeStudents = students.filter((s) => s.status === STUDENT_STATUS.ACTIVE)

  // Real calendar month (not the per-group "12 lessons = 1 oy" pacing bucket used for
  // progress charts) — otherwise a group with fewer lessons than others would have its
  // current activity excluded, and the figure wouldn't match what "this month" means here.
  const now = new Date()
  const lessonIdsThisMonth = new Set(
    lessons
      .filter((l) => {
        const lessonDate = new Date(l.date)
        return lessonDate.getFullYear() === now.getFullYear() && lessonDate.getMonth() === now.getMonth()
      })
      .map((l) => l.id),
  )
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

/** Per-lesson coin totals for a trend chart, optionally scoped to one group. */
export function getCoinTrend(lessons, coinEntries, { groupId } = {}) {
  const filteredLessons = [...lessons.filter((l) => (groupId ? l.groupId === groupId : true))].sort(
    (a, b) => a.lessonNumber - b.lessonNumber,
  )

  return filteredLessons.map((lesson) => ({
    lessonNumber: lesson.lessonNumber,
    date: lesson.date,
    monthIndex: lesson.monthIndex,
    total: coinEntries.filter((e) => e.lessonId === lesson.id).reduce((sum, e) => sum + e.value, 0),
  }))
}

export function getGroupComparison(groups, students, coinEntries, lessons = [], { monthIndex } = {}) {
  const lessonMonthById = new Map(lessons.map((l) => [l.id, l.monthIndex]))
  const scopedEntries = monthIndex
    ? coinEntries.filter((e) => lessonMonthById.get(e.lessonId) === monthIndex)
    : coinEntries

  return groups.map((group) => {
    const groupStudentIds = new Set(students.filter((s) => s.groupId === group.id).map((s) => s.id))
    const total = scopedEntries.filter((e) => groupStudentIds.has(e.studentId)).reduce((sum, e) => sum + e.value, 0)
    return { groupId: group.id, groupName: group.name, total }
  })
}

export function getCategoryDistribution(coinEntries, { groupId, students } = {}) {
  const allowedIds =
    groupId && students ? new Set(students.filter((s) => s.groupId === groupId).map((s) => s.id)) : null
  const totals = Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, 0]))
  coinEntries
    .filter((e) => (allowedIds ? allowedIds.has(e.studentId) : true))
    .forEach((e) => {
      totals[e.category] = (totals[e.category] ?? 0) + e.value
    })
  return COIN_CATEGORY_LIST.map((c) => ({ key: c.key, label: c.label, total: totals[c.key] }))
}
