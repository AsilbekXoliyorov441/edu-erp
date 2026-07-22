import { CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/empty-state'
import { AttendanceMeter } from '@/shared/ui/attendance-meter'
import { getStudentAttendanceStats } from '@/shared/lib/stats'

export function StudentAttendanceSummary({ studentId, attendance }) {
  const stats = getStudentAttendanceStats(studentId, attendance)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="size-4 text-primary" /> Davomat
        </CardTitle>
        <CardDescription>Barcha darslardagi qatnashish ko'rsatkichi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {stats.trackedCount === 0 ? (
          <EmptyState icon={CalendarCheck} title="Ma'lumot yo'q" description="Hali davomat belgilanmagan." />
        ) : (
          <>
            <AttendanceMeter percent={stats.attendanceRate} label="Umumiy davomat darajasi" />
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <p className="text-lg font-bold text-success">{stats.presentCount}</p>
                <p className="text-xs text-muted-foreground">Keldi</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <p className="text-lg font-bold text-warning">{stats.lateCount}</p>
                <p className="text-xs text-muted-foreground">Kechikdi</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3 text-center">
                <p className="text-lg font-bold text-destructive">{stats.absentCount}</p>
                <p className="text-xs text-muted-foreground">Kelmadi</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
