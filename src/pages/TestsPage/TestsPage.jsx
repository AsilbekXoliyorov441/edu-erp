import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ListChecks, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { useAuthStore } from '@/entities/session/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useTestedLessonIds } from '@/entities/test/model/store'
import { useMyAttempts } from '@/entities/quiz/model/store'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { ROUTES } from '@/shared/config/constants'

export function TestsPage() {
  const userId = useAuthStore((s) => s.userId)
  const students = useStudentStore((s) => s.items)
  const lessons = useLessonStore((s) => s.items)
  const testedLessonIds = useTestedLessonIds()
  const attempts = useMyAttempts()

  const me = students.find((s) => s.id === userId)
  const testedLessonIdSet = new Set(testedLessonIds)

  const myLessons = lessons
    .filter((l) => l.groupId === me?.groupId && testedLessonIdSet.has(l.id))
    .sort((a, b) => b.lessonNumber - a.lessonNumber)

  const bestPercentFor = (lessonId) => {
    const lessonAttempts = attempts.filter((a) => a.lessonId === lessonId)
    if (lessonAttempts.length === 0) return null
    return Math.max(...lessonAttempts.map((a) => (a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : 0)))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Testlar</h2>
        <p className="text-sm text-muted-foreground">O'tilgan darslaringiz bo'yicha testlarni yeching</p>
      </div>

      {myLessons.length === 0 ? (
        <EmptyState icon={ListChecks} title="Hali test yo'q" description="Ustozingiz test qo'shganda shu yerda ko'rinadi." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {myLessons.map((lesson, index) => {
            const bestPercent = bestPercentFor(lesson.id)
            return (
              <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Link to={ROUTES.takeTest(lesson.id)}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <ListChecks className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">
                          {lesson.lessonNumber}-dars <span className="text-muted-foreground">• {getMonthLabel(lesson.monthIndex)}</span>
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" /> {formatUzDate(lesson.date)}
                        </p>
                      </div>
                      {bestPercent !== null ? (
                        <Badge variant={bestPercent >= 80 ? 'success' : bestPercent >= 50 ? 'warning' : 'destructive'}>
                          {bestPercent}%
                        </Badge>
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
