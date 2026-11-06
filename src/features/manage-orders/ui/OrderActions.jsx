import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, PackageCheck, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useGiftOrderActions } from '@/entities/gift-order/model/store'
import { ORDER_STATUS } from '@/entities/gift-order/model/status'

function ConfirmDialog({ trigger, title, description, confirmLabel, confirmVariant = 'default', onConfirm, children }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      const ok = await onConfirm()
      if (ok !== false) setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>{description}</div>
          </DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Bekor qilish
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

async function run(action, success, fallback) {
  try {
    await action()
    toast.success(success)
    return true
  } catch (err) {
    toast.error(err.data ?? fallback)
    return false
  }
}

/** Teacher/admin controls for one order, by status:
 * pending → "Buyurtma berdim" (deducts coins) / "Rad etish"; ordered → "Topshirildi". */
export function OrderActions({ order }) {
  const { markOrdered, markDelivered, reject } = useGiftOrderActions()
  const [reason, setReason] = useState('')
  const short = order.studentBalance != null && order.studentBalance < order.giftPrice

  if (order.status === ORDER_STATUS.PENDING) {
    return (
      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          title="Buyurtma berdingizmi?"
          confirmLabel="Ha, buyurtma berdim"
          description={
            <div className="space-y-2 text-sm">
              <p>
                <b className="text-foreground">{order.studentName}</b> uchun{' '}
                <b className="text-foreground">{order.giftName}</b> buyurtma qilinganini tasdiqlaysiz.
              </p>
              <p>
                O'quvchi balansidan <b className="text-foreground">{order.giftPrice} coin</b> yechiladi va unga xabar
                boradi.
              </p>
            </div>
          }
          onConfirm={() => run(() => markOrdered(order.id), 'Tasdiqlandi — coin yechildi', 'Tasdiqlab bo\'lmadi')}
          trigger={
            <Button size="sm" className="gap-1.5" disabled={short}>
              <CheckCircle2 /> Buyurtma berdim
            </Button>
          }
        />
        <ConfirmDialog
          title="Buyurtmani rad etish"
          confirmLabel="Rad etish"
          confirmVariant="destructive"
          description={
            <p className="text-sm">
              <b className="text-foreground">{order.giftName}</b> rad etiladi. O'quvchining coinlari yechilmaydi, unga
              sababi bilan xabar boradi.
            </p>
          }
          onConfirm={async () => {
            const ok = await run(() => reject(order.id, reason), 'Buyurtma rad etildi', "Rad etib bo'lmadi")
            if (ok) setReason('')
            return ok
          }}
          trigger={
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive">
              <XCircle /> Rad etish
            </Button>
          }
        >
          <div className="space-y-1.5">
            <Label htmlFor={`reject-${order.id}`}>Sabab (ixtiyoriy)</Label>
            <Textarea
              id={`reject-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: sovg'a hozircha mavjud emas"
              maxLength={300}
              rows={3}
            />
          </div>
        </ConfirmDialog>
      </div>
    )
  }

  if (order.status === ORDER_STATUS.ORDERED) {
    return (
      <ConfirmDialog
        title="Sovg'a topshirildimi?"
        confirmLabel="Ha, topshirildi"
        description={
          <p className="text-sm">
            <b className="text-foreground">{order.giftName}</b> <b className="text-foreground">{order.studentName}</b>ga
            qo'liga berilganini tasdiqlang.
          </p>
        }
        onConfirm={() => run(() => markDelivered(order.id), 'Topshirildi deb belgilandi', "Belgilab bo'lmadi")}
        trigger={
          <Button size="sm" variant="secondary" className="gap-1.5">
            <PackageCheck /> Topshirildi
          </Button>
        }
      />
    )
  }

  return null
}
