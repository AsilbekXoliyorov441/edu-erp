import { cn } from '@/shared/lib/utils'

const GOOD_THRESHOLD_PERCENT = 90
const WARNING_THRESHOLD_PERCENT = 75

/** Severity is inverted from `Meter` (`@/shared/ui/meter`): there, low % is good (cap usage);
 * here, high % is good (attendance rate). Reusing `Meter`'s thresholds directly would color a
 * 95%-attendance group red, so this gets its own scale. */
function getSeverity(percent) {
  if (percent >= GOOD_THRESHOLD_PERCENT) return 'good'
  if (percent >= WARNING_THRESHOLD_PERCENT) return 'warning'
  return 'critical'
}

const FILL_CLASS = { good: 'bg-success', warning: 'bg-warning', critical: 'bg-destructive' }
const TEXT_CLASS = { good: 'text-success', warning: 'text-warning', critical: 'text-destructive' }

/** `percent` is the attendance rate (0-100). Pass `null` when nothing has been tracked yet —
 * renders a neutral "ma'lumot yo'q" state instead of a misleading 0%. */
export function AttendanceMeter({ percent, label, className }) {
  if (percent === null || percent === undefined) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" />
          <span className="ml-2 shrink-0">Ma'lumot yo'q</span>
        </div>
      </div>
    )
  }

  const clamped = Math.max(0, Math.min(percent, 100))
  const severity = getSeverity(percent)

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn('font-semibold tabular-nums', TEXT_CLASS[severity])}>{Math.round(percent)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-[width]', FILL_CLASS[severity])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
