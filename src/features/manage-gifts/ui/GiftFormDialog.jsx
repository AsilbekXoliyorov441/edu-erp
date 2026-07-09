import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib/utils'
import { useGiftStore } from '@/entities/gift/model/store'
import { GiftIcon } from '@/entities/gift/ui/GiftIcon'

const ICON_OPTIONS = ['Sticker', 'NotebookPen', 'Coffee', 'Usb', 'Crown', 'Mouse', 'Shirt', 'Backpack']

/** Mounted only while the dialog is open, so its field state always starts fresh from `gift` — no reset effect needed. */
function GiftFormBody({ gift, onDone }) {
  const isEdit = Boolean(gift)
  const [name, setName] = useState(gift?.name ?? '')
  const [price, setPrice] = useState(gift?.price ?? '')
  const [icon, setIcon] = useState(gift?.icon ?? ICON_OPTIONS[0])
  const [image, setImage] = useState(gift?.image ?? '')

  const createGift = useGiftStore((s) => s.create)
  const updateGift = useGiftStore((s) => s.update)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    const numericPrice = Number(price)
    if (!trimmed || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Nom va narxni to'g'ri kiriting")
      return
    }
    const trimmedImage = image.trim() || undefined

    if (isEdit) {
      updateGift(gift.id, { name: trimmed, price: numericPrice, icon, image: trimmedImage })
      toast.success("Sovg'a yangilandi")
    } else {
      createGift({ name: trimmed, price: numericPrice, icon, image: trimmedImage })
      toast.success("Sovg'a qo'shildi")
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Sovg'ani tahrirlash" : "Yangi sovg'a qo'shish"}</DialogTitle>
        <DialogDescription>Coin Market katalogiga mahsulot ma'lumotlarini kiriting.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="gift-name">Nomi</Label>
          <Input
            id="gift-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Futbolka"
            required
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gift-price">Narxi (coin)</Label>
          <Input id="gift-price" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gift-image">Rasm URL (ixtiyoriy)</Label>
          <Input
            id="gift-image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Belgi (rasm bo'lmasa ko'rsatiladi)</Label>
          <div className="grid grid-cols-8 gap-2">
            {ICON_OPTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl border-2 text-muted-foreground transition-colors',
                  icon === key ? 'border-primary bg-secondary text-primary' : 'border-border hover:border-primary/40',
                )}
              >
                <GiftIcon icon={key} className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">{isEdit ? 'Saqlash' : "Qo'shish"}</Button>
      </DialogFooter>
    </form>
  )
}

export function GiftFormDialog({ gift, trigger }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>{open && <GiftFormBody gift={gift} onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  )
}
