import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Flame, ShieldCheck, ShieldHalf, Target } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { GoalProgressBar } from '@/shared/ui/goal-progress'
import { GOAL_TONE_TEXT } from '@/shared/ui/goal-tone'
import { useCurrentMonthGoal, useMonthlyGoalResults } from '@/entities/monthly-goal/model/store'
import { MONTHLY_GOAL, ROUTES } from '@/shared/config/constants'
import { LESSON_MAX_COINS, getDaysLeftInMonth, getGoalTone } from '@/shared/lib/stats/monthlyGoal'
import { cn } from '@/shared/lib/utils'
import { formatMonthKey, getGoalMessage } from '@/widgets/MonthlyGoal/goalMessages'

const MESSAGE_STYLE = {
  empty: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  star: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  ontrack: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  lost: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
  half: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  halfSafe: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  reached: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  close: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  behind: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
}

/** Neutral status line for a teacher/admin looking at someone else's profile. */
function getStaffStatusText(progress) {
  if (!progress || progress.possible === 0) return "Bu oy hali dars bo'lmagan."
  if (progress.reached) return `Maqsadga yetgan — ${Math.round(progress.percent)}%. Bu oygi coinlari saqlanadi.`
  if (progress.goalUnreachable) {
    if (progress.halfReached) return `70% ga endi yeta olmaydi, lekin 50% dan oshgan — bu oygi coinlarining yarmi saqlanadi.`
    if (progress.halfUnreachable) return `Bu oy 50% ga ham yeta olmaydi — oy yopilganda bu oygi coinlari kuyadi.`
    return `70% ga endi yeta olmaydi. Yana ${progress.coinsToHalf} coin yig'sa, yarmi saqlanadi.`
  }
  return `Maqsadgacha yana ${progress.coinsToGoal} coin kerak, ${progress.remainingLessons} ta dars qoldi. O'tilgan darslardagi natijasi: ${Math.round(progress.pacePercent)}%.`
}

