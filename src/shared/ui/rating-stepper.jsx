import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/** Capped dot-rating input used for coin category scoring (0..max). */
function RatingStepper({ value = 0, max, onChange, disabled = false, className }) {
  const dots = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Kamaytirish"
      >
        <Minus className="size-3.5" />
      </Button>
      <div className="flex items-center gap-1">
        {dots.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n === value ? 0 : n)}
            aria-label={`${n} ball qo'yish`}
            className={cn(
              'size-5 cursor-pointer rounded-full border-2 outline-none transition-all',
              n <= value ? 'border-coin bg-coin' : 'border-border bg-transparent hover:border-coin/50',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Ko'paytirish"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}

export { RatingStepper }
