import { cn } from '@/shared/lib/utils'
import { MONTHLY_GOAL } from '@/shared/config/constants'
import { getGoalTone } from '@/shared/lib/stats/monthlyGoal'
import { GOAL_TONE_FILL, GOAL_TONE_TEXT } from '@/shared/ui/goal-tone'

/** Progress bar for the monthly coin goal, with a tick marking the goal line (70%). */
export function GoalProgressBar({ percent, size = 'default', className }) {
  const clamped = Math.max(0, Math.min(percent, 100))
  const tone = getGoalTone(percent)

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
        className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gray-400 dark:bg-gray-500"
        style={{ left: `${MONTHLY_GOAL.PERCENT}%` }}
        title={`Maqsad: ${MONTHLY_GOAL.PERCENT}%`}
      />
    </div>
  )
}

/** Compact "64%" + mini bar, for tables and lists. `progress` null → no lessons yet. */
export function GoalProgressInline({ progress, className }) {
  if (!progress || progress.possible === 0) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Dars yo'q</span>
  }
  const tone = getGoalTone(progress.percent)
  return (
    <div className={cn('flex min-w-28 items-center gap-2', className)}>
      <GoalProgressBar percent={progress.percent} size="sm" className="flex-1" />
      <span className={cn('w-11 text-right text-xs font-semibold tabular-nums', GOAL_TONE_TEXT[tone])}>
        {Math.round(progress.percent)}%
      </span>
    </div>
  )
}
