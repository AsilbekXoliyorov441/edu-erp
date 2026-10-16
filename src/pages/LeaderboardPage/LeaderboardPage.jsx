import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Medal, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { EmptyState } from '@/shared/ui/empty-state'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { MonthlyGoalCard } from '@/widgets/MonthlyGoal/MonthlyGoalCard'
import { useAuthStore } from '@/entities/session/model/store'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useCoinEntryStore } from '@/entities/coin-entry/model/store'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { getLeaderboard, getLeaderboardByPeriod } from '@/shared/lib/stats'
import { ROLES, ROUTES } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'

const MEDAL_STYLES = [
  'bg-linear-to-br from-amber-300 to-amber-500 text-amber-950',
  'bg-linear-to-br from-slate-300 to-slate-400 text-slate-900',
  'bg-linear-to-br from-orange-300 to-orange-500 text-orange-950',
]

export function LeaderboardPage() {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const groups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const lessons = useLessonStore((s) => s.items)
  const coinEntries = useCoinEntryStore((s) => s.items)
  const transactions = useTransactionStore((s) => s.items)

  const [groupId, setGroupId] = useState('all')
  const [period, setPeriod] = useState('all')

  const monthOptions = useMemo(() => [...new Set(lessons.map((l) => l.monthIndex))].sort((a, b) => a - b), [lessons])
  const scopedGroupId = groupId === 'all' ? undefined : groupId

  const ranking = useMemo(() => {
    if (period === 'all') return getLeaderboard(students, transactions, { groupId: scopedGroupId })
    return getLeaderboardByPeriod(students, coinEntries, lessons, {
      groupId: scopedGroupId,
      monthIndex: Number(period),
    })
  }, [period, students, transactions, coinEntries, lessons, scopedGroupId])

  return (
    <div className="space-y-5">
      {role === ROLES.STUDENT && <MonthlyGoalCard studentId={userId} isSelf compact />}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="w-48">
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

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Davr" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Umumiy balans</SelectItem>
            {monthOptions.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}-oyda yig'ilgan
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {ranking.length === 0 ? (
        <EmptyState icon={Trophy} title="Reyting bo'sh" description="Bu filtr bo'yicha hali o'quvchi topilmadi." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border/50 p-2 sm:p-3">
            <AnimatePresence initial={false}>
              {ranking.map((entry) => {
                const isSelf = role === ROLES.STUDENT && entry.student.id === userId
                return (
                  <motion.div
                    key={entry.student.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                  >
                    <Link
                      to={ROUTES.studentProfile(entry.student.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/60',
                        isSelf && 'bg-secondary/70 ring-1 ring-primary/30',
                      )}
                    >
                      <div
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          entry.rank <= 3 ? MEDAL_STYLES[entry.rank - 1] : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {entry.rank <= 3 ? <Medal className="size-4" /> : entry.rank}
                      </div>
                      <StudentAvatar student={entry.student} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.student.fullName} {isSelf && <span className="text-xs text-primary">(Siz)</span>}
                        </p>
                      </div>
                      <Badge variant="coin">{entry.total} coin</Badge>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
