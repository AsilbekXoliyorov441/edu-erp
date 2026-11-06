import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { useGiftOrderActions } from '@/entities/gift-order/model/store'

export function CancelOrderButton({ order }) {
  const [open, setOpen] = useState(false)
  const { cancel } = useGiftOrderActions()

  const handleConfirm = async () => {
    try {
      await cancel(order.id)
      toast.success('Buyurtma bekor qilindi')
    } catch (err) {
      toast.error(err.data ?? "Bekor qilib bo'lmadi")
    }
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Bekor qilish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buyurtmani bekor qilasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            "{order.giftName}" so'rovi bekor qilinadi va band qilingan {order.giftPrice} coin yana ishlatishga ochiladi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Yo'q</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Ha, bekor qilish</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
