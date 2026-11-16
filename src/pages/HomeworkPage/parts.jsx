import { AlertTriangle, Bot, CheckCircle2, Clock, Coins, Loader2, XCircle } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { formatUzDayTime } from '@/shared/lib/date'
import { timeLeft } from '@/pages/HomeworkPage/time'

/** What the AI said: score, coins, feedback, and the warning when the work looked AI-written. */
export function Verdict({ sub, maxCoins }) {
  if (sub.status === 'checking') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
        <Loader2 className="size-4 animate-spin" /> AI tekshirmoqda… odatda bir daqiqa ichida tayyor bo'ladi
      </div>
    )
  }
  if (sub.status === 'failed') {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <XCircle className="mt-0.5 size-4 shrink-0" />
        <span>
          {sub.error?.includes('ulanmagan')
            ? "AI tekshiruvchi hali sozlanmagan. Ustozingizga ayting — sozlangach «Yakunlash» ni yana bosing yoki ustoz qayta tekshiradi."
            : "Tekshirib bo'lmadi. Qaytadan yuborishingiz mumkin yoki ustozingiz qayta tekshiradi."}
        </span>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" className="text-sm">
          <CheckCircle2 className="size-3.5" /> {sub.score}/10
        </Badge>
        <Badge variant="coin" className="text-sm">
          <Coins className="size-3.5" /> +{sub.coins} / {maxCoins} coin
        </Badge>
        {sub.teacherEdited && <Badge variant="secondary">Ustoz tekshirdi</Badge>}
      </div>
      {sub.penalized && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            <b>Ogohlantirish:</b> ish AI yordamida bajarilganga o'xshaydi, shuning uchun coin kamaytirildi.
            {sub.aiReason ? ` ${sub.aiReason}` : ''} Keyingi vazifalarni o'zingiz bajaring.
          </span>
        </div>
      )}
      {sub.capped && !sub.penalized && (
        <p className="text-xs text-muted-foreground">Bu dars uchun uy vazifasi coinining bir qismini ustoz avval bergan.</p>
      )}
      {sub.feedback && (
        <div className="flex items-start gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
          <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="whitespace-pre-line">{sub.feedback}</p>
        </div>
      )}
    </div>
  )
}

/** Title, deadline, coins and the task text of a homework. */
export function HomeworkHeader({ homework, now }) {
  const left = timeLeft(homework.dueAt, now)
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{homework.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Muddat: {formatUzDayTime(homework.dueAt)}
            {left && <span className="font-semibold text-primary">· {left}</span>}
          </p>
        </div>
        <Badge variant="coin">
          <Coins className="size-3" /> {homework.maxCoins} coingacha
        </Badge>
      </div>
      {homework.task && <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{homework.task}</p>}
    </>
  )
}
