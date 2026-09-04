import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, ArrowRightLeft, Coins, TriangleAlert, Users2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Label } from '@/shared/ui/label'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { getStudentBalance } from '@/shared/lib/stats'
import { findDuplicates } from '@/features/transfer-student/lib/matchDuplicates'

/** Sentinel answer for "these are two different people" — anything else in `answers` is the
 * id of the duplicate row to merge with. */
const SEPARATE = 'separate'

/** The dialog's actual contents. Split out from the wrapper below so its three store
 * subscriptions only ever run while the dialog is open — one of these sits on every roster
 * row, and a whole group's worth of idle subscriptions is not worth paying for. */
function TransferFlow({ students, onClose, onDone }) {
  const [step, setStep] = useState('group')
  const [targetGroupId, setTargetGroupId] = useState('')
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const groups = useGroupStore((s) => s.items)
  const allStudents = useStudentStore((s) => s.items)
  const transfer = useStudentStore((s) => s.transfer)
  const transactions = useTransactionStore((s) => s.items)

  const sourceGroupIds = useMemo(() => new Set(students.map((s) => s.groupId)), [students])
  // Moving someone into the group they're already in is a no-op, so drop it from the list —
  // but only when every selected student shares that group.
  const targetGroups = groups.filter((g) => !(sourceGroupIds.size === 1 && sourceGroupIds.has(g.id)))
  const targetGroup = groups.find((g) => g.id === targetGroupId) ?? null

  const conflicts = useMemo(
    () => (targetGroupId ? findDuplicates(students, targetGroupId, allStudents) : []),
    [students, targetGroupId, allStudents],
  )

  const merges = useMemo(
    () =>
      Object.entries(answers)
        .filter(([, duplicateId]) => duplicateId !== SEPARATE)
        .map(([studentId, duplicateId]) => ({ studentId, duplicateId })),
    [answers],
  )

  const balanceOf = (id) => getStudentBalance(id, transactions)

  const handleGroupNext = () => {
    if (!targetGroupId) return
    if (conflicts.length === 0) {
      setStep('confirm')
      return
    }
    // Default every duplicate to "two different people": the answer that changes nothing,
    // so an unread prompt can never silently merge two students' coins.
    setAnswers(Object.fromEntries(conflicts.map((c) => [c.student.id, SEPARATE])))
    setStep('duplicates')
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await transfer(
        targetGroupId,
        students.map((s) => s.id),
        merges,
      )
      toast.success(
        result.merged > 0
          ? `${result.moved} o'quvchi ${targetGroup?.name} guruhiga ko'chirildi, ${result.merged} tasi birlashtirildi`
          : `${result.moved} o'quvchi ${targetGroup?.name} guruhiga ko'chirildi`,
      )
      onClose()
      onDone?.()
    } catch (error) {
      toast.error(error?.data ?? "Ko'chirishda xatolik yuz berdi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {students.length === 1
            ? `${students[0].fullName} — guruhni o'zgartirish`
            : `${students.length} o'quvchini ko'chirish`}
        </DialogTitle>
        <DialogDescription>
          Coinlar, darslar tarixi va davomat o'quvchi bilan birga ko'chadi — hech narsa o'chmaydi.
        </DialogDescription>
      </DialogHeader>

      {step === 'group' && (
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="transfer-target-group">Qaysi guruhga?</Label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger id="transfer-target-group">
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {targetGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border/60 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users2 className="size-3.5" /> Ko'chiriladigan o'quvchilar
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{student.fullName}</span>
                  <Badge variant="coin">{balanceOf(student.id)} coin</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'duplicates' && (
        <div className="space-y-4 py-4">
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-coin-foreground dark:text-coin" />
            <span>
              {targetGroup?.name} guruhida bir xil ismli o'quvchi bor. Har biri uchun bu bitta odammi yoki ikkita
              alohida o'quvchimi — belgilang.
            </span>
          </p>

          {conflicts.map(({ student, matches }) => (
            <div key={student.id} className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                <Badge variant="coin">{balanceOf(student.id)} coin</Badge>
              </div>
              <div className="space-y-1.5">
                {matches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [student.id]: match.id }))}
                    className={
                      answers[student.id] === match.id
                        ? 'flex w-full items-center justify-between gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm'
                        : 'flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent'
                    }
                  >
                    <span className="text-foreground">
                      Ha, bu bitta o'quvchi
                      <span className="block text-xs text-muted-foreground">
                        {match.login} yozuvi bilan birlashtiriladi — coinlar qo'shiladi
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-coin-foreground dark:text-coin">
                      <Coins className="size-3.5" />
                      {balanceOf(student.id) + balanceOf(match.id)}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [student.id]: SEPARATE }))}
                  className={
                    answers[student.id] === SEPARATE
                      ? 'flex w-full items-center rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm'
                      : 'flex w-full items-center rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent'
                  }
                >
                  <span className="text-foreground">
                    Yo'q, boshqa o'quvchi
                    <span className="block text-xs text-muted-foreground">
                      Ikkalasi guruhda alohida qoladi, coinlari aralashmaydi
                    </span>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-3 py-4">
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Yo'nalish</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
              {students.length} o'quvchi <ArrowRight className="size-4 text-muted-foreground" /> {targetGroup?.name}
            </p>
          </div>

          {merges.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Birlashtiriladi — coinlar qo'shiladi</p>
              {merges.map(({ studentId, duplicateId }) => (
                <div key={studentId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">
                    {students.find((s) => s.id === studentId)?.fullName}
                  </span>
                  <Badge variant="coin">
                    {balanceOf(studentId)} + {balanceOf(duplicateId)} = {balanceOf(studentId) + balanceOf(duplicateId)}
                  </Badge>
                </div>
              ))}
              <p className="pt-1 text-xs text-muted-foreground">
                Ko'chirilayotgan o'quvchi o'z logini bilan qoladi, takroriy yozuv esa arxivga o'tadi — o'chirilmaydi.
              </p>
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        {step !== 'group' && (
          <Button
            variant="outline"
            onClick={() => setStep(step === 'confirm' && conflicts.length > 0 ? 'duplicates' : 'group')}
            disabled={submitting}
          >
            Orqaga
          </Button>
        )}
        {step === 'group' && (
          <Button onClick={handleGroupNext} disabled={!targetGroupId}>
            Davom etish
          </Button>
        )}
        {step === 'duplicates' && <Button onClick={() => setStep('confirm')}>Davom etish</Button>}
        {step === 'confirm' && (
          <Button onClick={handleConfirm} disabled={submitting}>
            Tasdiqlash va ko'chirish
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}

/** Moves one or more students to another group, carrying their coins with them.
 *
 * Three steps: pick the target group, answer one question per duplicate name already in that
 * group ("bitta o'quvchimi?"), then confirm a plain-language summary of what will change.
 * Nothing is written until that last confirmation. */
export function TransferStudentsDialog({ students, trigger, onDone }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="Guruhni o'zgartirish"
          >
            <ArrowRightLeft className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      {/* Remounted on every open, so the wizard always starts clean at step one. */}
      {open && <TransferFlow students={students} onClose={() => setOpen(false)} onDone={onDone} />}
    </Dialog>
  )
}
