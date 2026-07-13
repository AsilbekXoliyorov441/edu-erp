import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ListChecks, Plus, ChevronRight, Users2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { TestFormDialog } from '@/features/manage-tests/ui/TestFormDialog'
import { DeleteTestDialog } from '@/features/manage-tests/ui/DeleteTestDialog'
import { useAuthStore } from '@/entities/session/model/store'
import { useTopics } from '@/entities/test/model/store'
import { useMyAssignedTests } from '@/entities/test-assignment/model/store'
import { useMyAttempts } from '@/entities/quiz/model/store'
import { ROLES, ROUTES } from '@/shared/config/constants'

function TeacherTestsPage() {
  const { items: topics } = useTopics()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Testlar</h2>
          <p className="text-sm text-muted-foreground">
            Mavzu yarating, unga savollar qo'shing va xohlagan guruhlaringizga ulang.
          </p>
        </div>
        <TestFormDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" /> Mavzu qo'shish
            </Button>
          }
        />
      </div>

      {topics.length === 0 ? (
        <EmptyState icon={ListChecks} title="Hali mavzu yo'q" description="Birinchi mavzuingizni yarating va unga savollar qo'shing." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic, index) => (
            <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <Link to={ROUTES.testDetail(topic.id)} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <ListChecks className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{topic.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">{topic.questionCount} savol</Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Users2 className="size-3" /> {topic.groupCount}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <DeleteTestDialog test={topic} />
                    <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground">
                      <Link to={ROUTES.testDetail(topic.id)} aria-label="Ochish">
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentTestsPage() {
  const tests = useMyAssignedTests()
  const attempts = useMyAttempts()

  const bestPercentFor = (testId) => {
    const testAttempts = attempts.filter((a) => a.testId === testId)
    if (testAttempts.length === 0) return null
    return Math.max(...testAttempts.map((a) => (a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : 0)))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Testlar</h2>
        <p className="text-sm text-muted-foreground">O'tilgan mavzular bo'yicha testlarni yeching</p>
      </div>

      {tests.length === 0 ? (
        <EmptyState icon={ListChecks} title="Hali test yo'q" description="Ustozingiz test qo'shganda shu yerda ko'rinadi." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tests.map((test, index) => {
            const bestPercent = bestPercentFor(test.id)
            return (
              <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Link to={ROUTES.takeTest(test.id)}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <ListChecks className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{test.title}</p>
                        <p className="text-xs text-muted-foreground">{test.questionCount} ta savol</p>
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

export function TestsPage() {
  const role = useAuthStore((s) => s.role)
  return role === ROLES.TEACHER ? <TeacherTestsPage /> : <StudentTestsPage />
}
