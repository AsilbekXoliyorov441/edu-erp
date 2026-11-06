import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const STEPS = [
  { key: 'pending', label: "So'rov yuborildi" },
  { key: 'ordered', label: 'Buyurtma berildi' },
  { key: 'delivered', label: 'Topshirildi' },
]
const STEP_INDEX = { pending: 0, ordered: 1, delivered: 2 }

/** Three-step tracker for an order in progress. Closed orders (rejected/cancelled) don't
 * use it — they show a status badge instead. */
export function OrderProgress({ status, className }) {
  const current = STEP_INDEX[status]
  if (current == null) return null
  return (
    <ol className={cn('flex items-center gap-1.5', className)} aria-label="Buyurtma holati">
      {STEPS.map((step, index) => {
        const done = index <= current
        return (
          <li key={step.key} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                index === current && status !== 'delivered' && 'ring-4 ring-primary/15',
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
            </span>
            <span className={cn('truncate text-xs', done ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className={cn('h-px min-w-3 flex-1', index < current ? 'bg-primary' : 'bg-border')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
