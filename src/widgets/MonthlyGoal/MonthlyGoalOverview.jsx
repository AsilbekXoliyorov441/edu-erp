import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ShieldCheck, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { EmptyState } from '@/shared/ui/empty-state'
import { GoalProgressInline } from '@/shared/ui/goal-progress'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useCurrentMonthGoal } from '@/entities/monthly-goal/model/store'
import { MONTHLY_GOAL, ROUTES, STUDENT_STATUS } from '@/shared/config/constants'
import { getDaysLeftInMonth } from '@/shared/lib/stats/monthlyGoal'
import { formatMonthKey } from '@/widgets/MonthlyGoal/goalMessages'

function SummaryTile({ icon: Icon, label, value, className }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800/60">
      <div className={`flex size-9 items-center justify-center rounded-lg ${className}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/** Teacher/admin view: every active student's progress toward this month's goal, lowest
 * first, so the ones whose coins are about to burn are at the top. */
export function MonthlyGoalOverview() {
  const groups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const { monthKey, active, progress } = useCurrentMonthGoal()
  const [groupId, setGroupId] = useState('all')
  const [filter, setFilter] = useState('risk')

  const rows = useMemo(() => {
    const groupById = new Map(groups.map((g) => [g.id, g]))
    return students
      .filter((s) => s.status === STUDENT_STATUS.ACTIVE)
      .filter((s) => groupId === 'all' || s.groupId === groupId)
      .map((s) => ({ student: s, group: groupById.get(s.groupId), progress: progress.get(s.id) }))
      .filter((r) => r.progress && r.progress.possible > 0)
      .sort((a, b) => a.progress.percent - b.progress.percent)
  }, [students, groups, groupId, progress])

  if (!active) return null

  const reachedCount = rows.filter((r) => r.progress.reached).length
  const riskCount = rows.length - reachedCount
  const visible = rows.filter((r) => (filter === 'risk' ? !r.progress.reached : filter === 'ok' ? r.progress.reached : true))

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-blue-500" /> Oylik maqsad — {formatMonthKey(monthKey)}
          </CardTitle>
          <CardDescription>
            {MONTHLY_GOAL.PERCENT}% ga yetmagan o'quvchilarning shu oydagi coinlari kuyadi (oy keyingi oyning {MONTHLY_GOAL.CLOSE_GRACE_DAYS + 1}-sanasida yopiladi) •{' '}
            {getDaysLeftInMonth()} kun qoldi
          </CardDescription>
        </div>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Guruh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha guruhlar</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SummaryTile
            icon={ShieldCheck}
            label={`${MONTHLY_GOAL.PERCENT}% ga yetgan`}
            value={reachedCount}
            className="bg-blue-500 text-white"
          />
          <SummaryTile icon={AlertTriangle} label="Xavf ostida" value={riskCount} className="bg-red-500 text-white" />
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="risk">Xavf ostida ({riskCount})</TabsTrigger>
            <TabsTrigger value="ok">Yetganlar ({reachedCount})</TabsTrigger>
            <TabsTrigger value="all">Barchasi</TabsTrigger>
          </TabsList>
        </Tabs>

        {visible.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Ro'yxat bo'sh"
            description={rows.length === 0 ? "Bu oy hali dars o'tilmagan." : "Bu filtr bo'yicha o'quvchi yo'q."}
          />
        ) : (
          <div className="max-h-[28rem] divide-y divide-gray-200 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {visible.map(({ student, group, progress: p }) => (
              <Link
                key={student.id}
                to={ROUTES.studentProfile(student.id)}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60"
              >
                <StudentAvatar student={student} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{student.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {group?.name ?? '—'} • {p.earned}/{p.possible} coin
                    {!p.reached && ` • yana ${p.coinsToGoal} coin kerak`}
                  </p>
                </div>
                <GoalProgressInline progress={p} className="w-36 shrink-0 sm:w-48" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
