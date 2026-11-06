import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { useTownActions } from '@/entities/town/model/store'
import { BANK, formatMoney } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'

const TABS = [
  { id: 'mudaraba', label: '🤝 Mudoraba' },
  { id: 'qard', label: '💚 Qarzi hasana' },
  { id: 'zakat', label: '🕌 Zakot' },
]

function useRun() {
  const [busy, setBusy] = useState(false)
  const run = async (fn, ok) => {
    setBusy(true)
    try {
      const res = await fn()
      playSound('cash')
      if (ok) toast.success(typeof ok === 'function' ? ok(res) : ok)
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }
  return [run, busy]
}

function Explain({ children }) {
  return <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100">{children}</p>
}

function AmountButtons({ amounts, disabled, onPick, color = 'bg-emerald-600' }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {amounts.map(([label, value]) => (
        <button
          key={label}
          type="button"
          disabled={disabled || !(value > 0)}
          onClick={() => onPick(value)}
          className={cn('h-9 cursor-pointer rounded-lg text-xs font-bold text-white disabled:opacity-40', color)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** Islamic bank: interest-free finance — mudaraba profit-sharing, qard al-hasan loans, and
 * zakat / sadaqa into the town's charity fund. */
export function IslamicBank({ me, economy }) {
  const actions = useTownActions()
  const [tab, setTab] = useState('mudaraba')
  const [run, busy] = useRun()
  const ratePerDay = (economy?.rate ?? 0) * 24
  const wealth = me.money + me.bankBalance - me.loan
  const zakat = Math.floor(wealth * BANK.ZAKAT_RATE)
  const [now] = useState(() => Date.now())
  const helpReady = me.money < BANK.HELP_POOR && now - me.helpAt >= BANK.HELP_COOLDOWN_MS

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('h-8 cursor-pointer rounded-lg text-[11px] font-bold', tab === t.id ? 'bg-white shadow dark:bg-gray-950' : 'text-gray-500')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mudaraba' && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 p-3 text-white">
            <p className="text-xs font-bold opacity-80">Sarmoyangiz (mudoraba)</p>
            <p className="text-2xl font-black tabular-nums">{formatMoney(me.bankBalance)}</p>
            <p className="text-xs opacity-85">
              Hozirgi foyda ulushi: ~{(ratePerDay * 100).toFixed(2)}% kuniga • jami olingan foyda {formatMoney(me.mudarabaProfit)}
            </p>
          </div>
          <Explain>
            <b>Foiz yo'q!</b> Bank pulingizni shaharchadagi do'kon, turar-joy va ofislarga sherik sifatida tikadi. Ular daromad qilsa —
            foydaning {Math.round(BANK.INVESTOR_SHARE * 100)}% i sizga, {Math.round((1 - BANK.INVESTOR_SHARE) * 100)}% i bankka. Biznes kam bo'lsa,
            foyda ham kam — kafolat yo'q. Hozir shaharcha bizneslari soatiga {formatMoney(economy?.incomePerHour ?? 0)} ishlayapti.
          </Explain>
          <AmountButtons
            disabled={busy}
            amounts={[
              ['+$10,000', me.money >= 10_000 ? 10_000 : 0],
              ['+$100,000', me.money >= 100_000 ? 100_000 : 0],
              ['Hammasi', me.money],
            ]}
            onPick={(a) => run(() => actions.bankDeposit(a), `🤝 ${formatMoney(a)} sarmoyaga qo'yildi`)}
          />
          <button
            type="button"
            disabled={busy || me.bankBalance < 1}
            onClick={() => run(() => actions.bankWithdraw(me.bankBalance), '💵 Sarmoya foydasi bilan qaytarildi')}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-800 text-sm font-black text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : '💵'} Hammasini yechib olish
          </button>
        </>
      )}

      {tab === 'qard' && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-3 text-white">
            <p className="text-xs font-bold opacity-80">Qarzingiz</p>
            <p className="text-2xl font-black tabular-nums">{formatMoney(me.loan)}</p>
            <p className="text-xs opacity-85">Chegara: {formatMoney(me.loanLimit)} • olgan pulingizni aynan o'zini qaytarasiz</p>
          </div>
          <Explain>
            <b>Qarzi hasana</b> — "chiroyli qarz": ustiga hech qanday foiz qo'shilmaydi. {formatMoney(10_000)} olsangiz,{' '}
            {formatMoney(10_000)} qaytarasiz. Chegara hovlilaringiz qiymatining yarmi. Qarzni vaqtida qaytarish — omonatdorlik!
          </Explain>
          <AmountButtons
            disabled={busy}
            amounts={[
              ['Olish $5,000', me.loan + 5_000 <= me.loanLimit ? 5_000 : 0],
              ['Olish $20,000', me.loan + 20_000 <= me.loanLimit ? 20_000 : 0],
              ['Chegaragacha', me.loanLimit - me.loan],
            ]}
            onPick={(a) => run(() => actions.qardTake(a), `💚 ${formatMoney(a)} foizsiz qarz olindi`)}
          />
          <button
            type="button"
            disabled={busy || me.loan < 1 || me.money < 1}
            onClick={() => run(() => actions.qardRepay(Math.min(me.loan, me.money)), '✅ Qarz qaytarildi — barakalla!')}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-800 text-sm font-black text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : '✅'} Qarzni qaytarish ({formatMoney(Math.min(me.loan, me.money))})
          </button>
        </>
      )}

      {tab === 'zakat' && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 p-3 text-white">
            <p className="text-xs font-bold opacity-85">Xayriya jamg'armasi</p>
            <p className="text-2xl font-black tabular-nums">{formatMoney(economy?.fund ?? 0)}</p>
            <p className="text-xs opacity-90">
              Muhtojlarga berilgan: {formatMoney(economy?.fundGiven ?? 0)} • siz bergan: {formatMoney(me.zakatPaid)}
            </p>
          </div>
          <Explain>
            <b>Zakot</b> — nisobdan ({formatMoney(BANK.NISAB)}) ortiq boylikning 2.5% i. Sizning boyligingiz {formatMoney(Math.max(0, wealth))}, zakoti{' '}
            {wealth >= BANK.NISAB ? formatMoney(zakat) : "— hali nisobga yetmagan"}. Jamg'arma puli kam, hovlisiz o'yinchilarga yordamga ketadi.
          </Explain>
          <button
            type="button"
            disabled={busy || wealth < BANK.NISAB || me.money < zakat}
            onClick={() => run(() => actions.giveCharity('zakat'), (g) => `🕌 ${formatMoney(g)} zakot berildi — Alloh qabul qilsin!`)}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 font-black text-white shadow disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : '🕌'} Zakot berish {wealth >= BANK.NISAB ? `(${formatMoney(zakat)})` : ''}
          </button>
          <AmountButtons
            disabled={busy}
            color="bg-amber-600"
            amounts={[
              ['Sadaqa $100', me.money >= 100 ? 100 : 0],
              ['Sadaqa $1,000', me.money >= 1_000 ? 1_000 : 0],
              ['Sadaqa $10,000', me.money >= 10_000 ? 10_000 : 0],
            ]}
            onPick={(a) => run(() => actions.giveCharity('sadaqa', a), `🤲 ${formatMoney(a)} sadaqa berildi`)}
          />
          {helpReady && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => actions.askHelp(), (g) => `🤲 Jamg'armadan ${formatMoney(g)} yordam oldingiz`)}
              className="h-10 w-full cursor-pointer rounded-xl border-2 border-amber-400 text-sm font-black text-amber-700 dark:text-amber-300"
            >
              🤲 Jamg'armadan yordam so'rash
            </button>
          )}
        </>
      )}
    </div>
  )
}
