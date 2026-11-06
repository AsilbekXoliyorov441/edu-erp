import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { PinInput } from '@/shared/ui/pin-input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { useGiftOrderActions, useMyPinStatus } from '@/entities/gift-order/model/store'

function PinDialog({ hasPin, trigger }) {
  const [open, setOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [pin, setPin] = useState('')
  const [repeat, setRepeat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { setPin: savePin } = useGiftOrderActions()

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) {
      setCurrentPin('')
      setPin('')
      setRepeat('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (pin.length < 4) return toast.error('PIN kamida 4 ta raqam')
    if (pin !== repeat) return toast.error('PIN-kodlar mos kelmadi')
    setSubmitting(true)
    try {
      await savePin(pin, hasPin ? currentPin : undefined)
      toast.success(hasPin ? "PIN-kod o'zgartirildi" : "PIN-kod o'rnatildi")
      setOpen(false)
    } catch (err) {
      toast.error(err.data ?? "PIN saqlanmadi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{hasPin ? "PIN-kodni o'zgartirish" : "PIN-kod o'rnatish"}</DialogTitle>
            <DialogDescription>4–6 ta raqam. 1111 yoki 1234 kabi oddiy kodlar qabul qilinmaydi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {hasPin && (
              <div className="space-y-1.5">
                <Label htmlFor="pin-current">Joriy PIN</Label>
                <PinInput id="pin-current" value={currentPin} onChange={setCurrentPin} placeholder="••••" autoFocus />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="pin-new">Yangi PIN</Label>
              <PinInput id="pin-new" value={pin} onChange={setPin} placeholder="••••" autoFocus={!hasPin} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin-repeat">Yangi PIN-ni takrorlang</Label>
              <PinInput id="pin-repeat" value={repeat} onChange={setRepeat} placeholder="••••" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Student's purchase-PIN status, with set / change. */
export function PinSettingsCard() {
  const status = useMyPinStatus()
  if (!status) return null
  const { hasPin } = status

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={
              hasPin
                ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success'
                : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning'
            }
          >
            {hasPin ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Xarid PIN-kodi {hasPin ? "o'rnatilgan" : "o'rnatilmagan"}
            </p>
            <p className="text-sm text-muted-foreground">
              Har bir buyurtma faqat shu kod bilan tasdiqlanadi. Kodni hech kimga aytmang — hisobingizga kirgan boshqa
              odam ham u bilmasa sovg'a buyurtma qila olmaydi.
            </p>
          </div>
        </div>
        <PinDialog
          hasPin={hasPin}
          trigger={
            <Button variant={hasPin ? 'outline' : 'default'} className="shrink-0 gap-1.5">
              <KeyRound className="size-4" /> {hasPin ? "O'zgartirish" : "O'rnatish"}
            </Button>
          }
        />
      </CardContent>
    </Card>
  )
}
