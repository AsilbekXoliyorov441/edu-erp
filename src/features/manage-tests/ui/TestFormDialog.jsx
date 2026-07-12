import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useTestsForLesson } from '@/entities/test/model/store'

/** Mounted only while the dialog is open, so its field state always starts fresh from `test`. */
function TestFormBody({ lessonId, test, onDone }) {
  const isEdit = Boolean(test)
  const [title, setTitle] = useState(test?.title ?? '')
  const { create, update } = useTestsForLesson(lessonId)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    if (isEdit) {
      await update(test.id, trimmed)
      toast.success('Test yangilandi')
    } else {
      await create(trimmed)
      toast.success("Test qo'shildi")
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Testni tahrirlash' : "Yangi test qo'shish"}</DialogTitle>
        <DialogDescription>Test nomini kiriting, so'ng unga savollar qo'shishingiz mumkin.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5 py-4">
        <Label htmlFor="test-title">Test nomi</Label>
        <Input
          id="test-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masalan: 1-dars yakuniy testi"
          autoFocus
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit">{isEdit ? 'Saqlash' : "Qo'shish"}</Button>
      </DialogFooter>
    </form>
  )
}

export function TestFormDialog({ lessonId, test, trigger }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>{open && <TestFormBody lessonId={lessonId} test={test} onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  )
}
