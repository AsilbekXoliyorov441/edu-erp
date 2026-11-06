import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
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
import { useGroupStore } from '@/entities/group/model/store'
import { DEFAULT_GROUP_FORM, validateGroupForm } from '@/entities/group/model/options'
import { GroupFormFields } from '@/entities/group/ui/GroupFormFields'

/** Old groups may miss schedule/time/direction — prefill those with the defaults. */
function formFromGroup(group) {
  return {
    name: group.name,
    schedule: group.schedule ?? DEFAULT_GROUP_FORM.schedule,
    startTime: group.startTime ?? DEFAULT_GROUP_FORM.startTime,
    endTime: group.endTime ?? DEFAULT_GROUP_FORM.endTime,
    direction: group.direction ?? 'other',
  }
}

export function EditGroupDialog({ group, trigger }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => formFromGroup(group))
  const [submitting, setSubmitting] = useState(false)
  const updateGroup = useGroupStore((s) => s.update)

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) setForm(formFromGroup(group))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const error = validateGroupForm(form)
    if (error) {
      toast.error(error)
      return
    }

    setSubmitting(true)
    try {
      await updateGroup(group.id, { ...form, name: form.name.trim() })
      toast.success("Guruh ma'lumotlari saqlandi")
      setOpen(false)
    } catch (err) {
      toast.error(err.data ?? "Saqlab bo'lmadi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Guruhni tahrirlash">
            <Pencil className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Guruhni tahrirlash</DialogTitle>
            <DialogDescription>Nom, yo'nalish, dars kunlari va vaqtini o'zgartirishingiz mumkin.</DialogDescription>
          </DialogHeader>
          <GroupFormFields form={form} onChange={setForm} idPrefix="edit-group" />
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
