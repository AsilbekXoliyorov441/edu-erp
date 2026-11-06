import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock3, Coins, Inbox, PackageCheck, Search, ShoppingBag, Store } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useAuthStore } from '@/entities/session/model/store'
import { useGiftOrders } from '@/entities/gift-order/model/store'
import { ORDER_STATUS, getReservedCoins } from '@/entities/gift-order/model/status'
import { OrderStatusBadge } from '@/entities/gift-order/ui/OrderStatusBadge'
import { OrderProgress } from '@/entities/gift-order/ui/OrderProgress'
import { GiftThumb } from '@/entities/gift-order/ui/GiftThumb'
import { GroupIcon } from '@/entities/group/ui/GroupIcon'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { OrderActions } from '@/features/manage-orders/ui/OrderActions'
import { CancelOrderButton } from '@/features/order-gift/ui/CancelOrderButton'
import { PinSettingsCard } from '@/features/order-gift/ui/PinSettingsCard'
import { getStudentBalance } from '@/shared/lib/stats'
import { formatRelativeUz, formatUzDate } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'
import { ROLES, ROUTES } from '@/shared/config/constants'

const FILTERS = [
  { key: 'pending', label: 'Yangi', match: (o) => o.status === ORDER_STATUS.PENDING },
  { key: 'ordered', label: 'Topshirilishi kerak', match: (o) => o.status === ORDER_STATUS.ORDERED },
  { key: 'delivered', label: 'Topshirilgan', match: (o) => o.status === ORDER_STATUS.DELIVERED },
  {
    key: 'closed',
    label: 'Rad / bekor',
    match: (o) => o.status === ORDER_STATUS.REJECTED || o.status === ORDER_STATUS.CANCELLED,
  },
  { key: 'all', label: 'Hammasi', match: () => true },
]

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderMeta({ order }) {
  if (order.status === ORDER_STATUS.ORDERED || order.status === ORDER_STATUS.DELIVERED) {
    const at = order.status === ORDER_STATUS.DELIVERED ? order.deliveredAt : order.orderedAt
    return (
      <p className="text-xs text-muted-foreground">
        {order.status === ORDER_STATUS.DELIVERED ? 'Topshirdi' : 'Buyurtma berdi'}:{' '}
        <span className="text-foreground">{order.handledByName ?? '—'}</span> · {formatUzDate(at, { withTime: true })}
      </p>
    )
  }
  if (order.status === ORDER_STATUS.REJECTED) {
    return (
      <p className="text-xs text-destructive">
        Rad etildi{order.handledByName ? ` (${order.handledByName})` : ''}
        {order.rejectReason ? `: ${order.rejectReason}` : ''}
      </p>
    )
  }
  return null
}

