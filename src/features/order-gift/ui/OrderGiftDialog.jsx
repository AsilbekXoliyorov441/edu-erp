import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CheckCircle2, Coins, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { PinInput } from '@/shared/ui/pin-input'
import { GiftThumb } from '@/entities/gift-order/ui/GiftThumb'
import { useGiftOrderActions, useMyPinStatus } from '@/entities/gift-order/model/store'
import { ROUTES } from '@/shared/config/constants'

function formatLock(lockedUntil) {
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000))
  return `${minutes} daqiqa`
}

function Row({ label, value, strong, tone }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? `font-semibold tabular-nums ${tone ?? 'text-foreground'}` : 'tabular-nums text-foreground'}>{value}</span>
    </div>
  )
}

/** Student-side gift order: confirms with the student's own purchase PIN (sets one up on the
 * first order). Coins are only reserved here — they are deducted once the teacher confirms. */
export function OrderGiftDialog({ gift, available, trigger }) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinRepeat, setPinRepeat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const pinStatus = useMyPinStatus()
  const { placeOrder, setPin: savePin } = useGiftOrderActions()

  const needsSetup = pinStatus && !pinStatus.hasPin
  const locked = pinStatus?.lockedUntil
  const after = available - gift.price

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) {
      setPin('')
      setPinRepeat('')
      setDone(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (pin.length < 4) return toast.error('PIN kamida 4 ta raqam')
    if (needsSetup && pin !== pinRepeat) return toast.error('PIN-kodlar mos kelmadi')

    setSubmitting(true)
    try {
      if (needsSetup) await savePin(pin)
      await placeOrder(gift.id, pin)
      setDone(true)
    } catch (err) {
      toast.error(err.data ?? "Buyurtma yuborilmadi. Qayta urinib ko'ring")
      setPin('')
      setPinRepeat('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success"
            >
              <CheckCircle2 className="size-9" />
            </motion.div>
            <div className="space-y-1.5">
              <DialogTitle>Buyurtma yuborildi!</DialogTitle>
              <DialogDescription>
                <b className="text-foreground">{gift.name}</b> so'rovi ustozingizga yuborildi. Ustoz "Buyurtma berdim" deb
                tasdiqlagach balansingizdan <b className="text-foreground">{gift.price} coin</b> yechiladi. Holatini
                bildirishnomalarda kuzatib borasiz.
              </DialogDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="flex-1">
                <Link to={ROUTES.ORDERS}>Buyurtmalarim</Link>
              </Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>
                Yopish
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Sovg'a buyurtma qilish</DialogTitle>
              <DialogDescription>Buyurtmani shaxsiy PIN-kodingiz bilan tasdiqlang.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <GiftThumb image={gift.image} icon={gift.icon} name={gift.name} />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{gift.name}</p>
                  <p className="flex items-center gap-1 text-sm font-bold text-coin-foreground dark:text-coin">
                    <Coins className="size-3.5" /> {gift.price} coin
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3">
                <Row label="Mavjud coin" value={`${available} coin`} />
                <Row label="Sovg'a narxi" value={`− ${gift.price} coin`} />
                <div className="border-t border-border/60" />
                <Row
                  label="Tasdiqlangandan keyin"
                  value={`${after} coin`}
                  strong
                  tone={after < 0 ? 'text-destructive' : 'text-foreground'}
                />
              </div>

              {locked ? (
                <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  <Lock className="mt-0.5 size-4 shrink-0" />
                  PIN ko'p marta noto'g'ri kiritilgani uchun buyurtma {formatLock(locked)}ga bloklandi.
                </p>
              ) : needsSetup ? (
                <div className="space-y-3">
                  <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      Birinchi buyurtma: <b>xarid PIN-kodini o'rnating</b>. Bu kodni faqat siz bilasiz — uni hech kimga
                      aytmang. Hisobingizga boshqa birov kirsa ham, PIN-siz sizning coinlaringizga sovg'a ola olmaydi.
                    </span>
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="order-pin-new">Yangi PIN (4–6 raqam)</Label>
                    <PinInput id="order-pin-new" value={pin} onChange={setPin} placeholder="••••" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="order-pin-repeat">PIN-ni takrorlang</Label>
                    <PinInput id="order-pin-repeat" value={pinRepeat} onChange={setPinRepeat} placeholder="••••" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="order-pin" className="flex items-center gap-1.5">
                    <KeyRound className="size-3.5" /> Xarid PIN-kodi
                  </Label>
                  <PinInput id="order-pin" value={pin} onChange={setPin} placeholder="PIN-ni kiriting" autoFocus />
                  <p className="text-xs text-muted-foreground">PIN-ni unutgan bo'lsangiz, ustozingizdan tiklashni so'rang.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full gap-1.5 sm:w-auto" disabled={submitting || !pinStatus || Boolean(locked) || after < 0}>
                <ShieldCheck className="size-4" />
                {submitting ? 'Yuborilmoqda...' : needsSetup ? "PIN o'rnatish va buyurtma berish" : 'Buyurtma berish'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
