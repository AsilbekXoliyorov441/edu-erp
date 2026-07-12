import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ListChecks, Plus, Code2, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { EmptyState } from '@/shared/ui/empty-state'
import { TestFormDialog } from '@/features/manage-tests/ui/TestFormDialog'
import { DeleteTestDialog } from '@/features/manage-tests/ui/DeleteTestDialog'
import { QuestionFormDialog } from '@/features/manage-tests/ui/QuestionFormDialog'
import { DeleteQuestionDialog } from '@/features/manage-tests/ui/DeleteQuestionDialog'
import { useTestsForLesson } from '@/entities/test/model/store'
import { useQuestionsForTest } from '@/entities/test-question/model/store'
import { useLessonAttempts } from '@/entities/quiz/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { formatUzDate, getMonthLabel } from '@/shared/lib/date'
import { ROUTES } from '@/shared/config/constants'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function QuestionRow({ testId, question, index }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 p-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {index + 1}-savol
          {question.isCode && (
            <Badge variant="secondary" className="gap-1">
              <Code2 className="size-3" /> Kod
            </Badge>
          )}
        </p>
        {question.isCode ? (
          <pre className="mt-1 overflow-x-auto rounded-lg bg-foreground/90 px-3 py-2 text-xs text-background">
            <code>{question.text}</code>
          </pre>
        ) : (
          <p className="mt-0.5 truncate text-sm text-foreground">{question.text}</p>
        )}
        <p className="mt-1 text-xs text-success">
          To'g'ri javob: {OPTION_LETTERS[question.correctIndex]}) {question.options[question.correctIndex]}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <QuestionFormDialog
          testId={testId}
          question={question}
          trigger={
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Savolni tahrirlash">
              <ClipboardList className="size-4" />
            </Button>
          }
        />
        <DeleteQuestionDialog testId={testId} question={question} />
      </div>
    </div>
  )
}

function TestCard({ test, index }) {
  const { items: questions } = useQuestionsForTest(test.id)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{test.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{questions.length} ta savol</p>
          </div>
          <div className="flex items-center gap-1">
            <TestFormDialog
              lessonId={test.lessonId}
              test={test}
              trigger={
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Testni tahrirlash">
                  <ListChecks className="size-4" />
                </Button>
              }
            />
            <DeleteTestDialog lessonId={test.lessonId} test={test} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {questions.map((question, qIndex) => (
            <QuestionRow key={question.id} testId={test.id} question={question} index={qIndex} />
          ))}
          <QuestionFormDialog
            testId={test.id}
            trigger={
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Plus className="size-3.5" /> Savol qo'shish
              </Button>
            }
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function LessonTestsPage() {
  const { lessonId } = useParams()
  const lessons = useLessonStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const { items: tests } = useTestsForLesson(lessonId)
  const attempts = useLessonAttempts(lessonId)

  const lesson = lessons.find((l) => l.id === lessonId)
  const studentById = new Map(students.map((s) => [s.id, s]))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to={lesson ? ROUTES.groupDetail(lesson.groupId) : ROUTES.GROUPS} aria-label="Orqaga">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {lesson ? `${lesson.lessonNumber}-dars testlari` : 'Dars testlari'}
          </h2>
          {lesson && <p className="text-sm text-muted-foreground">{getMonthLabel(lesson.monthIndex)} • {formatUzDate(lesson.date)}</p>}
        </div>
      </div>

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Testlar</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{tests.length} ta test</p>
            <TestFormDialog
              lessonId={lessonId}
              trigger={
                <Button className="gap-1.5">
                  <Plus className="size-4" /> Test qo'shish
                </Button>
              }
            />
          </div>

          {tests.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Hali test yo'q"
              description="Bu darsga birinchi testingizni qo'shing."
            />
          ) : (
            <div className="space-y-4">
              {tests.map((test, index) => (
                <TestCard key={test.id} test={test} index={index} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {attempts.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Hali natija yo'q" description="O'quvchilar testni topshirmagan." />
          ) : (
            <Card>
              <CardContent className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                        <th className="py-2.5 font-medium">O'quvchi</th>
                        <th className="py-2.5 font-medium">Natija</th>
                        <th className="py-2.5 font-medium">Foiz</th>
                        <th className="py-2.5 font-medium">Sana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...attempts]
                        .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt))
                        .map((attempt) => {
                          const student = studentById.get(attempt.studentId)
                          const percent = attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0
                          return (
                            <tr key={attempt.id} className="border-b border-border/40 last:border-0">
                              <td className="py-3 font-medium text-foreground">{student?.fullName ?? "O'chirilgan o'quvchi"}</td>
                              <td className="py-3 text-muted-foreground">
                                {attempt.score}/{attempt.totalQuestions}
                              </td>
                              <td className="py-3">
                                <Badge variant={percent >= 80 ? 'success' : percent >= 50 ? 'warning' : 'destructive'}>{percent}%</Badge>
                              </td>
                              <td className="py-3 text-muted-foreground">{formatUzDate(attempt.answeredAt, { withTime: true })}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
