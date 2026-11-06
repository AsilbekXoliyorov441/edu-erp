import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Store, Tag, X } from 'lucide-react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { useTownActions } from '@/entities/town/model/store'
import { BUILDING_KINDS, CAR_MODELS, DISTRICTS, MARKET, PLOT_BY_ID, PLOT_SIZES, estimateValue, formatMoney } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'

function usePending() {
  const [busy, setBusy] = useState(false)
  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      if (okMsg) {
        playSound('cash')
        toast.success(okMsg)
      }
      return true
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik yuz berdi')
      return false
    } finally {
      setBusy(false)
    }
  }
  return [run, busy]
}

/** Price box: suggested value, quick ×0.8 / ×1 / ×1.5 / ×2 buttons, or type your own. */
export function PriceSetter({ suggested, current, onList, onUnlist, busy, what }) {
  const [value, setValue] = useState(String(current ?? suggested))
  const price = Math.round(Number(value.replace(/[^\d]/g, '')) || 0)
  const valid = price >= MARKET.MIN_PRICE && price <= MARKET.MAX_PRICE
  return (
    <div className="space-y-2 rounded-xl bg-yellow-50 p-3 dark:bg-yellow-500/10">
      <p className="flex items-center gap-1.5 text-xs font-black text-yellow-900 dark:text-yellow-200">
        <Tag className="size-3.5" /> {current ? `Sotuvda: ${formatMoney(current)}` : `${what}ni sotish`}
      </p>
      <p className="text-[11px] text-yellow-900/70 dark:text-yellow-100/70">Taxminiy qiymati: {formatMoney(suggested)} — narxni o'zingiz belgilaysiz.</p>
      <div className="flex gap-1.5">
        {[0.8, 1, 1.5, 2].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setValue(String(Math.round((suggested * k) / 100) * 100))}
            className="h-7 flex-1 cursor-pointer rounded-md bg-white text-[11px] font-bold shadow-sm hover:bg-yellow-100 dark:bg-gray-800"
          >
            ×{k}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex h-10 flex-1 items-center rounded-lg border border-yellow-300 bg-white px-2 dark:border-yellow-500/40 dark:bg-gray-900">
          <span className="text-gray-400">$</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            className="w-full bg-transparent px-1 text-sm font-bold outline-none"
            aria-label="Narx"
          />
        </div>
        <button
          type="button"
          onClick={() => onList(price)}
          disabled={!valid || busy}
          className="h-10 cursor-pointer rounded-lg bg-yellow-400 px-3 text-sm font-black text-yellow-950 shadow disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : current ? 'Yangilash' : "Sotuvga qo'yish"}
        </button>
      </div>
      {current && (
        <button type="button" onClick={onUnlist} disabled={busy} className="w-full cursor-pointer text-center text-xs font-bold text-yellow-900 hover:underline dark:text-yellow-200">
          Sotuvdan olish
        </button>
      )}
    </div>
  )
}

/** Owner panel section: list this plot (with its building) for sale. */
export function SellPlotBox({ plotId, owned }) {
  const actions = useTownActions()
  const [run, busy] = usePending()
  const plot = PLOT_BY_ID[plotId]
  return (
    <PriceSetter
      what="Hovli"
      suggested={estimateValue(plot, owned)}
      current={owned.salePrice}
      busy={busy}
      onList={(price) => run(() => actions.listPlot(plotId, price), `🏷️ Hovli №${plot.number} sotuvga qo'yildi`)}
      onUnlist={() => run(() => actions.listPlot(plotId, null))}
    />
  )
}

/** Buying a plot another player listed. */
export function BuyListedPlot({ plotId, owned, money }) {
  const actions = useTownActions()
  const [run, busy] = usePending()
  const plot = PLOT_BY_ID[plotId]
  const k = BUILDING_KINDS[owned.kind ?? 'house']
  return (
    <div className="space-y-2 rounded-xl bg-yellow-50 p-3 dark:bg-yellow-500/10">
      <p className="text-sm font-black">🏷️ Sotuvda: {formatMoney(owned.salePrice)}</p>
      <p className="text-[11px] text-gray-600 dark:text-gray-300">
        Taxminiy qiymati {formatMoney(estimateValue(plot, owned))}
        {owned.floors ? ` • ${k.icon} ${k.name}, ${owned.floors} qavat` : ''}. Pul to'g'ridan-to'g'ri @{owned.ownerName}ga o'tadi.
      </p>
      <button
        type="button"
        disabled={busy || money < owned.salePrice}
        onClick={() => run(() => actions.buyListedPlot(plotId, owned.salePrice), `🏡 Hovli №${plot.number} endi sizniki!`)}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-yellow-400 font-black text-yellow-950 shadow disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : '🤝'} Sotib olish
      </button>
      {money < owned.salePrice && <p className="text-center text-xs font-semibold text-rose-600">Yana {formatMoney(owned.salePrice - money)} kerak</p>}
    </div>
  )
}

/** The town market: every plot and car players have put up for sale, plus your own car
 * listing. */
