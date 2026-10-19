import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, ShieldCheck, ShieldHalf, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { EmptyState } from '@/shared/ui/empty-state'
import { GoalZoneTrack } from '@/shared/ui/goal-progress'
import { cn } from '@/shared/lib/utils'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useCurrentMonthGoal } from '@/entities/monthly-goal/model/store'
import { MONTHLY_GOAL, ROUTES, STUDENT_STATUS } from '@/shared/config/constants'
import { getDaysLeftInMonth } from '@/shared/lib/stats/monthlyGoal'
import { formatMonthKey } from '@/widgets/MonthlyGoal/goalMessages'

const TIERS = {
  risk: {
    label: `${MONTHLY_GOAL.HALF_PERCENT}% va kam`,
    hint: 'kuyadi',
    icon: Flame,
    iconBox: 'bg-red-500 text-white',
    active: 'border-red-500 ring-4 ring-red-500/10',
    pill: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  half: {
    label: `${MONTHLY_GOAL.HALF_PERCENT}–${MONTHLY_GOAL.PERCENT}%`,
    hint: 'yarmi saqlanadi',
    icon: ShieldHalf,
    iconBox: 'bg-amber-500 text-white',
    active: 'border-amber-500 ring-4 ring-amber-500/10',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  ok: {
    label: `${MONTHLY_GOAL.PERCENT}% va ko'p`,
    hint: 'hammasi saqlanadi',
    icon: ShieldCheck,
    iconBox: 'bg-blue-500 text-white',
    active: 'border-blue-500 ring-4 ring-blue-500/10',
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
}

const tierOf = (p) => (p.reached ? 'ok' : p.halfReached ? 'half' : 'risk')

/** Summary tile that doubles as the list filter (click again to show everyone). */
function TierTile({ tier, count, total, selected, onSelect }) {
  const t = TIERS[tier]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-left transition-all hover:border-gray-300 dark:bg-gray-900 dark:hover:border-gray-700',
        selected ? t.active : 'border-gray-200 dark:border-gray-800',
      )}
    >
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', t.iconBox)}>
        <t.icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-tight tabular-nums text-foreground">
          {count}
          <span className="ml-1 text-sm font-medium text-muted-foreground">/ {total}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {t.label} • {t.hint}
        </p>
      </div>
    </button>
  )
}

function rowHint(p) {
  if (p.reached) return 'Maqsadga yetdi'
  if (p.goalUnreachable) {
    if (p.halfReached) return 'Yarmi saqlanadi'
    if (p.halfUnreachable) return `${MONTHLY_GOAL.HALF_PERCENT}% ga ham yeta olmaydi`
    return `Yarmi uchun yana ${p.coinsToHalf} coin`
  }
  return `Yana ${p.coinsToGoal} coin • ${p.remainingLessons} ta dars qoldi`
}

/** Teacher/admin view: every active student's progress toward this month's goal, lowest
 * first, so the ones whose coins are about to burn are at the top. */
export function MonthlyGoalOverview() {
  const groups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const { monthKey, active, progress } = useCurrentMonthGoal()
  const [groupId, setGroupId] = useState('all')
  const [filter, setFilter] = useState('all')

  const rows = useMemo(() => {
    const groupById = new Map(groups.map((g) => [g.id, g]))
    return students
      .filter((s) => s.status === STUDENT_STATUS.ACTIVE)
      .filter((s) => groupId === 'all' || s.groupId === groupId)
      .map((s) => ({ student: s, group: groupById.get(s.groupId), progress: progress.get(s.id) }))
      .filter((r) => r.progress && r.progress.possible > 0)
      .sort(
        (a, b) =>
          Number(b.progress.goalUnreachable) - Number(a.progress.goalUnreachable) ||
          a.progress.pacePercent - b.progress.pacePercent,
      )
  }, [students, groups, groupId, progress])

  if (!active) return null

  const counts = { ok: 0, half: 0, risk: 0 }
  rows.forEach((r) => (counts[tierOf(r.progress)] += 1))
  const visible = rows.filter((r) => filter === 'all' || tierOf(r.progress) === filter)
  const toggleFilter = (tier) => setFilter((prev) => (prev === tier ? 'all' : tier))

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-blue-500" /> Oylik maqsad — {formatMonthKey(monthKey)}
          </CardTitle>
          <CardDescription>
            {getDaysLeftInMonth()} kun qoldi • oy keyingi oyning {MONTHLY_GOAL.CLOSE_GRACE_DAYS + 1}-sanasida yopiladi
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {['risk', 'half', 'ok'].map((tier) => (
            <TierTile
              key={tier}
              tier={tier}
              count={counts[tier]}
              total={rows.length}
              selected={filter === tier}
              onSelect={() => toggleFilter(tier)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {filter === 'all' ? `Barcha o'quvchilar (${rows.length})` : `${TIERS[filter].label} — ${TIERS[filter].hint} (${visible.length})`}
          </p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Hammasini ko'rsatish
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Ro'yxat bo'sh"
            description={rows.length === 0 ? "Bu oy hali dars o'tilmagan." : "Bu filtr bo'yicha o'quvchi yo'q."}
          />
        ) : (
          <div className="max-h-[30rem] divide-y divide-gray-200 overflow-y-auto rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {visible.map(({ student, group, progress: p }) => {
              const t = TIERS[tierOf(p)]
              return (
                <Link
                  key={student.id}
                  to={ROUTES.studentProfile(student.id)}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-gray-100 sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] dark:hover:bg-gray-800/60"
                >
                  <StudentAvatar student={student} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{student.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {group?.name ?? '—'} • {rowHint(p)}
                    </p>
                  </div>
                  <div className="col-span-3 flex items-center gap-3 sm:col-span-1">
                    <GoalZoneTrack percent={p.percent} className="flex-1" />
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {p.earned}/{p.possible}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'row-start-1 col-start-3 w-14 rounded-full px-2 py-1 text-center text-xs font-bold tabular-nums sm:col-start-4',
                      t.pill,
                    )}
                  >
                    {Math.round(p.percent)}%
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
