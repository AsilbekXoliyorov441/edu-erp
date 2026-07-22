import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { useCenterStore } from '@/entities/center/model/store'

export function CreateCenterDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [subscriptionPrice, setSubscriptionPrice] = useState('')
  const [periodDays, setPeriodDays] = useState('30')
  const [submitting, setSubmitting] = useState(false)
  const createCenter = useCenterStore((s) => s.create)

  const resetForm = () => {
    setName('')
    setSubscriptionPrice('')
    setPeriodDays('30')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const price = Number(subscriptionPrice)
    const days = Number(periodDays)
    if (!trimmedName || !Number.isFinite(price) || price < 0 || !Number.isFinite(days) || days <= 0) return

    setSubmitting(true)
    try {
      await createCenter(trimmedName, price, days)
      toast.success(`${trimmedName} markazi qo'shildi`)
      resetForm()
      setOpen(false)
    } catch (error) {
      toast.error(error?.message ?? "Markaz qo'shishda xatolik")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (next) => {
    setOpen(next)
    if (!next) resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Markaz qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yangi o'quv markaz</DialogTitle>
            <DialogDescription>
              Markaz yaratilgach, unga direktor tayinlang — direktor o'z markazi uchun EduSuperAdmin qo'sha oladi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="center-name">Markaz nomi</Label>
              <Input
                id="center-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: PDP Chilonzor"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="center-price">Obuna narxi (so'm)</Label>
                <Input
                  id="center-price"
                  type="number"
                  min="0"
                  value={subscriptionPrice}
                  onChange={(e) => setSubscriptionPrice(e.target.value)}
                  placeholder="1000000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="center-period">Muddat (kun)</Label>
                <Input
                  id="center-period"
                  type="number"
                  min="1"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Qo'shish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
