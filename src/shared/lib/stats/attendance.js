import { STUDENT_STATUS } from '@/shared/config/constants'

/** `attendanceRate` is null (not 0) when nothing has been tracked yet, so callers can tell
 * "no data" apart from "0% attendance" instead of treating untracked lessons as absences. */
function summarizeAttendance(records) {
  const presentCount = records.filter((r) => r.status === 'present').length
  const lateCount = records.filter((r) => r.status === 'late').length
  const absentCount = records.filter((r) => r.status === 'absent').length
  const trackedCount = records.length
  const attendanceRate = trackedCount ? ((presentCount + lateCount) / trackedCount) * 100 : null

  return { trackedCount, presentCount, lateCount, absentCount, attendanceRate }
}

/** A group's attendance across its own lessons only — `attendance` is filtered down to the
 * lesson IDs the caller already scoped to this group. */
export function getGroupAttendanceOverview(groupLessons, attendance) {
  const lessonIds = new Set(groupLessons.map((l) => l.id))
  return summarizeAttendance(attendance.filter((a) => lessonIds.has(a.lessonId)))
}

export function getStudentAttendanceStats(studentId, attendance) {
  return summarizeAttendance(attendance.filter((a) => a.studentId === studentId))
}

/** Center-wide attendance rate for the SuperAdmin block's headline meter — director-level
 * summary, so it only counts currently-active students. */
export function getSuperAdminAttendanceOverview({ students, attendance }) {
  const activeStudentIds = new Set(students.filter((s) => s.status === STUDENT_STATUS.ACTIVE).map((s) => s.id))
  return summarizeAttendance(attendance.filter((a) => activeStudentIds.has(a.studentId)))
}

/** Per-teacher attendance breakdown, parallel to `getTeacherComparison` in adminOverview.js —
 * meant to sit as an extra column in the same comparison table. */
export function getTeacherAttendanceComparison({ teachers, groups, lessons, attendance }) {
  return teachers.map((teacher) => {
    const teacherGroupIds = new Set(groups.filter((g) => g.teacherId === teacher.id).map((g) => g.id))
    const teacherLessonIds = new Set(lessons.filter((l) => teacherGroupIds.has(l.groupId)).map((l) => l.id))
    return { teacherId: teacher.id, ...summarizeAttendance(attendance.filter((a) => teacherLessonIds.has(a.lessonId))) }
  })
}

/** Active students below `thresholdPercent` attendance, worth a director/admin's attention —
 * students with zero tracked lessons are excluded rather than flagged, since there's nothing
 * to judge them on yet. Sorted worst-first. */
export function getAtRiskStudents({ students, groups, attendance }, thresholdPercent = 70) {
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]))

  return students
    .filter((s) => s.status === STUDENT_STATUS.ACTIVE)
    .map((student) => ({
      studentId: student.id,
      fullName: student.fullName,
      groupId: student.groupId,
      groupName: groupNameById.get(student.groupId) ?? '—',
      ...getStudentAttendanceStats(student.id, attendance),
    }))
    .filter((s) => s.attendanceRate !== null && s.attendanceRate < thresholdPercent)
    .sort((a, b) => a.attendanceRate - b.attendanceRate)
}
