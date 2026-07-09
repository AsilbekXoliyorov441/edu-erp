import { motion } from 'framer-motion'
import { Calendar, Check, Users, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { RatingStepper } from '@/shared/ui/rating-stepper'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { useLessonSession } from '@/features/give-coin/model/useLessonSession'

export function LessonSessionPanel({ group, students, nextLessonNumber, monthIndex, date, onDone, onCancel }) {
  const { scores, setScore, getRowTotal, save, saving } = useLessonSession({ group, students, date })

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
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar student={student} size="sm" />
                    <span className="truncate text-sm font-medium text-foreground">{student.fullName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {COIN_CATEGORY_LIST.map((category) => (
                      <div key={category.key} className="flex flex-col items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">{category.label}</span>
                        <RatingStepper
                          value={scores[student.id]?.[category.key] ?? 0}
                          max={category.max}
                          onChange={(value) => setScore(student.id, category.key, value)}
                        />
                      </div>
                    ))}
                    <Badge variant="coin" className="min-w-[4rem] justify-center text-sm">
                      {getRowTotal(student.id)} coin
                    </Badge>
                  </div>
                </div>
              ))}
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
