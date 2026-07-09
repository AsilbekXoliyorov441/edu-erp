import { cn } from '@/shared/lib/utils'

function Switch({ checked, onCheckedChange, disabled, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-[22px]',
        )}
      />
    </button>
  )
}

export { Switch }
