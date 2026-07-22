import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/shared/ui/empty-state'
import { Badge } from '@/shared/ui/badge'
import { AttendanceMeter } from '@/shared/ui/attendance-meter'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { getGroupAttendanceOverview } from '@/shared/lib/stats'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'

const STATUS_LABEL = { present: 'Keldi', late: 'Kechikdi', absent: 'Kelmadi' }
const STATUS_CLASS = { present: 'text-success', late: 'text-warning', absent: 'text-destructive' }

/** Group's attendance history, one row per lesson (session) — expands to show who was
 * present/late/absent that day. Lessons saved before attendance existed have no records,
 * so they simply show 0/0/0 rather than being counted as absences. */
export function AttendanceHistory({ lessons, attendance, students }) {
  const [expandedId, setExpandedId] = useState(null)
  const sorted = [...lessons].sort((a, b) => b.lessonNumber - a.lessonNumber)
  const overview = getGroupAttendanceOverview(lessons, attendance)
  const studentById = new Map(students.map((s) => [s.id, s]))

  if (sorted.length === 0) {
    return <EmptyState icon={Calendar} title="Davomat yo'q" description="Hali birorta dars o'tkazilmagan." />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/60 p-4">
        <AttendanceMeter percent={overview.attendanceRate} label="Guruhning umumiy davomat darajasi" />
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="text-success">✓ {overview.presentCount} keldi</span>
          <span className="text-warning">⏱ {overview.lateCount} kechikdi</span>
          <span className="text-destructive">✕ {overview.absentCount} kelmadi</span>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {sorted.map((lesson) => {
          const records = attendance.filter((a) => a.lessonId === lesson.id)
          const presentCount = records.filter((r) => r.status === 'present').length
          const lateCount = records.filter((r) => r.status === 'late').length
          const absentCount = records.filter((r) => r.status === 'absent').length
          const isExpanded = expandedId === lesson.id

          return (
            <div key={lesson.id} className="py-3">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : lesson.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {lesson.lessonNumber}-dars{' '}
                      <span className="text-muted-foreground">• {getMonthLabel(lesson.monthIndex)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatUzDate(lesson.date, { withTime: true })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓ {presentCount}</Badge>
                  <Badge variant="warning">⏱ {lateCount}</Badge>
                  <Badge variant="destructive">✕ {absentCount}</Badge>
                  <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 grid grid-cols-1 gap-2 pl-12 sm:grid-cols-2">
                  {records.map((record) => {
                    const student = studentById.get(record.studentId)
                    if (!student) return null
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <StudentAvatar student={student} size="sm" />
                          <span className="truncate text-sm text-foreground">{student.fullName}</span>
                        </div>
                        <span className={cn('shrink-0 text-xs font-medium', STATUS_CLASS[record.status])}>
                          {STATUS_LABEL[record.status]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
