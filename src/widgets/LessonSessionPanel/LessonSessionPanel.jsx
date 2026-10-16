import { motion } from 'framer-motion'
import { Calendar, Check, Clock, Coins, Sparkles, Users, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { ScoreSelector } from '@/shared/ui/score-selector'
import { GoalProgressInline } from '@/shared/ui/goal-progress'
import { EmptyState } from '@/shared/ui/empty-state'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { useCurrentMonthGoal } from '@/entities/monthly-goal/model/store'
import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { LESSON_MAX_COINS } from '@/shared/lib/stats/monthlyGoal'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { useLessonSession } from '@/features/give-coin/model/useLessonSession'
import { cn } from '@/shared/lib/utils'

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Keldi', icon: Check, activeClass: 'border-blue-500 bg-blue-500 text-white' },
  { value: 'late', label: 'Kechikdi', icon: Clock, activeClass: 'border-amber-500 bg-amber-500 text-white' },
  { value: 'absent', label: 'Kelmadi', icon: X, activeClass: 'border-red-500 bg-red-500 text-white' },
]

function AttendanceToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
      {ATTENDANCE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
            value === option.value
              ? option.activeClass
              : 'border-transparent text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900',
          )}
        >
          <option.icon className="size-4" /> {option.label}
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
  const monthlyGoal = useCurrentMonthGoal()

  const sessionTotal = students.reduce((sum, s) => sum + getRowTotal(s.id), 0)

  const fillMax = (studentId) => {
    COIN_CATEGORY_LIST.forEach((category) => setScore(studentId, category.key, category.max))
  }

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
              <Calendar className="size-4 text-blue-500" />
              {nextLessonNumber}-dars • {getMonthLabel(monthIndex)}
            </CardTitle>
            <CardDescription>{formatUzDate(date)}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Sessiyani yopish">
            <X className="size-4" />
          </Button>
        </CardHeader>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={Users} title="O'quvchilar yo'q" description="Avval guruhga o'quvchi qo'shing." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const isAbsent = attendance[student.id] === 'absent'
            const rowTotal = getRowTotal(student.id)
            return (
              <div
                key={student.id}
                className={cn(
                  'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:p-5',
                  isAbsent && 'bg-gray-100 dark:bg-gray-900/60',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar student={student} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">{student.fullName}</p>
                      {monthlyGoal.active && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="shrink-0">Oylik maqsad</span>
                          <GoalProgressInline progress={monthlyGoal.progress.get(student.id)} className="w-32" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AttendanceToggle
                      value={attendance[student.id] ?? 'present'}
                      onChange={(status) => setAttendance(student.id, status)}
                    />
                    <div
                      className={cn(
                        'flex h-11 min-w-20 items-center justify-center gap-1.5 rounded-xl px-3 text-base font-bold tabular-nums',
                        rowTotal > 0
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      <Coins className="size-4" />
                      {rowTotal}
                      <span className="text-xs font-medium opacity-70">/ {LESSON_MAX_COINS}</span>
                    </div>
                  </div>
                </div>

                <div className={cn('mt-4 grid gap-3 lg:grid-cols-3', isAbsent && 'pointer-events-none opacity-50')}>
                  {COIN_CATEGORY_LIST.map((category) => (
                    <div key={category.key} className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800/60">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{category.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">max {category.max}</span>
                      </div>
                      <ScoreSelector
                        label={category.label}
                        value={scores[student.id]?.[category.key] ?? 0}
                        max={category.max}
                        disabled={isAbsent}
                        onChange={(value) => setScore(student.id, category.key, value)}
                      />
                    </div>
                  ))}
                </div>

                {!isAbsent && rowTotal < LESSON_MAX_COINS && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => fillMax(student.id)}
                      className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    >
                      <Sparkles className="size-3.5" /> Hammasiga maksimal
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 lg:bottom-4">
        <p className="pl-1 text-sm text-muted-foreground">
          Jami: <span className="font-semibold text-blue-600 dark:text-blue-400">{sessionTotal} coin</span>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="gap-1.5 bg-blue-500 text-white hover:bg-blue-600"
          >
            <Check className="size-4" /> Saqlash
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
