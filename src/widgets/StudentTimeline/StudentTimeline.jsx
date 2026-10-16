import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Flame, Gift as GiftIconLucide, History } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { EmptyState } from '@/shared/ui/empty-state'
import { COIN_CATEGORIES, TRANSACTION_TYPES } from '@/shared/config/constants'
import { formatRelativeUz, formatUzMonthYear } from '@/shared/lib/date'

function getBurnLabel(month) {
  if (!month) return 'Coin kuydi'
  const [year, m] = month.split('-').map(Number)
  return `${formatUzMonthYear(year, m - 1)}: oylik maqsadga yetilmadi — coin kuydi`
}

function getLabel(t, entryById, giftById) {
  if (t.type === TRANSACTION_TYPES.COIN_GIVEN) {
    return COIN_CATEGORIES[entryById.get(t.relatedEntryId)?.category]?.label ?? 'Coin berildi'
  }
  if (t.type === TRANSACTION_TYPES.COIN_BURNED) return getBurnLabel(t.month)
  return giftById.get(t.relatedGiftId)?.name ?? "Sovg'a"
}

function buildTimeline(studentId, transactions, coinEntries, gifts) {
  const entryById = new Map(coinEntries.map((e) => [e.id, e]))
  const giftById = new Map(gifts.map((g) => [g.id, g]))

  return transactions
    .filter((t) => t.studentId === studentId)
    .map((t) => ({
      id: t.id,
      type: t.type,
      timestamp: t.timestamp,
      amount: t.amount,
      label: getLabel(t, entryById, giftById),
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function StudentTimeline({ studentId, transactions, coinEntries, gifts }) {
  const [filter, setFilter] = useState('all')

  const items = useMemo(
    () => buildTimeline(studentId, transactions, coinEntries, gifts),
    [studentId, transactions, coinEntries, gifts],
  )

  const filtered = items.filter((item) => {
    if (filter === 'coin') return item.type === TRANSACTION_TYPES.COIN_GIVEN
    if (filter === 'gift') return item.type === TRANSACTION_TYPES.GIFT_REDEEMED
    return true
  })

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Barchasi</TabsTrigger>
          <TabsTrigger value="coin">Coinlar</TabsTrigger>
          <TabsTrigger value="gift">Sovg'alar</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="Tarix bo'sh" description="Hali yozuvlar mavjud emas." />
      ) : (
        <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
          {filtered.map((item, index) => {
            const isCoin = item.type === TRANSACTION_TYPES.COIN_GIVEN
            const isBurn = item.type === TRANSACTION_TYPES.COIN_BURNED
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.4) }}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent/50"
              >
                <div
                  className={
                    isCoin
                      ? 'flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success'
                      : isBurn
                        ? 'flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive'
                        : 'flex size-9 shrink-0 items-center justify-center rounded-xl bg-coin/15 text-coin-foreground dark:text-coin'
                  }
                >
                  {isCoin ? <Coins className="size-4" /> : isBurn ? <Flame className="size-4" /> : <GiftIconLucide className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeUz(item.timestamp)}</p>
                </div>
                <span
                  className={isCoin ? 'text-sm font-semibold text-success' : 'text-sm font-semibold text-destructive'}
                >
                  {isCoin ? '+' : '-'}
                  {item.amount}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