export function MarketPanel({ town, onClose, onShowPlot }) {
  const actions = useTownActions()
  const [run, busy] = usePending()
  const me = town.me
  const plots = town.plots.filter((p) => p.salePrice && p.ownerId !== me.id).sort((a, b) => a.salePrice - b.salePrice)
  const myPlots = town.plots.filter((p) => p.salePrice && p.ownerId === me.id)
  const cars = town.players.filter((p) => p.carSalePrice && p.id !== me.id && p.car)
  const myCarModel = me.car ? CAR_MODELS.find((c) => c.id === me.car.model) : null
  const tradeIn = myCarModel ? Math.round(myCarModel.price / 2) : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl dark:bg-gray-950 dark:text-gray-100"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-400 to-amber-500 p-4 text-yellow-950">
          <div>
            <p className="flex items-center gap-2 text-2xl font-black">
              <Store className="size-6" /> Bozor
            </p>
            <p className="text-sm font-semibold opacity-80">O'yinchilar sotayotgan hovlilar va mashinalar — narxni egasi qo'yadi</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer rounded-xl bg-black/10 p-2 hover:bg-black/20">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          <section className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">🏡 Hovli va binolar • {plots.length}</p>
            {plots.length === 0 && <p className="rounded-xl bg-gray-100 p-3 text-sm text-gray-500 dark:bg-gray-900">Hozircha hech kim hovli sotmayapti.</p>}
            {plots.map((p) => {
              const plot = PLOT_BY_ID[p.plotId]
              const k = BUILDING_KINDS[p.kind ?? 'house']
              const d = DISTRICTS[plot.district]
              const value = estimateValue(plot, p)
              const deal = p.salePrice < value * 0.9
              return (
                <div key={p.plotId} className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                  <span className="h-12 w-1.5 shrink-0 rounded-full" style={{ background: d.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black">
                      Hovli №{plot.number} {p.floors ? `• ${k.icon} ${p.floors} qavat` : ''}
                      {deal && <span className="ml-1.5 rounded bg-emerald-500 px-1.5 text-[10px] font-black text-white">ARZON</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {d.name} • {PLOT_SIZES[plot.size].name} • @{p.ownerName} • qiymati {formatMoney(value)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-black text-emerald-600">{formatMoney(p.salePrice)}</p>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onShowPlot(p.plotId)} className="h-8 cursor-pointer rounded-lg bg-gray-100 px-2 text-xs font-bold hover:bg-gray-200 dark:bg-gray-800">
                        Ko'rish
                      </button>
                      <button
                        type="button"
                        disabled={busy || me.money < p.salePrice}
                        onClick={() => run(() => actions.buyListedPlot(p.plotId, p.salePrice), `🏡 Hovli №${plot.number} endi sizniki!`)}
                        className="h-8 cursor-pointer rounded-lg bg-yellow-400 px-3 text-xs font-black text-yellow-950 disabled:opacity-40"
                      >
                        Olish
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          <section className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">🚗 Mashinalar • {cars.length}</p>
            {cars.length === 0 && <p className="rounded-xl bg-gray-100 p-3 text-sm text-gray-500 dark:bg-gray-900">Hozircha hech kim mashina sotmayapti.</p>}
            {cars.map((p) => {
              const model = CAR_MODELS.find((c) => c.id === p.car.model)
              const total = p.carSalePrice - tradeIn
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                  <span className="size-10 shrink-0 rounded-xl shadow-inner" style={{ background: `radial-gradient(circle at 30% 30%, #fff8, ${p.car.color} 50%)` }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{model?.name ?? 'Mashina'}</p>
                    <p className="text-xs text-gray-500">
                      @{p.nickname} • salonda {formatMoney(model?.price ?? 0)}
                      {tradeIn ? ` • eski mashinangiz −${formatMoney(tradeIn)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-black text-emerald-600">{formatMoney(p.carSalePrice)}</p>
                    <button
                      type="button"
                      disabled={busy || me.money < total}
                      onClick={() => run(() => actions.buyListedCar(p.id, p.carSalePrice), `🚗 ${model?.name} endi sizniki!`)}
                      className="h-8 cursor-pointer rounded-lg bg-yellow-400 px-3 text-xs font-black text-yellow-950 disabled:opacity-40"
                    >
                      Olish
                    </button>
                  </div>
                </div>
              )
            })}
          </section>

          <section className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Mening e'lonlarim</p>
            {myPlots.map((p) => (
              <button
                key={p.plotId}
                type="button"
                onClick={() => onShowPlot(p.plotId)}
                className={cn('flex w-full cursor-pointer items-center justify-between rounded-xl bg-yellow-50 px-3 py-2 text-sm dark:bg-yellow-500/10')}
              >
                <span className="font-bold">Hovli №{PLOT_BY_ID[p.plotId].number}</span>
                <span className="font-black">{formatMoney(p.salePrice)} →</span>
              </button>
            ))}
            {me.car ? (
              <PriceSetter
                what="Mashina"
                suggested={Math.round(((myCarModel?.price ?? 10_000) * 0.75) / 100) * 100}
                current={town.players.find((p) => p.id === me.id)?.carSalePrice}
                busy={busy}
                onList={(price) => run(() => actions.listCar(price), "🏷️ Mashinangiz sotuvga qo'yildi")}
                onUnlist={() => run(() => actions.listCar(null))}
              />
            ) : (
              <p className="text-xs text-gray-500">Mashinangiz yo'q.</p>
            )}
            <p className="text-[11px] text-gray-500">Hovlini sotish uchun uni xaritada bosing → «Hovlini sotish».</p>
          </section>
        </div>
      </motion.div>
    </motion.div>
  )
}
