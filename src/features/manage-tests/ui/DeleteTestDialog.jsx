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
import { useTestsForLesson } from '@/entities/test/model/store'

export function DeleteTestDialog({ lessonId, test }) {
  const [open, setOpen] = useState(false)
  const { remove } = useTestsForLesson(lessonId)

  const handleDelete = async () => {
    await remove(test.id)
    toast.success(`"${test.title}" testi o'chirildi`)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Testni o'chirish">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Testni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="text-foreground">{test.title}</strong> va undagi barcha savollar butunlay o'chiriladi. Bu
            amalni ortga qaytarib bo'lmaydi.
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
