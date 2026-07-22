import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, RefreshCw } from 'lucide-react'
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
import { generateStudentPassword } from '@/shared/lib/credentials'

export function CreateDirectorDialog({ centerId, centerName }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState(generateStudentPassword)
  const [submitting, setSubmitting] = useState(false)
  const createDirector = useCenterStore((s) => s.createDirector)

  const resetForm = () => {
    setUsername('')
    setFullName('')
    setPassword(generateStudentPassword())
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedUsername = username.trim()
    const trimmedFullName = fullName.trim()
    if (!trimmedUsername || !trimmedFullName || !password) return

    setSubmitting(true)
    try {
      const result = await createDirector(centerId, trimmedUsername, password, trimmedFullName)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`${trimmedFullName} qo'shildi — login: ${result.username}, parol: ${result.password}`)
      resetForm()
      setOpen(false)
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
        <Button size="sm" variant="outline" className="gap-1.5">
          <UserPlus className="size-3.5" /> Direktor tayinlash
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{centerName} uchun direktor</DialogTitle>
            <DialogDescription>
              Direktor markazni to'liq boshqaradi: guruh/o'qituvchi/o'quvchi yaratadi va EduSuperAdmin tayinlaydi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="director-fullname">To'liq ism</Label>
              <Input
                id="director-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Sardor Aliyev"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="director-username">Username</Label>
              <Input
                id="director-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masalan: sardor"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="director-password">Parol</Label>
              <div className="flex gap-2">
                <Input id="director-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generateStudentPassword())}>
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Tayinlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
