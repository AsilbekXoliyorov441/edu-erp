import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
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
import { useTopics } from '@/entities/test/model/store'

export function DeleteTestDialog({ test, onDeleted, trigger }) {
  const [open, setOpen] = useState(false)
  const { remove } = useTopics()

  const handleDelete = async () => {
    await remove(test.id)
    toast.success(`"${test.title}" mavzusi o'chirildi`)
    setOpen(false)
    onDeleted?.()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Mavzuni o'chirish">
            <Trash2 className="size-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mavzuni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="text-foreground">{test.title}</strong> va undagi barcha savollar, guruhlarga ulanishlar hamda
            o'quvchilar natijalari butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Ha, o'chirish</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
