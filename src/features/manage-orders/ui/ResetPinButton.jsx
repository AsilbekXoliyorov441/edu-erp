import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
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

/** Teacher clears a student's purchase PIN (forgotten, or set by someone else). The PIN
 * itself is never visible to the teacher — the student sets a new one on the next order. */
export function ResetPinButton({ student }) {
  const [open, setOpen] = useState(false)
  const { resetStudentPin } = useGiftOrderActions()

  const handleConfirm = async () => {
    try {
      await resetStudentPin(student.id)
      toast.success('PIN-kod tiklandi')
    } catch (err) {
      toast.error(err.data ?? "PIN-ni tiklab bo'lmadi")
    }
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <KeyRound /> PIN-ni tiklash
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xarid PIN-kodini tiklash</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="text-foreground">{student.fullName}</b>ning PIN-kodi o'chiriladi. Keyingi buyurtmada o'quvchi
            yangi PIN o'rnatadi. Buni faqat o'quvchining o'zi so'raganda qiling — ehtimol uning hisobiga boshqa odam kirgan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Tiklash</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
