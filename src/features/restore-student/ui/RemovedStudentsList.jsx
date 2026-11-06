import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Coins, RotateCcw, UserX } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useStudentStore } from '@/entities/student/model/store'
import { getStudentBalance } from '@/shared/lib/stats/balance'
import { STUDENT_STATUS } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'

/** Students removed from this group, with a one-click restore. Removing only flips the
 * status, so restoring brings back the same student with all coins and history. */
export function RemovedStudentsList({ students, transactions }) {
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const updateStatus = useStudentStore((s) => s.updateStatus)

  if (students.length === 0) return null

  const restore = async (student) => {
    setBusyId(student.id)
    try {
      await updateStatus(student.id, STUDENT_STATUS.ACTIVE)
      toast.success(`${student.fullName} guruhga qaytarildi — coinlari bilan`)
    } catch (err) {
      toast.error(err?.data ?? "Qaytarib bo'lmadi. Qaytadan urinib ko'ring.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <UserX className="size-4" /> Chiqarilgan o'quvchilar ({students.length})
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {students.map((student) => (
            <li key={student.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{student.fullName}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins className="size-3" /> {getStudentBalance(student.id, transactions)} coin saqlangan
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={busyId === student.id}
                onClick={() => restore(student)}
              >
                <RotateCcw className="size-3.5" /> Qaytarish
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