function TeacherOrderCard({ order, index }) {
  const isPending = order.status === ORDER_STATUS.PENDING
  const short = isPending && order.studentBalance != null && order.studentBalance < order.giftPrice
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
      <Card className={cn('overflow-hidden', isPending && 'border-l-4 border-l-warning')}>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <GiftThumb image={order.giftImage} icon={order.giftIcon} name={order.giftName} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="line-clamp-1 font-semibold text-foreground">{order.giftName}</p>
                <Badge variant="coin">{order.giftPrice} coin</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link to={ROUTES.studentProfile(order.studentId)} className="font-medium text-primary hover:underline">
                  {order.studentName}
                </Link>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <GroupIcon direction={order.groupDirection} className="size-5 rounded-md" iconClassName="size-3" />
                  {order.groupName}
                </span>
                <span className="text-xs text-muted-foreground" title={formatUzDate(order.createdAt, { withTime: true })}>
                  {formatRelativeUz(order.createdAt)}
                </span>
              </div>
              {isPending && order.studentBalance != null && (
                <p className={cn('flex items-center gap-1 text-xs', short ? 'text-destructive' : 'text-muted-foreground')}>
                  {short ? <AlertTriangle className="size-3.5" /> : <Coins className="size-3.5" />}
                  Balansi: <b className="tabular-nums">{order.studentBalance} coin</b>
                  {short && " — yetarli emas, rad eting"}
                </p>
              )}
              <OrderMeta order={order} />
              {(order.status === ORDER_STATUS.ORDERED || order.status === ORDER_STATUS.DELIVERED) && (
                <OrderProgress status={order.status} className="max-w-md pt-1" />
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <OrderStatusBadge status={order.status} />
            <OrderActions order={order} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TeacherOrders({ orders }) {
  const pendingCount = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length
  const [filter, setFilter] = useState(() => (pendingCount > 0 ? 'pending' : 'all'))
  const [groupId, setGroupId] = useState('all')
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => map.set(o.groupId, o.groupName))
    return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [orders])

  const scoped = orders.filter(
    (o) =>
      (groupId === 'all' || o.groupId === groupId) &&
      (!search.trim() ||
        o.studentName.toLowerCase().includes(search.trim().toLowerCase()) ||
        o.giftName.toLowerCase().includes(search.trim().toLowerCase())),
  )
  const active = FILTERS.find((f) => f.key === filter)
  const visible = scoped.filter(active.match)
  const spent = orders
    .filter((o) => o.status === ORDER_STATUS.ORDERED || o.status === ORDER_STATUS.DELIVERED)
    .reduce((sum, o) => sum + o.giftPrice, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Clock3} label="Yangi so'rovlar" value={pendingCount} tone="bg-warning/15 text-warning" />
        <StatTile
          icon={CheckCircle2}
          label="Topshirilishi kerak"
          value={orders.filter((o) => o.status === ORDER_STATUS.ORDERED).length}
          tone="bg-primary/10 text-primary"
        />
        <StatTile
          icon={PackageCheck}
          label="Topshirilgan"
          value={orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length}
          tone="bg-success/15 text-success"
        />
        <StatTile icon={Coins} label="Sovg'alarga sarflangan" value={`${spent} coin`} tone="bg-coin/15 text-coin-foreground dark:text-coin" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1" role="tablist">
          {FILTERS.map((f) => {
            const count = scoped.filter(f.match).length
            const selected = f.key === filter
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    f.key === 'pending' && count > 0 ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="O'quvchi yoki sovg'a" className="pl-9" />
          </div>
          {groups.length > 1 && (
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Guruh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha guruhlar</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === 'pending' ? "Yangi so'rov yo'q" : "Buyurtma yo'q"}
          description={
            orders.length === 0
              ? "O'quvchilar Coin Market'dan sovg'a buyurtma qilganda shu yerda ko'rinadi."
              : "Bu bo'limda hozircha hech narsa yo'q."
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((order, index) => (
            <TeacherOrderCard key={order.id} order={order} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentOrders({ orders }) {
  const userId = useAuthStore((s) => s.userId)
  const transactions = useTransactionStore((s) => s.items)
  const balance = getStudentBalance(userId, transactions)
  const reserved = getReservedCoins(orders, userId)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={Coins} label="Balans" value={`${balance} coin`} tone="bg-coin/15 text-coin-foreground dark:text-coin" />
        <StatTile icon={Clock3} label="Band qilingan" value={`${reserved} coin`} tone="bg-warning/15 text-warning" />
        <StatTile icon={ShoppingBag} label="Ishlatish mumkin" value={`${balance - reserved} coin`} tone="bg-success/15 text-success" />
      </div>

      <PinSettingsCard />

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Hali buyurtma bermagansiz"
          description="Coin Market'dan yoqqan sovg'ani tanlang va coinlaringizga buyurtma qiling."
          action={
            <Button asChild className="gap-1.5">
              <Link to={ROUTES.COIN_MARKET}>
                <Store className="size-4" /> Coin Market
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
            >
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <GiftThumb image={order.giftImage} icon={order.giftIcon} name={order.giftName} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="line-clamp-2 font-semibold text-foreground">{order.giftName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="coin">{order.giftPrice} coin</Badge>
                        <span>{formatUzDate(order.createdAt, { withTime: true })}</span>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} className="shrink-0" />
                  </div>
                  <OrderProgress status={order.status} />
                  {order.status === ORDER_STATUS.PENDING && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-warning/10 px-3 py-2">
                      <p className="text-xs text-foreground">
                        Ustoz tasdiqlashini kutmoqda. {order.giftPrice} coin band qilingan, hali yechilmagan.
                      </p>
                      <CancelOrderButton order={order} />
                    </div>
                  )}
                  {order.status === ORDER_STATUS.ORDERED && (
                    <p className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-foreground">
                      Ustozingiz buyurtma berdi — balansingizdan {order.giftPrice} coin yechildi. Sovg'a tez orada qo'lingizga
                      beriladi.
                    </p>
                  )}
                  {order.status === ORDER_STATUS.REJECTED && (
                    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      Rad etildi{order.rejectReason ? `: ${order.rejectReason}` : ''}. Coinlaringiz yechilmadi.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export function OrdersPage() {
  const role = useAuthStore((s) => s.role)
  const { items, loading } = useGiftOrders()

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    )
  }

  return role === ROLES.STUDENT ? <StudentOrders orders={items} /> : <TeacherOrders orders={items} />
}
