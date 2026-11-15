import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useStudentPasswordActions } from '@/entities/student/model/store'

/** Student changes their own password. Other devices signed in to the account are signed out. */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { changeMyPassword } = useStudentPasswordActions()

  const handleOpenChange = (value) => {
    setOpen(value)
    if (value) {
      setCurrent('')
      setNext('')
      setRepeat('')
      setShow(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (next.length < 6) return toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin")
    if (next !== repeat) return toast.error('Yangi parollar mos kelmadi')
    setSubmitting(true)
    try {
      const { signedOut } = await changeMyPassword(current, next)
      toast.success(
        signedOut > 0
          ? `Parol almashtirildi. Boshqa ${signedOut} ta qurilmadan chiqarib yuborildi`
          : 'Parol almashtirildi',
      )
      setOpen(false)
    } catch (err) {
      toast.error(err.data ?? "Parolni almashtirib bo'lmadi")
    } finally {
      setSubmitting(false)
    }
  }

  const type = show ? 'text' : 'password'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <LockKeyhole className="size-4" /> Parolni almashtirish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Parolni almashtirish</DialogTitle>
            <DialogDescription>
              Parolingizni hech kimga aytmang. Almashtirgandan keyin boshqa telefon yoki kompyuterlardan hisobingizga
              kirib turganlar avtomatik chiqarib yuboriladi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Joriy parol</Label>
            <Input id="pw-current" type={type} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-new">Yangi parol</Label>
            <Input id="pw-new" type={type} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Kamida 6 ta belgi, login bilan bir xil bo'lmasin.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-repeat">Yangi parolni takrorlang</Label>
            <Input id="pw-repeat" type={type} autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
          </div>

          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {show ? 'Parollarni yashirish' : "Parollarni ko'rsatish"}
          </button>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
