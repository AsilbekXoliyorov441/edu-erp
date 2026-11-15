import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { useTownActions } from '@/entities/town/model/store'
import { INSURANCE, PLOT_BY_ID, estimateValue, formatMoney, insurancePremium } from '@/shared/config/town'

/** Owner panel: insure the plot at its current value. If it's later sold for less than the
 * insured value, a claim goes to a center admin, and the insurance company pays the gap. */
export function InsuranceBox({ plotId, owned, money }) {
  const actions = useTownActions()
  const [busy, setBusy] = useState(false)
  const value = estimateValue(PLOT_BY_ID[plotId], owned)
  const insured = owned.insuredValue ?? 0
  const premium = insurancePremium(value, insured)
  const full = premium <= 0

  const insure = async () => {
    setBusy(true)
    try {
      const res = await actions.insurePlot(plotId)
      playSound('cash')
      toast.success(`🛡️ Hovli ${formatMoney(res.value)} ga sug'urtalandi (badal ${formatMoney(res.premium)})`)
    } catch (err) {
      toast.error(err?.data ?? "Sug'urtalab bo'lmadi")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10">
      <p className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="size-3.5" />
        {insured ? `Sug'urtalangan: ${formatMoney(insured)}` : "Mulk sug'urtasi"}
      </p>
      <p className="text-[11px] text-indigo-900/75 dark:text-indigo-100/75">
        Hovli sug'urta qiymatidan arzonga sotilsa, farqini sug'urta kompaniyasi to'laydi — da'voni admin tasdiqlaydi. Badal bir
        martalik {Math.round(INSURANCE.RATE * 100)}%.
      </p>
      {full ? (
        <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">✅ Joriy qiymati ({formatMoney(value)}) to'liq qoplangan.</p>
      ) : (
        <button
          type="button"
          onClick={insure}
          disabled={busy || owned.inDeal || money < premium}
          className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-black text-white shadow disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : '🛡️'}
          {insured ? `Qoplamani ${formatMoney(value)} gacha oshirish` : `${formatMoney(value)} ga sug'urtalash`} • {formatMoney(premium)}
        </button>
      )}
    </div>
  )
}
