import { Ban, Building2, CheckCircle2, Handshake, KeyRound, ListChecks, PackageCheck, ShieldAlert, ShieldCheck, ShieldX, ShoppingBag, Timer, XCircle } from 'lucide-react'

/** Icon + tone per notification type. */
export const NOTIFICATION_META = {
  order_new: { icon: ShoppingBag, tone: 'bg-warning/15 text-warning' },
  order_cancelled: { icon: Ban, tone: 'bg-muted text-muted-foreground' },
  order_ordered: { icon: CheckCircle2, tone: 'bg-primary/10 text-primary' },
  order_delivered: { icon: PackageCheck, tone: 'bg-success/15 text-success' },
  order_rejected: { icon: XCircle, tone: 'bg-destructive/15 text-destructive' },
  pin_reset: { icon: KeyRound, tone: 'bg-primary/10 text-primary' },
  lesson_quiz: { icon: ListChecks, tone: 'bg-success/15 text-success' },
  town_warning: { icon: ShieldAlert, tone: 'bg-destructive/15 text-destructive' },
  town_restored: { icon: Building2, tone: 'bg-success/15 text-success' },
  town_deal_started: { icon: Timer, tone: 'bg-warning/15 text-warning' },
  town_deal_done: { icon: Handshake, tone: 'bg-success/15 text-success' },
  town_deal_cancelled: { icon: Ban, tone: 'bg-muted text-muted-foreground' },
  insurance_claim: { icon: ShieldAlert, tone: 'bg-warning/15 text-warning' },
  insurance_paid: { icon: ShieldCheck, tone: 'bg-success/15 text-success' },
  insurance_rejected: { icon: ShieldX, tone: 'bg-destructive/15 text-destructive' },
}

export function getNotificationMeta(type) {
  return NOTIFICATION_META[type] ?? NOTIFICATION_META.order_ordered
}

/** Soft two-note chime via Web Audio — silent if the browser blocks audio. */
export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.4)
    })
    setTimeout(() => ctx.close(), 1000)
  } catch {
    /* audio unavailable */
  }
}