const OUTCOME = {
  full: {
    label: 'hammasi saqlanadi',
    icon: ShieldCheck,
    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
  half: {
    label: 'yarmi saqlanadi',
    icon: ShieldHalf,
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  none: {
    label: 'kuyadi',
    icon: Flame,
    pill: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
}

function ProgressRing({ percent, tone, earned, possible }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(percent, 100))

  return (
    <div className="relative mx-auto size-36 shrink-0">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle cx="64" cy="64" r={radius} strokeWidth="12" className="fill-none stroke-gray-100 dark:stroke-gray-800" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="12"
          strokeLinecap="round"
          className="fill-none stroke-blue-500"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-extrabold tabular-nums', GOAL_TONE_TEXT[tone])}>{Math.round(percent)}%</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {earned} / {possible} coin
        </span>
      </div>
    </div>
  )
}

const ZONES = [
  { key: 'none', from: 0, to: MONTHLY_GOAL.HALF_PERCENT, label: 'Kuyadi', bg: 'bg-red-100 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  { key: 'half', from: MONTHLY_GOAL.HALF_PERCENT, to: MONTHLY_GOAL.PERCENT, label: 'Yarmi', bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  { key: 'full', from: MONTHLY_GOAL.PERCENT, to: 100, label: 'Hammasi', bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
]

/** Progress over the three outcome zones (burn / half kept / all kept), so where the student
 * stands — and how far the next zone is — reads at a glance. The fill itself stays brand blue;
 * the zone underneath carries the meaning. */
function GoalZoneBar({ progress }) {
  const clamped = Math.max(0, Math.min(progress.percent, 100))
  const current = progress.reached ? 'full' : progress.halfReached ? 'half' : 'none'

  return (
    <div className="space-y-2">
      <div className="relative h-4 overflow-hidden rounded-full">
        <div className="absolute inset-0 flex">
          {ZONES.map((z) => (
            <div key={z.key} className={z.bg} style={{ width: `${z.to - z.from}%` }} />
          ))}
        </div>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {ZONES.slice(1).map((z) => (
          <div key={z.key} className="absolute inset-y-0 w-0.5 bg-white dark:bg-gray-900" style={{ left: `${z.from}%` }} />
        ))}
      </div>
      <div className="flex text-[11px]">
        {ZONES.map((z) => (
          <div
            key={z.key}
            style={{ width: `${z.to - z.from}%` }}
            className={cn('px-1 text-center', z.key === current ? cn('font-semibold', z.text) : 'text-muted-foreground')}
          >
            {z.label}
            <span className="hidden opacity-70 sm:inline"> • {z.key === 'none' ? `≤${z.to}%` : `${z.from}%+`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value, hint, done = false }) {
  return (
    <div className="px-3 text-center">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className={cn('text-[11px]', done ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')}>
        {hint}
      </p>
    </div>
  )
}

function PastResults({ studentId }) {
  const results = useMonthlyGoalResults()
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6)

  if (results.length === 0) return null

  return (
    <div className="space-y-2.5 border-t border-gray-200 pt-5 dark:border-gray-800">
      <p className="text-sm font-semibold text-foreground">Oldingi oylar</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {results.map((r) => {
          const outcome = OUTCOME[r.reached ? 'full' : r.percent > MONTHLY_GOAL.HALF_PERCENT ? 'half' : 'none']
          return (
            <div key={r.id} className="rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatMonthKey(r.month)}</span>
                <span className={cn('text-sm font-bold tabular-nums', GOAL_TONE_TEXT[getGoalTone(r.percent)])}>
                  {Math.round(r.percent)}%
                </span>
              </div>
              <p className={cn('mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', outcome.pill)}>
                <outcome.icon className="size-3" />
                {r.reached ? 'Saqlandi' : `${r.burned} coin kuydi`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The student's progress toward this month's goal — full card for the profile page, or a
 * compact motivational banner (`compact`) for the student's landing page. `isSelf` switches
 * the copy between second person (the student) and neutral (teacher/admin viewing). */
export function MonthlyGoalCard({ studentId, isSelf = false, compact = false }) {
  const { monthKey, active, progress: progressMap } = useCurrentMonthGoal()
  if (!active) return null

  const progress = progressMap.get(studentId)
  const percent = progress?.percent ?? 0
  const tone = getGoalTone(percent)
  const daysLeft = getDaysLeftInMonth()
  const message = getGoalMessage(progress)
  const atRisk = progress && progress.possible > 0 && !progress.reached

  if (compact) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500 text-white">
                  <Target className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{formatMonthKey(monthKey)} maqsadi</p>
                  <p className="text-xs text-muted-foreground">
                    {progress?.earned ?? 0} / {progress?.possible ?? 0} coin • {daysLeft} kun qoldi
                  </p>
                </div>
              </div>
              <span className={cn('text-2xl font-extrabold tabular-nums', GOAL_TONE_TEXT[tone])}>
                {Math.round(percent)}%
              </span>
            </div>
            {progress && progress.possible > 0 ? (
              <GoalZoneBar progress={progress} />
            ) : (
              <GoalProgressBar percent={percent} tone={tone} />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-foreground">{message.text}</p>
              <Link
                to={ROUTES.studentProfile(studentId)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Batafsil <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!progress || progress.possible === 0) {
    return (
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="flex items-center gap-3 p-5 sm:p-6">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500 text-white">
            <Target className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Oylik maqsad — {formatMonthKey(monthKey)}</h3>
            <p className="text-sm text-muted-foreground">{isSelf ? message.text : "Bu oy hali dars bo'lmagan."}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const outcome = OUTCOME[progress.reached ? 'full' : progress.halfReached ? 'half' : 'none']

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-500/25">
              <Target className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Oylik maqsad — {formatMonthKey(monthKey)}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="size-3.5" />
                {progress.remainingLessons} ta dars • {daysLeft} kun qoldi
              </p>
            </div>
          </div>
          <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', outcome.pill)}>
            <outcome.icon className="size-3.5" />
            Hozircha: {outcome.label}
          </span>
        </div>

        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <ProgressRing percent={percent} tone={tone} earned={progress.earned} possible={progress.possible} />

          <div className="space-y-5">
            <GoalZoneBar progress={progress} />

            <div className="grid grid-cols-3 divide-x divide-gray-200 rounded-xl bg-gray-100 py-3 dark:divide-gray-700 dark:bg-gray-800/60">
              <MiniStat label="Yig'ildi" value={progress.earned} hint={`${progress.totalLessons} dars × ${LESSON_MAX_COINS}`} />
              <MiniStat
                label="Yarmi uchun"
                value={progress.halfCoins}
                hint={progress.halfReached ? 'yetildi ✓' : `yana ${progress.coinsToHalf}`}
                done={progress.halfReached}
              />
              <MiniStat
                label="Hammasi uchun"
                value={progress.goalCoins}
                hint={progress.reached ? 'yetildi ✓' : `yana ${progress.coinsToGoal}`}
                done={progress.reached}
              />
            </div>
          </div>
        </div>

        <div className={cn('space-y-1 rounded-xl border px-4 py-3', MESSAGE_STYLE[message.tier])}>
          <p className="text-sm font-medium">{isSelf ? message.text : getStaffStatusText(progress)}</p>
          {atRisk && (
            <p className="text-xs opacity-80">
              Oy shu natija bilan yopilsa: {progress.earned - progress.burnAmount} coin saqlanadi, {progress.burnAmount} coin
              kuyadi. Oldingi oylarning coinlariga ta'sir qilmaydi.
            </p>
          )}
        </div>

        <PastResults studentId={studentId} />
      </CardContent>
    </Card>
  )
}
