import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ListChecks, Plus, Code2, ClipboardList, Users2, ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Switch } from '@/shared/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { EmptyState } from '@/shared/ui/empty-state'
import { CodeBlock } from '@/shared/ui/code-block'
import { TestFormDialog } from '@/features/manage-tests/ui/TestFormDialog'
import { DeleteTestDialog } from '@/features/manage-tests/ui/DeleteTestDialog'
import { QuestionFormDialog } from '@/features/manage-tests/ui/QuestionFormDialog'
import { DeleteQuestionDialog } from '@/features/manage-tests/ui/DeleteQuestionDialog'
import { useTopics } from '@/entities/test/model/store'
import { useQuestionsForTest } from '@/entities/test-question/model/store'
import { useGroupAssignmentsForTest } from '@/entities/test-assignment/model/store'
import { useTestAttempts } from '@/entities/quiz/model/store'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { formatUzDate } from '@/shared/lib/date'
import { ROUTES } from '@/shared/config/constants'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']
const RECOMMENDED_MIN_QUESTIONS = 10

function QuestionRow({ testId, question, index }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 p-3">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {index + 1}-savol
          {question.isCode && (
            <Badge variant="secondary" className="gap-1">
              <Code2 className="size-3" /> Kod
            </Badge>
          )}
          {question.imageUrl && (
            <Badge variant="secondary" className="gap-1">
              <ImageIcon className="size-3" /> Rasm
            </Badge>
          )}
        </p>
        {question.isCode ? <CodeBlock code={question.text} /> : <p className="text-sm text-foreground">{question.text}</p>}
        {question.imageUrl && (
          <img src={question.imageUrl} alt="Savol rasmi" className="max-h-40 rounded-lg border border-border/60 object-contain" />
        )}
        <p className="text-xs text-success">
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

function QuestionsTab({ testId, questions }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {questions.length} ta savol
          {questions.length > 0 && questions.length < RECOMMENDED_MIN_QUESTIONS && (
            <span className="ml-1.5 text-warning">— tavsiya etilgan {RECOMMENDED_MIN_QUESTIONS}-20 ta</span>
          )}
        </p>
        <QuestionFormDialog
          testId={testId}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" /> Savol qo'shish
            </Button>
          }
        />
      </div>

      {questions.length === 0 ? (
        <EmptyState icon={ListChecks} title="Hali savol yo'q" description="Bu mavzuga birinchi savolingizni qo'shing." />
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionRow key={question.id} testId={testId} question={question} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

function GroupsTab({ testId }) {
  const groups = useGroupStore((s) => s.items)
  const { groupIds, assign, unassign } = useGroupAssignmentsForTest(testId)
  const assignedSet = new Set(groupIds)

  if (groups.length === 0) {
    return <EmptyState icon={Users2} title="Guruh yo'q" description="Avval kamida bitta guruh yarating." />
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Ushbu mavzuni qaysi guruhlarga ulamoqchisiz? Ulangan guruhdagi o'quvchilar bu testni "Testlar" bo'limida ko'radi.</p>
      <div className="divide-y divide-border/50 rounded-xl border border-border/60">
        {groups.map((group) => {
          const checked = assignedSet.has(group.id)
          return (
            <div key={group.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-medium text-foreground">{group.name}</span>
              <Switch checked={checked} onCheckedChange={(next) => (next ? assign(group.id) : unassign(group.id))} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResultsTab({ testId }) {
  const attempts = useTestAttempts(testId)
  const students = useStudentStore((s) => s.items)
  const groups = useGroupStore((s) => s.items)
  const studentById = new Map(students.map((s) => [s.id, s]))
  const groupById = new Map(groups.map((g) => [g.id, g]))

  if (attempts.length === 0) {
    return <EmptyState icon={ClipboardList} title="Hali natija yo'q" description="O'quvchilar testni topshirmagan." />
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="py-2.5 font-medium">O'quvchi</th>
                <th className="py-2.5 font-medium">Guruh</th>
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
                  const group = student ? groupById.get(student.groupId) : null
                  const percent = attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0
                  return (
                    <tr key={attempt.id} className="border-b border-border/40 last:border-0">
                      <td className="py-3 font-medium text-foreground">{student?.fullName ?? "O'chirilgan o'quvchi"}</td>
                      <td className="py-3 text-muted-foreground">{group?.name ?? '—'}</td>
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
  )
}

export function TestDetailPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { items: topics } = useTopics()
  const { items: questions } = useQuestionsForTest(testId)
  const { groupIds } = useGroupAssignmentsForTest(testId)

  const test = topics.find((t) => t.id === testId)

  if (!test) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Mavzu topilmadi"
        description="Bu mavzu o'chirilgan yoki mavjud emas."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.TESTS}>Testlarga qaytish</Link>
          </Button>
        }
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={ROUTES.TESTS} aria-label="Orqaga">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{test.title}</h2>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">{questions.length} ta savol</Badge>
              <Badge variant="secondary">{groupIds.length} ta guruh</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TestFormDialog
            test={test}
            trigger={
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Mavzuni tahrirlash">
                <ListChecks className="size-4" />
              </Button>
            }
          />
          <DeleteTestDialog test={test} onDeleted={() => navigate(ROUTES.TESTS)} />
        </div>
      </div>

      <Tabs defaultValue="savollar">
        <TabsList>
          <TabsTrigger value="savollar">Savollar</TabsTrigger>
          <TabsTrigger value="guruhlar">Guruhlar</TabsTrigger>
          <TabsTrigger value="natijalar">Natijalar</TabsTrigger>
        </TabsList>

        <TabsContent value="savollar">
          <QuestionsTab testId={testId} questions={questions} />
        </TabsContent>
        <TabsContent value="guruhlar">
          <GroupsTab testId={testId} />
        </TabsContent>
        <TabsContent value="natijalar">
          <ResultsTab testId={testId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
