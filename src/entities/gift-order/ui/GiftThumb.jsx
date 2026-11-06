import { GiftIcon } from '@/entities/gift/ui/GiftIcon'
import { cn } from '@/shared/lib/utils'

/** Square gift picture, or its icon on a coin-tinted tile when there is no image. */
export function GiftThumb({ image, icon, name, className }) {
  return (
    <div className={cn('flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60', className)}>
      {image ? (
        <img src={image} alt={name} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="flex size-full items-center justify-center bg-coin/15 text-coin-foreground dark:text-coin">
          <GiftIcon icon={icon} className="size-1/2" />
        </div>
      )}
    </div>
  )
}
