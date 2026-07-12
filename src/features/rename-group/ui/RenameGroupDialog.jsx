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
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useGroupStore } from '@/entities/group/model/store'

export function RenameGroupDialog({ group, trigger }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(group.name)
  const [submitting, setSubmitting] = useState(false)
  const renameGroup = useGroupStore((s) => s.update)

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) setName(group.name)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === group.name) {
      setOpen(false)
      return
    }

    setSubmitting(true)
    try {
      await renameGroup(group.id, trimmed)
      toast.success("Guruh nomi o'zgartirildi")
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Guruh nomini tahrirlash">
            <Pencil className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Guruh nomini tahrirlash</DialogTitle>
            <DialogDescription>Yangi nomni kiriting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-4">
            <Label htmlFor="rename-group-name">Guruh nomi</Label>
            <Input id="rename-group-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
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
