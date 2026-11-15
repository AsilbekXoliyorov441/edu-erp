import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useStudentPasswordActions } from '@/entities/student/model/store'
import { formatUzDate } from '@/shared/lib/date'

/** Center admin (director / edu_admin) only: shows the student's login and current password. */
export function RevealPasswordButton({ student }) {
  const [revealed, setRevealed] = useState(null)
  const [loading, setLoading] = useState(false)
  const { revealPassword } = useStudentPasswordActions()

  const handleClick = async () => {
    if (revealed) return setRevealed(null)
    setLoading(true)
    try {
      setRevealed(await revealPassword(student.id))
    } catch (err) {
      toast.error(err.data ?? "Parolni ko'rib bo'lmadi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5 sm:items-end">
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleClick} disabled={loading}>
        {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {revealed ? 'Yashirish' : "Parolni ko'rish"}
      </Button>
      {revealed && (
        <div className="rounded-lg bg-muted px-3 py-2 text-left text-xs">
          <p>
            <span className="text-muted-foreground">Login: </span>
            <span className="font-mono font-semibold text-foreground">{student.login}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Parol: </span>
            <span className="font-mono font-semibold text-foreground">{revealed.password ?? "noma'lum"}</span>
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {revealed.initial
              ? "Boshlang'ich parol — o'quvchi hali almashtirmagan"
              : revealed.changedAt
                ? `O'quvchi ${formatUzDate(revealed.changedAt, { withTime: true })} da almashtirgan`
                : "Eski tizimda o'rnatilgan"}
          </p>
        </div>
      )}
    </div>
  )
}
