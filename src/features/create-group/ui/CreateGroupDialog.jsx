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
import { useGroupStore } from '@/entities/group/model/store'
import { DEFAULT_GROUP_FORM, validateGroupForm } from '@/entities/group/model/options'
import { GroupFormFields } from '@/entities/group/ui/GroupFormFields'

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(DEFAULT_GROUP_FORM)
  const [submitting, setSubmitting] = useState(false)
  const createGroup = useGroupStore((s) => s.create)

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) setForm(DEFAULT_GROUP_FORM)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const error = validateGroupForm(form)
    if (error) {
      toast.error(error)
      return
    }

    const name = form.name.trim()
    setSubmitting(true)
    try {
      await createGroup({ ...form, name })
      toast.success(`"${name}" guruhi yaratildi`)
      setOpen(false)
    } catch (err) {
      toast.error(err.data ?? "Guruhni yaratib bo'lmadi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="size-4" /> Guruh yaratish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yangi guruh yaratish</DialogTitle>
            <DialogDescription>Guruh nomi, yo'nalishi, dars kunlari va vaqtini belgilang.</DialogDescription>
          </DialogHeader>
          <GroupFormFields form={form} onChange={setForm} idPrefix="create-group" />
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Yaratish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
