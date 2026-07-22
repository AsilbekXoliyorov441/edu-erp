import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCenterStore } from '@/entities/center/model/store'

export function RenewSubscriptionDialog({ centerId, centerName, currentPrice }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(currentPrice ?? ''))
  const [periodDays, setPeriodDays] = useState('30')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const renew = useCenterStore((s) => s.renew)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const amountNumber = Number(amount)
    const days = Number(periodDays)
    if (!Number.isFinite(amountNumber) || amountNumber < 0 || !Number.isFinite(days) || days <= 0) return

    setSubmitting(true)
    try {
      await renew(centerId, amountNumber, days, note.trim() || undefined)
      toast.success(`${centerName} obunasi yangilandi`)
      setOpen(false)
      setNote('')
    } catch (error) {
      toast.error(error?.message ?? 'Obunani yangilashda xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <CreditCard className="size-3.5" /> Obunani yangilash
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{centerName} — obunani yangilash</DialogTitle>
            <DialogDescription>To'lov qabul qilingach, amal qilish muddatini uzaytiring.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="renew-amount">To'lov summasi (so'm)</Label>
                <Input id="renew-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="renew-period">Muddat (kun)</Label>
                <Input
                  id="renew-period"
                  type="number"
                  min="1"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renew-note">Izoh (ixtiyoriy)</Label>
              <Textarea id="renew-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: 2026-yil avgust to'lovi" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Yangilash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
