import { motion } from 'framer-motion'
import { Calendar, Check, Clock, Users, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { RatingStepper } from '@/shared/ui/rating-stepper'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { useLessonSession } from '@/features/give-coin/model/useLessonSession'
import { cn } from '@/shared/lib/utils'

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Keldi', icon: Check, activeClass: 'border-success bg-success/15 text-success' },
  { value: 'late', label: 'Kechikdi', icon: Clock, activeClass: 'border-warning bg-warning/15 text-warning' },
  { value: 'absent', label: 'Kelmadi', icon: X, activeClass: 'border-destructive bg-destructive/15 text-destructive' },
]

function AttendanceToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 p-1">
      {ATTENDANCE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-muted-foreground transition-colors',
            value === option.value ? option.activeClass : 'hover:bg-accent',
          )}
        >
          <option.icon className="size-3.5" /> {option.label}
        </button>
      ))}
    </div>
  )
}

export function LessonSessionPanel({ group, students, nextLessonNumber, monthIndex, date, onDone, onCancel }) {
  const { scores, setScore, attendance, setAttendance, getRowTotal, save, saving } = useLessonSession({
    group,
    students,
    date,
  })

  const handleSave = async () => {
    await save()
    onDone()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              {nextLessonNumber}-dars • {getMonthLabel(monthIndex)}
            </CardTitle>
            <CardDescription>{formatUzDate(date)}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Sessiyani yopish">
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {students.length === 0 ? (
            <EmptyState icon={Users} title="O'quvchilar yo'q" description="Avval guruhga o'quvchi qo'shing." />
          ) : (
            <div className="divide-y divide-border/60">
              {students.map((student) => {
                const isAbsent = attendance[student.id] === 'absent'
                return (
                  <div key={student.id} className="flex flex-col gap-3 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar student={student} size="sm" />
                        <span className="truncate text-sm font-medium text-foreground">{student.fullName}</span>
                      </div>
                      <AttendanceToggle
                        value={attendance[student.id] ?? 'present'}
                        onChange={(status) => setAttendance(student.id, status)}
                      />
                    </div>
                    <div className={cn('flex flex-wrap items-center gap-4 sm:gap-6', isAbsent && 'opacity-50')}>
                      {COIN_CATEGORY_LIST.map((category) => (
                        <div key={category.key} className="flex flex-col items-center gap-1">
                          <span className="text-[11px] text-muted-foreground">{category.label}</span>
                          <RatingStepper
                            value={scores[student.id]?.[category.key] ?? 0}
                            max={category.max}
                            disabled={isAbsent}
                            onChange={(value) => setScore(student.id, category.key, value)}
                          />
                        </div>
                      ))}
                      <Badge variant="coin" className="min-w-16 justify-center text-sm">
                        {getRowTotal(student.id)} coin
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button onClick={handleSave} disabled={saving || students.length === 0} className="gap-1.5">
          <Check className="size-4" /> Saqlash
        </Button>
      </div>
    </motion.div>
  )
}
