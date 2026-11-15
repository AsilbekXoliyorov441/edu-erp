import { STUDENT_STATUS } from '@/shared/config/constants'
import { getStudentBalance } from '@/shared/lib/stats/balance'

/** Lifetime ranking (earned minus redeemed), optionally scoped to a group. */
export function getLeaderboard(students, transactions, { groupId } = {}) {
  const pool = students
    .filter((s) => s.status === STUDENT_STATUS.ACTIVE)
    .filter((s) => (groupId ? s.groupId === groupId : true))

  return pool
    .map((student) => ({ student, total: getStudentBalance(student.id, transactions) }))
    .sort((a, b) => b.total - a.total)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

/** Ranking scoped to coins earned within a specific "oy" (month), ignoring redemptions. */
export function getLeaderboardByPeriod(students, coinEntries, lessons, { groupId, monthIndex } = {}) {
  const lessonById = new Map(lessons.map((l) => [l.id, l]))
  const pool = students
    .filter((s) => s.status === STUDENT_STATUS.ACTIVE)
    .filter((s) => (groupId ? s.groupId === groupId : true))

  const totals = new Map(pool.map((s) => [s.id, 0]))
  coinEntries.forEach((entry) => {
    if (!totals.has(entry.studentId)) return
    const lesson = lessonById.get(entry.lessonId)
    if (!lesson) return
    if (monthIndex && lesson.monthIndex !== monthIndex) return
    totals.set(entry.studentId, (totals.get(entry.studentId) ?? 0) + entry.value)
  })

  return pool
    .map((student) => ({ student, total: totals.get(student.id) ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

/** Ranking from the precomputed `studentStats` rows (see `useStudentStats`): lifetime
 * balance, or coins earned in one course month when `monthIndex` is given. */
export function getLeaderboardFromStats(students, statsById, { groupId, monthIndex } = {}) {
  return students
    .filter((s) => s.status === STUDENT_STATUS.ACTIVE)
    .filter((s) => (groupId ? s.groupId === groupId : true))
    .map((student) => {
      const row = statsById.get(student.id)
      const total = monthIndex ? (row?.earnedByMonth?.[String(monthIndex)] ?? 0) : (row?.balance ?? 0)
      return { student, total }
    })
    .sort((a, b) => b.total - a.total)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}
