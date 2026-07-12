import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, ListChecks } from 'lucide-react'
import { EmptyState } from '@/shared/ui/empty-state'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { DeleteLessonDialog } from '@/features/manage-lessons/ui/DeleteLessonDialog'
import { DeleteAllLessonsDialog } from '@/features/manage-lessons/ui/DeleteAllLessonsDialog'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { ROUTES } from '@/shared/config/constants'

export function LessonsList({ lessons, coinEntries }) {
  const sorted = [...lessons].sort((a, b) => b.lessonNumber - a.lessonNumber)

  if (sorted.length === 0) {
    return <EmptyState icon={Calendar} title="Darslar yo'q" description="Hali birorta dars o'tkazilmagan." />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sorted.length} ta dars</p>
        <DeleteAllLessonsDialog lessons={sorted} />
      </div>
      <div className="divide-y divide-border/50">
        {sorted.map((lesson, index) => {
          const entries = coinEntries.filter((e) => e.lessonId === lesson.id)
          const total = entries.reduce((sum, e) => sum + e.value, 0)
          const studentCount = new Set(entries.map((e) => e.studentId)).size

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(index * 0.02, 0.4) }}
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Calendar className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {lesson.lessonNumber}-dars <span className="text-muted-foreground">• {getMonthLabel(lesson.monthIndex)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatUzDate(lesson.date, { withTime: true })}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
                <Badge variant="secondary">{studentCount} o'quvchi</Badge>
                <Badge variant="coin">{total} coin</Badge>
                <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground">
                  <Link to={ROUTES.lessonTests(lesson.id)} aria-label="Testlar">
                    <ListChecks className="size-4" />
                  </Link>
                </Button>
                <DeleteLessonDialog lesson={lesson} />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
