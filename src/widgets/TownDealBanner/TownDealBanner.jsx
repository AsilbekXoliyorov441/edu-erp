import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useMyTownDeals, useTownActions } from '@/entities/town/model/store'
import { DEAL, dealStep, formatMoney } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'

function useNow(ms) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

function clock(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function DealRow({ deal, now, compact }) {
  const actions = useTownActions()
  const [busy, setBusy] = useState(false)
  const { index, frac } = dealStep(deal.createdAt, deal.closesAt, now)
  const step = DEAL.STEPS[index]
  const selling = deal.role === 'seller'

  const cancel = async () => {
    setBusy(true)
    try {
      await actions.cancelDeal(deal.id)
      toast.success("Bitim bekor qilindi — mulkingiz o'zingizda qoldi")
    } catch (err) {
      toast.error(err?.data ?? "Bekor qilib bo'lmadi")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 shadow-sm',
        selling
          ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100'
          : 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100',
      )}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-2xl" aria-hidden="true">{step.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {selling
              ? `${deal.label} sotilmoqda — @${deal.other}, ${formatMoney(deal.price)}`
              : `${deal.label} — @${deal.other}dan sotib olyapsiz, ${formatMoney(deal.price)}`}
          </p>
          {!compact && <p className="text-xs opacity-80">{step.title}: {step.desc}</p>}
        </div>
        <span className="rounded-lg bg-black/10 px-2 py-1 font-mono text-sm font-bold tabular-nums dark:bg-white/10">
          {clock(deal.closesAt - now)} qoldi
        </span>
        {selling && (
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldAlert className="size-3.5" />}
            Bu men emasman — bekor qilish
          </button>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={cn('h-full rounded-full transition-[width] duration-1000', selling ? 'bg-amber-500' : 'bg-sky-500')} style={{ width: `${Math.round(frac * 100)}%` }} />
      </div>
      {!compact && !selling && (
        <p className="mt-1.5 text-[11px] opacity-70">Pulingiz bitim tugaguncha bankda saqlanadi. Egasi bekor qilsa, to'liq qaytariladi.</p>
      )}
    </div>
  )
}

/** "Your house is being sold — 52:14 left" on every page while a town deal is open, with
 * the seller's "this wasn't me" cancel button. */
export function TownDealBanner({ compact = false, className }) {
  const deals = useMyTownDeals()
  const now = useNow(1000)
  const open = deals.filter((d) => d.closesAt > now - 60_000)
  if (open.length === 0) return null
  return (
    <div className={cn('space-y-2', className)}>
      {open.map((d) => (
        <DealRow key={d.id} deal={d} now={now} compact={compact} />
      ))}
    </div>
  )
}
