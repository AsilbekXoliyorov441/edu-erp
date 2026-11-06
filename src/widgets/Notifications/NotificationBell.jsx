import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useNotifications } from '@/entities/notification/model/store'
import { formatRelativeUz } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/config/constants'
import { getNotificationMeta, playChime } from '@/widgets/Notifications/notificationMeta'

const BASE_TITLE = typeof document !== 'undefined' ? document.title : ''

function NotificationRow({ item, onOpen }) {
  const { icon: Icon, tone } = getNotificationMeta(item.type)
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/70',
        !item.read && 'bg-primary/[0.04]',
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate text-sm text-foreground', !item.read ? 'font-semibold' : 'font-medium')}>
            {item.title}
          </span>
          {!item.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="O'qilmagan" />}
        </span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground/80">{formatRelativeUz(item.createdAt)}</span>
      </span>
    </button>
  )
}

/** Header bell: unread counter, latest notifications, and a live toast + chime when a new
 * one arrives while the app is open. Also mirrors the unread count in the tab title. */
export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { items, unreadCount, loaded, markRead, markAllRead } = useNotifications()
  const seenIds = useRef(null)

  const openItem = (item) => {
    if (!item.read) markRead(item.id).catch(() => {})
    setOpen(false)
    if (item.orderId) navigate(ROUTES.ORDERS)
  }

  // Toast only notifications that appear after the first load.
  useEffect(() => {
    if (!loaded) return
    if (seenIds.current === null) {
      seenIds.current = new Set(items.map((i) => i.id))
      return
    }
    const fresh = items.filter((i) => !seenIds.current.has(i.id))
    fresh.forEach((i) => seenIds.current.add(i.id))
    if (fresh.length === 0) return
    playChime()
    fresh
      .slice(0, 3)
      .reverse()
      .forEach((item) => {
        const { icon: Icon, tone } = getNotificationMeta(item.type)
        toast(item.title, {
          description: item.body,
          icon: (
            <span className={cn('flex size-7 items-center justify-center rounded-lg', tone)}>
              <Icon className="size-4" />
            </span>
          ),
          duration: 7000,
          action: item.orderId ? { label: "Ko'rish", onClick: () => openItem(item) } : undefined,
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loaded])

  useEffect(() => {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE
    return () => {
      document.title = BASE_TITLE
    }
  }, [unreadCount])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Bildirishnomalar, ${unreadCount} ta o'qilmagan` : 'Bildirishnomalar'}
          className="cs-focus relative flex size-[40px] cursor-pointer items-center justify-center rounded-[10px] border border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-3)] transition-colors hover:bg-[var(--cs-hover)]"
        >
          <motion.span
            key={unreadCount}
            animate={unreadCount > 0 ? { rotate: [0, -14, 12, -8, 5, 0] } : {}}
            transition={{ duration: 0.6 }}
            className="flex"
          >
            <Bell size={18} />
          </motion.span>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--cs-surface)] bg-[var(--cs-danger-fill)] px-1 text-[10px] font-bold text-white tabular-nums"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-24px))] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Bildirishnomalar</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : "Hammasi o'qilgan"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead().catch(() => {})}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <CheckCheck className="size-3.5" /> Hammasini o'qish
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <BellOff className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">Bildirishnoma yo'q</p>
              <p className="text-xs text-muted-foreground">Buyurtmalar bo'yicha yangiliklar shu yerda chiqadi.</p>
            </div>
          ) : (
            items.map((item) => <NotificationRow key={item.id} item={item} onOpen={openItem} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
