import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks, Users2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { EmptyState } from '@/shared/ui/empty-state'
import { StudentRosterTable } from '@/widgets/StudentRosterTable/StudentRosterTable'
import { LessonSessionPanel } from '@/widgets/LessonSessionPanel/LessonSessionPanel'
import { LessonsList } from '@/widgets/LessonsList/LessonsList'
import { AttendanceHistory } from '@/widgets/AttendanceHistory/AttendanceHistory'
import { AddStudentDialog } from '@/features/add-student/ui/AddStudentDialog'
import { RenameGroupDialog } from '@/features/rename-group/ui/RenameGroupDialog'
import { DeleteGroupDialog } from '@/features/remove-group/ui/DeleteGroupDialog'
import { StartLessonDialog } from '@/features/give-coin/ui/StartLessonDialog'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useCoinEntryStore } from '@/entities/coin-entry/model/store'
import { useAttendanceStore } from '@/entities/attendance/model/store'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { useTestsForGroup } from '@/entities/test-assignment/model/store'
import { useBreadcrumbStore } from '@/shared/lib/store/breadcrumbStore'
import { getGroupStats } from '@/shared/lib/stats'
import { getMonthFromLessonNumber } from '@/shared/lib/date'
import { ROUTES, STUDENT_STATUS } from '@/shared/config/constants'

function GroupTestsTab({ groupId }) {
  const tests = useTestsForGroup(groupId)

  if (tests.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Ulangan mavzu yo'q"
        description="Testlar bo'limida mavzu yaratib, uni shu guruhga ulashingiz mumkin."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.TESTS}>Testlar bo'limiga o'tish</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="divide-y divide-border/50 rounded-xl border border-border/60">
      {tests.map((test) => (
        <Link
          key={test.id}
          to={ROUTES.testDetail(test.id)}
          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <ListChecks className="size-4" />
            </div>
            <span className="text-sm font-medium text-foreground">{test.title}</span>
          </div>
          <Badge variant="secondary">{test.questionCount} savol</Badge>
        </Link>
      ))}
    </div>
  )
}

export function GroupDetailPage() {
  const { groupId } = useParams()
  const [sessionActive, setSessionActive] = useState(false)
  const [lessonDate, setLessonDate] = useState(null)

  const groups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const lessons = useLessonStore((s) => s.items)
  const coinEntries = useCoinEntryStore((s) => s.items)
  const transactions = useTransactionStore((s) => s.items)
  const attendance = useAttendanceStore((s) => s.items)

  const setTrail = useBreadcrumbStore((s) => s.setTrail)

  const group = groups.find((g) => g.id === groupId)
  const groupLessons = lessons.filter((l) => l.groupId === group?.id)
  // Based on the highest existing lesson number, not the count — deleting lessons
  // leaves gaps, and count-based numbering would collide with a surviving lesson.
  const nextLessonNumber = groupLessons.length ? Math.max(...groupLessons.map((l) => l.lessonNumber)) + 1 : 1

  const groupName = group?.name
  useEffect(() => {
    setTrail(groupName ? [groupName, ...(sessionActive ? [`${nextLessonNumber}-dars baholash`] : [])] : null)
  }, [setTrail, groupName, sessionActive, nextLessonNumber])
  useEffect(() => () => setTrail(null), [setTrail])

  if (!group) {
    return (
      <EmptyState
        icon={Users2}
        title="Guruh topilmadi"
        description="Bu guruh o'chirilgan yoki mavjud emas."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.GROUPS}>Guruhlarga qaytish</Link>
          </Button>
        }
      />
    )
  }

  const groupStudents = students.filter((s) => s.groupId === group.id && s.status === STUDENT_STATUS.ACTIVE)
  const monthIndex = getMonthFromLessonNumber(nextLessonNumber)
  const stats = getGroupStats(group, students, lessons, coinEntries)

  const closeSession = () => {
    setSessionActive(false)
    setLessonDate(null)
  }

  if (sessionActive) {
    return (
      <LessonSessionPanel
        group={group}
        students={groupStudents}
        stats={stats}
        nextLessonNumber={nextLessonNumber}
        monthIndex={monthIndex}
        date={lessonDate}
        onDone={closeSession}
        onCancel={closeSession}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={ROUTES.GROUPS} aria-label="Orqaga">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="text-lg font-semibold text-foreground">{group.name}</h2>
              <RenameGroupDialog group={group} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">{stats.studentCount} o'quvchi</Badge>
              <Badge variant="secondary">{stats.lessonCount} dars</Badge>
              <Badge variant="coin">{stats.avgCoins} o'rtacha coin</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddStudentDialog group={group} />
          <StartLessonDialog
            disabled={groupStudents.length === 0}
            onStart={(date) => {
              setLessonDate(date)
              setSessionActive(true)
            }}
          />
          <DeleteGroupDialog group={group} redirectAfter />
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">O'quvchilar</TabsTrigger>
          <TabsTrigger value="lessons">Darslar</TabsTrigger>
          <TabsTrigger value="attendance">Davomat</TabsTrigger>
          <TabsTrigger value="tests">Testlar</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <Card>
            <CardContent className="p-5">
              <StudentRosterTable students={groupStudents} transactions={transactions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lessons">
          <Card>
            <CardContent className="p-5">
              <LessonsList lessons={groupLessons} coinEntries={coinEntries} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attendance">
          <Card>
            <CardContent className="p-5">
              <AttendanceHistory lessons={groupLessons} attendance={attendance} students={groupStudents} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tests">
          <GroupTestsTab groupId={group.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
