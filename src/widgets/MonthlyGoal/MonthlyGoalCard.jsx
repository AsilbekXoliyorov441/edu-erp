import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Flame, ShieldCheck, Target } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { GoalProgressBar } from '@/shared/ui/goal-progress'
import { GOAL_TONE_TEXT } from '@/shared/ui/goal-tone'
import { useCurrentMonthGoal, useMonthlyGoalResults } from '@/entities/monthly-goal/model/store'
import { MONTHLY_GOAL, ROUTES } from '@/shared/config/constants'
import { getDaysLeftInMonth, getGoalTone } from '@/shared/lib/stats/monthlyGoal'
import { cn } from '@/shared/lib/utils'
import { formatMonthKey, getGoalMessage } from '@/widgets/MonthlyGoal/goalMessages'

const MESSAGE_STYLE = {
  empty: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  star: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  reached: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  close: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  behind: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
}

/** Neutral status line for a teacher/admin looking at someone else's profile. */
function getStaffStatusText(progress) {
  if (!progress || progress.possible === 0) return "Bu oy hali dars bo'lmagan."
  if (progress.reached) return `Maqsadga yetgan — ${Math.round(progress.percent)}%. Bu oygi coinlari saqlanadi.`
  return `Maqsadgacha yana ${progress.coinsToGoal} coin kerak (hozir ${Math.round(progress.percent)}%).`
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-gray-100 px-3 py-2.5 dark:bg-gray-800/60">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
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
    <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
      <p className="text-sm font-medium text-foreground">Oldingi oylar</p>
      <div className="space-y-1.5">
        {results.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{formatMonthKey(r.month)}</span>
            <span className="flex items-center gap-2">
              <span className={cn('font-semibold tabular-nums', GOAL_TONE_TEXT[getGoalTone(r.percent)])}>
                {Math.round(r.percent)}%
              </span>
              {r.reached ? (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <ShieldCheck className="size-3" /> Saqlandi
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/15 dark:text-red-300">
                  <Flame className="size-3" /> {r.burned} coin kuydi
                </span>
              )}
            </span>
          </div>
        ))}
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
            <GoalProgressBar percent={percent} />
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

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-500/25">
              <Target className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Oylik maqsad — {formatMonthKey(monthKey)}</h3>
              <p className="text-sm text-muted-foreground">
                Oy davomida mumkin bo'lgan coinlarning kamida {MONTHLY_GOAL.PERCENT}% ini yig'ish kerak
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-4xl font-extrabold tabular-nums', GOAL_TONE_TEXT[tone])}>{Math.round(percent)}%</p>
            <p className="text-xs text-muted-foreground">maqsad: {MONTHLY_GOAL.PERCENT}%</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <GoalProgressBar percent={percent} size="lg" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Bu oy yig'ildi" value={`${progress?.earned ?? 0} coin`} />
          <Stat label="Mumkin bo'lgan" value={`${progress?.possible ?? 0} coin`} hint="o'tilgan darslar bo'yicha" />
          <Stat
            label="Maqsadgacha"
            value={progress?.reached ? '✓' : `${progress?.coinsToGoal ?? 0} coin`}
            hint={progress?.reached ? 'yetildi' : undefined}
          />
          <Stat label="Oy tugashiga" value={`${daysLeft} kun`} />
        </div>

        <div className={cn('rounded-xl border px-4 py-3 text-sm font-medium', MESSAGE_STYLE[message.tier])}>
          {isSelf ? message.text : getStaffStatusText(progress)}
        </div>

        {atRisk && (
          <div className="flex items-start gap-2.5 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-red-500" />
            <p>
              {isSelf ? 'Agar' : "Agar o'quvchi"} oy oxirigacha {MONTHLY_GOAL.PERCENT}% ga {isSelf ? 'yetmasangiz' : 'yetmasa'}, bu
              oyda yig'ilgan <span className="font-semibold text-red-600 dark:text-red-400">{progress.earned} coin</span>{' '}
              kuyib ketadi. Oldingi oylarda yig'ilgan coinlarga ta'sir qilmaydi.
            </p>
          </div>
        )}

        <PastResults studentId={studentId} />
      </CardContent>
    </Card>
  )
}
