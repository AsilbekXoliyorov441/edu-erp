import { cn } from '@/shared/lib/utils'
import { MONTHLY_GOAL } from '@/shared/config/constants'
import { getGoalTone } from '@/shared/lib/stats/monthlyGoal'
import { GOAL_TONE_FILL, GOAL_TONE_TEXT } from '@/shared/ui/goal-tone'

/** Progress bar for the monthly coin goal, with ticks marking the half line (50%) and the goal line (70%). `tone`
 * defaults to one derived from `percent` alone (fine for closed months); live views pass
 * `getProgressTone(progress)` so mid-month pace decides the color. */
export function GoalProgressBar({ percent, tone = getGoalTone(percent), size = 'default', className }) {
  const clamped = Math.max(0, Math.min(percent, 100))

  return (
    <div
      className={cn(
        'relative w-full rounded-full bg-gray-100 dark:bg-gray-800',
        size === 'lg' ? 'h-4' : size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', GOAL_TONE_FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
      <div
        className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gray-300 dark:bg-gray-600"
        style={{ left: `${MONTHLY_GOAL.HALF_PERCENT}%` }}
        title={`${MONTHLY_GOAL.HALF_PERCENT}% dan oshsa — yarmi saqlanadi`}
      />
      <div
        className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gray-500 dark:bg-gray-400"
        style={{ left: `${MONTHLY_GOAL.PERCENT}%` }}
        title={`${MONTHLY_GOAL.PERCENT}% — hammasi saqlanadi`}
      />
    </div>
  )
}

/** Thin bar over the three outcome zones (≤50% burns, 50–70% half kept, 70%+ all kept),
 * with the student's progress as a blue fill — for tables and lists. */
export function GoalZoneTrack({ percent, className }) {
  const clamped = Math.max(0, Math.min(percent, 100))
  const half = MONTHLY_GOAL.HALF_PERCENT
  const goal = MONTHLY_GOAL.PERCENT
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full', className)}>
      <div className="absolute inset-0 flex">
        <div className="bg-red-100 dark:bg-red-500/15" style={{ width: `${half}%` }} />
        <div className="bg-amber-100 dark:bg-amber-500/15" style={{ width: `${goal - half}%` }} />
        <div className="flex-1 bg-blue-100 dark:bg-blue-500/15" />
      </div>
      <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-[width] duration-500" style={{ width: `${clamped}%` }} />
      <div className="absolute inset-y-0 w-px bg-white dark:bg-gray-900" style={{ left: `${half}%` }} />
      <div className="absolute inset-y-0 w-px bg-white dark:bg-gray-900" style={{ left: `${goal}%` }} />
    </div>
  )
}

/** Compact "64%" + zone track, for tables and lists. `progress` null → no lessons yet. */
export function GoalProgressInline({ progress, className }) {
  if (!progress || progress.possible === 0) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Dars yo'q</span>
  }
  const tone = getGoalTone(progress.percent)
  return (
    <div
      className={cn('flex min-w-28 items-center gap-2', className)}
      title={`${progress.earned} / ${progress.possible} coin (${progress.totalLessons} ta dars)`}
    >
      <GoalZoneTrack percent={progress.percent} className="flex-1" />
      <span className={cn('w-10 text-right text-xs font-semibold tabular-nums', GOAL_TONE_TEXT[tone])}>
        {Math.round(progress.percent)}%
      </span>
    </div>
  )
}
