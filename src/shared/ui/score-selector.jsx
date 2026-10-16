import { cn } from '@/shared/lib/utils'

/** Coin score input (0..max) as a row of large rectangular buttons — one tap picks the exact
 * value, no stepping or tiny dots to aim at. */
function ScoreSelector({ value = 0, max, onChange, disabled = false, label, className }) {
  const options = Array.from({ length: max + 1 }, (_, i) => i)

  return (
    <div role="radiogroup" aria-label={label} className={cn('flex w-full gap-1.5', className)}>
      {options.map((n) => {
        const selected = n === value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label ? `${label}: ` : ''}${n} coin`}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(
              'flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl border-2 text-base font-semibold tabular-nums outline-none transition-all',
              'focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1',
              selected
                ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-500/60 dark:hover:bg-gray-800',
              disabled && 'cursor-not-allowed opacity-40 hover:border-gray-200 hover:bg-white dark:hover:bg-gray-900',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

export { ScoreSelector }
