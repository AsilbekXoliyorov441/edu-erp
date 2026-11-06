import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Masked numeric PIN field (4–6 digits). Strips anything that isn't a digit. */
export const PinInput = React.forwardRef(({ value, onChange, className, ...props }, ref) => (
  <input
    ref={ref}
    type="password"
    inputMode="numeric"
    autoComplete="off"
    maxLength={6}
    value={value}
    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    className={cn(
      'h-12 w-full rounded-xl border border-input bg-card px-4 text-center font-mono text-2xl tracking-[0.6em] text-foreground shadow-sm outline-none transition-colors placeholder:tracking-normal placeholder:text-sm placeholder:font-sans placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
PinInput.displayName = 'PinInput'
