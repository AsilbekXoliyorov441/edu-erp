import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Gift as GiftIconLucide, Users2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { AnimatedNumber } from '@/shared/ui/animated-number'
import { EmptyState } from '@/shared/ui/empty-state'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { StudentCharts } from '@/widgets/StudentCharts/StudentCharts'
import { StudentTimeline } from '@/widgets/StudentTimeline/StudentTimeline'
import { GiftGrid } from '@/widgets/GiftGrid/GiftGrid'
import { RedeemGiftDialog } from '@/features/redeem-gift/ui/RedeemGiftDialog'
import { useAuthStore } from '@/entities/session/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useGroupStore } from '@/entities/group/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useCoinEntryStore } from '@/entities/coin-entry/model/store'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { useGiftStore } from '@/entities/gift/model/store'
import { getStudentBalance, getLeaderboard } from '@/shared/lib/stats'
import { formatUzDate } from '@/shared/lib/date'
import { ROLES, ROUTES } from '@/shared/config/constants'

export function StudentProfilePage() {
  const { studentId } = useParams()
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)

  const students = useStudentStore((s) => s.items)
  const groups = useGroupStore((s) => s.items)
  const lessons = useLessonStore((s) => s.items)
  const coinEntries = useCoinEntryStore((s) => s.items)
  const transactions = useTransactionStore((s) => s.items)
  const gifts = useGiftStore((s) => s.items)

  const isBlocked = role === ROLES.STUDENT && studentId !== userId

  useEffect(() => {
    if (isBlocked) toast.error("Faqat o'z profilingizni to'liq ko'rishingiz mumkin")
  }, [isBlocked])

  if (isBlocked) return <Navigate to={ROUTES.studentProfile(userId)} replace />

  const student = students.find((s) => s.id === studentId)

  if (!student) {
    return (
      <EmptyState
        icon={Users2}
        title="O'quvchi topilmadi"
        description="Bu o'quvchi o'chirilgan yoki mavjud emas."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.LEADERBOARD}>Reytingga qaytish</Link>
          </Button>
        }
      />
    )
  }

  const group = groups.find((g) => g.id === student.groupId)
  const balance = getStudentBalance(student.id, transactions)
  const rankEntry = getLeaderboard(students, transactions, { groupId: student.groupId }).find(
    (e) => e.student.id === student.id,
  )
  const canManage = role === ROLES.TEACHER
  const backTo = canManage && student.groupId ? ROUTES.groupDetail(student.groupId) : ROUTES.LEADERBOARD

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to={backTo} aria-label="Orqaga">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold text-foreground">O'quvchi profili</h2>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <StudentAvatar student={student} size="lg" />
            <div className="text-center sm:text-left">
              <h1 className="text-xl font-bold text-foreground">{student.fullName}</h1>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                {group && <Badge variant="secondary">{group.name}</Badge>}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" /> {formatUzDate(student.joinedAt)} dan beri
                </span>
                {rankEntry && <Badge variant="outline">Guruhda #{rankEntry.rank}</Badge>}
              </div>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Joriy balans</p>
            <p className="text-4xl font-extrabold tabular-nums text-coin-foreground dark:text-coin">
              <AnimatedNumber value={balance} />
              <span className="ml-1 text-lg font-semibold text-muted-foreground">coin</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <StudentCharts studentId={student.id} coinEntries={coinEntries} lessons={lessons} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <h3 className="mb-4 text-base font-semibold text-foreground">Tarix</h3>
            <StudentTimeline studentId={student.id} transactions={transactions} coinEntries={coinEntries} gifts={gifts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <GiftIconLucide className="size-4 text-coin-foreground dark:text-coin" /> Coin Market
            </h3>
            <GiftGrid
              gifts={gifts}
              balance={balance}
              showLink={canManage}
              actions={(gift, affordable) => {
                if (!canManage) return null
                if (!affordable) {
                  return (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      Yetarli emas
                    </Button>
                  )
                }
                return (
                  <RedeemGiftDialog
                    student={student}
                    gift={gift}
                    trigger={
                      <Button size="sm" className="w-full">
                        Sovg'a berish
                      </Button>
                    }
                  />
                )
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
