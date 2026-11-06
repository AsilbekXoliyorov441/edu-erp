import { BrainCircuit, CodeXml, Shapes, ShieldCheck, Users2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

/** Two-snake Python mark, drawn in the same stroke style as the lucide icons. */
function PythonIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2c-3 0-4 1.2-4 3v2h4.5v1H6c-2 0-3.5 1.5-3.5 4s1.5 4 3.5 4h2v-2.5c0-1.7 1.3-3 3-3h4c1.4 0 2.5-1.1 2.5-2.5V5c0-1.8-1.5-3-5.5-3Z" />
      <path d="M12 22c3 0 4-1.2 4-3v-2h-4.5v-1H18c2 0 3.5-1.5 3.5-4S20 8 18 8h-2v2.5c0 1.7-1.3 3-3 3H9c-1.4 0-2.5 1.1-2.5 2.5V19c0 1.8 1.5 3 5.5 3Z" />
      <circle cx="10" cy="4.75" r=".5" fill="currentColor" />
      <circle cx="14" cy="19.25" r=".5" fill="currentColor" />
    </svg>
  )
}

const DIRECTION_STYLES = {
  frontend: { Icon: CodeXml, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  python: { Icon: PythonIcon, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  ai: { Icon: BrainCircuit, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  cyber: { Icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  other: { Icon: Shapes, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
}

/** Rounded tile with the group's direction icon; groups without a direction get the old
 * generic look. */
export function GroupIcon({ direction, className, iconClassName }) {
  const style = DIRECTION_STYLES[direction]
  const Icon = style?.Icon ?? Users2
  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-2xl',
        style?.tone ?? 'bg-secondary text-primary',
        className,
      )}
    >
      <Icon className={cn('size-5', iconClassName)} />
    </div>
  )
}
