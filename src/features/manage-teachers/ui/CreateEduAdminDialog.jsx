import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldPlus, RefreshCw } from 'lucide-react'
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
import { useTeacherStore } from '@/entities/teacher/model/store'
import { generateStudentPassword } from '@/shared/lib/credentials'

/** Director-only: creates a fresh EduSuperAdmin account directly (as opposed to the
 * teacher-list toggle, which promotes/demotes an existing teacher). */
export function CreateEduAdminDialog() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState(generateStudentPassword)
  const [submitting, setSubmitting] = useState(false)
  const createEduAdmin = useTeacherStore((s) => s.createEduAdmin)

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
      const result = await createEduAdmin(trimmedUsername, password, trimmedFullName)
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
        <Button variant="outline" className="gap-1.5">
          <ShieldPlus className="size-4" /> EduSuperAdmin qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yangi EduSuperAdmin</DialogTitle>
            <DialogDescription>
              EduSuperAdmin sizning markazingizda guruh, o'qituvchi va o'quvchi yarata oladi hamda statistikani ko'ra oladi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="eduadmin-fullname">To'liq ism</Label>
              <Input
                id="eduadmin-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Nodira Yusupova"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eduadmin-username">Username</Label>
              <Input
                id="eduadmin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masalan: nodira"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eduadmin-password">Parol</Label>
              <div className="flex gap-2">
                <Input id="eduadmin-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generateStudentPassword())}>
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Qo'shish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
