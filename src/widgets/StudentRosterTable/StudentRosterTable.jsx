import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRightLeft, Eye, KeyRound, Users } from 'lucide-react'
import { StudentAvatar } from '@/entities/student/ui/StudentAvatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { RemoveStudentDialog } from '@/features/remove-student/ui/RemoveStudentDialog'
import { TransferStudentsDialog } from '@/features/transfer-student/ui/TransferStudentsDialog'
import { GoalProgressInline } from '@/shared/ui/goal-progress'
import { useCurrentMonthGoal } from '@/entities/monthly-goal/model/store'
import { getStudentBalance } from '@/shared/lib/stats'
import { formatUzDate } from '@/shared/lib/date'
import { ROUTES } from '@/shared/config/constants'

const checkboxClass =
  'size-4 shrink-0 cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed'

export function StudentRosterTable({ students, transactions }) {
  const [selectedIds, setSelectedIds] = useState([])
  const monthlyGoal = useCurrentMonthGoal()

  if (students.length === 0) {
    return <EmptyState icon={Users} title="O'quvchilar yo'q" description="Guruhga birinchi o'quvchini qo'shing." />
  }

  // Students can leave the roster while a selection is open (a transfer, a removal), so the
  // ids are resolved against the current list rather than trusted as-is.
  const selectedStudents = students.filter((s) => selectedIds.includes(s.id))
  const allSelected = selectedStudents.length === students.length

  const toggleOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleAll = () => setSelectedIds(allSelected ? [] : students.map((s) => s.id))

  return (
    <div className="space-y-3">
      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">{selectedStudents.length} o'quvchi tanlandi</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Bekor qilish
            </Button>
            <TransferStudentsDialog
              students={selectedStudents}
              onDone={() => setSelectedIds([])}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <ArrowRightLeft className="size-4" /> Boshqa guruhga ko'chirish
                </Button>
              }
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="w-8 py-2.5">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Barchasini tanlash"
                />
              </th>
              <th className="py-2.5 font-medium">O'quvchi</th>
              <th className="py-2.5 font-medium">Qo'shilgan sana</th>
              <th className="py-2.5 font-medium">Login</th>
              {monthlyGoal.active && <th className="py-2.5 pl-4 font-medium">Oylik maqsad</th>}
              <th className="py-2.5 text-right font-medium">Coinlar</th>
              <th className="py-2.5" />
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-border/40 last:border-0"
              >
                <td className="py-3">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleOne(student.id)}
                    aria-label={`${student.fullName} — tanlash`}
                  />
                </td>
                <td className="py-3">
                  <Link to={ROUTES.studentProfile(student.id)} className="flex items-center gap-2.5 hover:underline">
                    <StudentAvatar student={student} size="sm" />
                    <span className="font-medium text-foreground">{student.fullName}</span>
                  </Link>
                </td>
                <td className="py-3 text-muted-foreground">{formatUzDate(student.joinedAt)}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    <KeyRound className="size-3" />
                    {student.login}
                  </span>
                </td>
                {monthlyGoal.active && (
                  <td className="py-3 pl-4">
                    <GoalProgressInline progress={monthlyGoal.progress.get(student.id)} className="w-36" />
                  </td>
                )}
                <td className="py-3 text-right">
                  <Badge variant="coin">{getStudentBalance(student.id, transactions)} coin</Badge>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                      <Link to={ROUTES.studentProfile(student.id)} aria-label="Profilni ko'rish">
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <TransferStudentsDialog students={[student]} />
                    <RemoveStudentDialog student={student} />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
