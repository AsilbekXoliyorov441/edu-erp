import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, BookOpenCheck, Bot, ChevronDown, Code2, Coins, FileText, Image, Loader2, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { EmptyState } from '@/shared/ui/empty-state'
import { useGroupHomeworks, useHomeworkActions, useHomeworkSubmissions } from '@/entities/homework/model/store'
import { HOMEWORK, homeworkLanguageFor } from '@/shared/config/constants'
import { formatUzDayTime } from '@/shared/lib/date'
import { parseExercises } from '@/shared/lib/homework/parseExercises'
import { cn } from '@/shared/lib/utils'

/** `datetime-local` value for two days from now at 20:00 — a sensible default deadline. */
function defaultDue() {
  const d = new Date(Date.now() + 2 * 86400000)
  d.setHours(20, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Teacher: sets homework for the group's latest lesson. */
function AssignHomeworkDialog({ group, lessonNumber, disabled }) {
  const { create } = useHomeworkActions()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [task, setTask] = useState('')
  const [criteria, setCriteria] = useState('')
  const [mode, setMode] = useState('code')
  const [language, setLanguage] = useState(() => homeworkLanguageFor(group.direction))
  // all exercises pasted in one go (e.g. straight from an AI chat), split by their numbers
  const [bulk, setBulk] = useState('')
  const parsed = useMemo(() => parseExercises(bulk), [bulk])
  const [maxCoins, setMaxCoins] = useState(HOMEWORK.MAX_COINS)
  const [due, setDue] = useState(defaultDue)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      await create({
        groupId: group.id,
        title,
        task,
        criteria,
        mode,
        ...(mode === 'code' ? { language, exercises: parsed.exercises } : {}),
        ...(mode === 'code' ? { task: [task.trim(), parsed.intro].filter(Boolean).join('\n\n') } : {}),
        maxCoins,
        dueAt: new Date(due).getTime(),
      })
      toast.success("Uy vazifasi berildi — o'quvchilarga bildirishnoma yuborildi")
      setOpen(false)
      setTitle('')
      setTask('')
      setCriteria('')
      setBulk('')
      setDue(defaultDue())
    } catch (err) {
      toast.error(err?.data ?? "Saqlab bo'lmadi")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="size-4" /> Uy vazifasi berish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Uy vazifasi — {lessonNumber}-dars</DialogTitle>
          <DialogDescription>O'quvchilar o'z akkauntidan topshiradi, AI tekshiradi va coin darhol tushadi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hw-title">Nomi</Label>
            <Input id="hw-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Sikllar — 5 ta masala" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'code', icon: Code2, label: 'Kod muharriri', hint: 'masalalar, kod yoziladi' },
              { id: 'files', icon: Image, label: 'Rasm yoki PDF', hint: 'daftar rasmi, hujjat' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left',
                  mode === m.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
                )}
              >
                <m.icon className={cn('size-5 shrink-0', mode === m.id ? 'text-primary' : 'text-muted-foreground')} />
                <span>
                  <span className="block text-sm font-bold text-foreground">{m.label}</span>
                  <span className="block text-xs text-muted-foreground">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
          {mode === 'code' ? (
            <>
              <div className="space-y-1.5">
                <Label>Dasturlash tili</Label>
                <div className="flex flex-wrap gap-1">
                  {HOMEWORK.LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={cn(
                        'h-9 cursor-pointer rounded-lg border px-3 text-sm font-semibold',
                        language === l.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hw-bulk">Masalalar — hammasini bitta joyga tashlang</Label>
                <Textarea
                  id="hw-bulk"
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                  className="min-h-[180px] font-mono text-[13px]"
                  placeholder={"Savollarni javoblari bilan qo'ying, masalan:\n\n1. 1 dan 100 gacha sonlar yig'indisini toping\nJavob: console.log(5050)\n\n2. 5 ning karra jadvalini chiqaring\nJavob: for (let i = 1; i <= 10; i++) console.log(5 * i)"}
                />
                <p className="text-xs text-muted-foreground">
                  Raqamlar bo'yicha ajratiladi: «1.», «2)», «3-masala», «Masala 4:». Javob har savol tagida «Javob:» / «Yechim:» bilan yoki oxirida «Javoblar:» bo'limida
                  bo'lishi mumkin — o'quvchi uni faqat ishlab yuborgandan keyin ko'radi. Javobi yo'q masalaga AI o'zi namunaviy yechim yozadi.
                </p>
              </div>
              {parsed.exercises.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/40 p-3">
                  {parsed.exercises.length > HOMEWORK.MAX_EXERCISES && (
                    <p className="text-xs font-bold text-destructive">Ko'pi bilan {HOMEWORK.MAX_EXERCISES} ta masala bo'lishi mumkin</p>
                  )}
                  <p className="text-xs font-bold text-foreground">
                    {parsed.exercises.length} ta masala aniqlandi
                    {parsed.exercises.some((e) => e.solution) ? ` · ${parsed.exercises.filter((e) => e.solution).length} tasida javob bor` : ''} · har biri ≈ {(maxCoins / parsed.exercises.length).toFixed(1).replace('.0', '')} coin
                  </p>
                  {parsed.intro && <p className="text-xs whitespace-pre-line text-muted-foreground">Umumiy izoh: {parsed.intro}</p>}
                  <ol className="max-h-60 list-decimal space-y-1.5 overflow-y-auto pl-5 text-xs text-foreground/90">
                    {parsed.exercises.map((e, i) => (
                      <li key={i} className="whitespace-pre-line">
                        {e.text.length > 220 ? `${e.text.slice(0, 220)}…` : e.text}
                        {e.solution ? (
                          <span className="mt-1 block rounded-md bg-success/10 px-2 py-1 font-mono text-[11px] text-success">
                            Javob: {e.solution.length > 160 ? `${e.solution.slice(0, 160)}…` : e.solution}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">javob yo'q — AI namunaviy yechim yozadi</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="hw-task">Vazifa (o'quvchilar ko'radi)</Label>
              <Textarea id="hw-task" value={task} maxLength={HOMEWORK.MAX_TASK} onChange={(e) => setTask(e.target.value)} className="min-h-[110px]" placeholder="Nima qilish kerakligini aniq yozing" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="hw-criteria">To'g'ri javoblar / baholash mezoni (ixtiyoriy, faqat AI ko'radi)</Label>
            <Textarea id="hw-criteria" value={criteria} maxLength={HOMEWORK.MAX_TASK} onChange={(e) => setCriteria(e.target.value)} placeholder="Masalan: 1) 120  2) for i in range(10)…  Kod ishlashi shart." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Maksimal coin</Label>
              <div className="flex gap-1">
                {Array.from({ length: HOMEWORK.MAX_COINS }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxCoins(n)}
                    className={cn('h-10 flex-1 cursor-pointer rounded-lg border text-sm font-bold', maxCoins === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent')}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hw-due">Topshirish muddati</Label>
              <Input id="hw-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy || !title.trim() || (mode === 'code' ? parsed.exercises.length === 0 || parsed.exercises.length > HOMEWORK.MAX_EXERCISES : !task.trim())}>
            {busy && <Loader2 className="size-4 animate-spin" />} Berish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const SUSPICION = {
  high: { label: 'AI shubha: yuqori', variant: 'destructive' },
  medium: { label: "AI shubha: o'rta", variant: 'warning' },
}

/** Each exercise with the student's code, how it was entered, and the AI's verdict on it. */
function CodeAnswers({ sub, homework }) {
  return (
    <div className="space-y-2">
      {homework.exercises.map((text, i) => {
        const a = sub.answers[i]
        const res = sub.exerciseResults[i]
        const pastedShare = a && a.typed + a.pasted > 0 ? a.pasted / (a.typed + a.pasted) : 0
        return (
          <div key={i} className="space-y-1.5 rounded-lg border border-border/60 p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-foreground">
                {i + 1}. {text}
              </p>
              {res && <Badge variant={res.score >= 8 ? 'success' : res.score >= 5 ? 'warning' : 'destructive'}>{res.score}/10</Badge>}
            </div>
            {a ? (
              <>
                <pre className="max-h-64 overflow-auto rounded-lg bg-[#282c34] p-3 font-mono text-xs leading-relaxed text-[#abb2bf]">{a.code || '—'}</pre>
                <p className={cn('text-[11px]', pastedShare > 0.5 ? 'font-semibold text-warning' : 'text-muted-foreground')}>
                  Yozdi: {a.typed} belgi · Qo'ydi (paste): {a.pasted} belgi · {Math.max(1, Math.round(a.activeMs / 60000))} daqiqa
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Javob yo'q</p>
            )}
            {res?.feedback && (
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" /> {res.feedback}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** One student's hand-in: the AI's verdict, the files, and a way to change the coins. */
function SubmissionRow({ sub, student, homework }) {
  const { setCoins, recheck } = useHomeworkActions()
  const [busy, setBusy] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const suspicion = SUSPICION[sub.aiSuspicion]
  const isCode = homework.mode === 'code'
  const draft = sub.status === 'draft'

  const run = async (fn, ok) => {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{student?.fullName ?? "O'quvchi"}</span>
          {draft && (
            <Badge variant="secondary">
              ishlamoqda · {sub.answers.filter((a) => a.done).length}/{homework.exercises.length}
            </Badge>
          )}
          {sub.status === 'checking' && (
            <Badge variant="secondary">
              <Loader2 className="size-3 animate-spin" /> tekshirilmoqda
            </Badge>
          )}
          {sub.status === 'failed' && (
            <Badge variant="destructive">
              <XCircle className="size-3" /> xato
            </Badge>
          )}
          {sub.status === 'checked' && <Badge variant="success">{sub.score}/10</Badge>}
          {suspicion && <Badge variant={suspicion.variant}>{suspicion.label}</Badge>}
          {sub.penalized && <Badge variant="warning">coin kamaytirildi</Badge>}
          {sub.teacherEdited && <Badge variant="outline">siz tuzatdingiz</Badge>}
        </div>
        {sub.status !== 'checking' && !draft && (
          <div className="flex items-center gap-1">
            {Array.from({ length: homework.maxCoins + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                disabled={busy}
                title={`${n} coin qo'yish`}
                onClick={() => run(() => setCoins(sub.id, n), `${n} coin qo'yildi`)}
                className={cn(
                  'size-8 cursor-pointer rounded-lg text-xs font-bold disabled:opacity-50',
                  sub.status === 'checked' && sub.coins === n ? 'bg-amber-400 text-amber-950' : 'bg-muted hover:bg-accent',
                )}
              >
                {n}
              </button>
            ))}
            <Button size="icon" variant="ghost" disabled={busy} title="AI qayta tekshirsin" onClick={() => run(() => recheck(sub.id), 'Qayta tekshirilmoqda')}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        )}
      </div>
      {sub.error && sub.status === 'failed' && <p className="text-xs text-destructive">{sub.error}</p>}
      {sub.aiReason && <p className="flex items-start gap-1.5 text-xs text-warning"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {sub.aiReason}</p>}
      {sub.feedback && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" /> {sub.feedback}
        </p>
      )}
      {isCode && sub.answers.length > 0 && (
        <>
          <button type="button" onClick={() => setShowCode((v) => !v)} className="cursor-pointer text-xs font-semibold text-primary hover:underline">
            {showCode ? 'Kodni yashirish' : "Kodni ko'rish"}
          </button>
          {showCode && <CodeAnswers sub={sub} homework={homework} />}
        </>
      )}
      {(sub.text || sub.files.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {sub.text && <span className="max-w-full truncate rounded-lg bg-muted px-2 py-1 text-xs">“{sub.text.slice(0, 120)}{sub.text.length > 120 ? '…' : ''}”</span>}
          {sub.files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:underline">
              <FileText className="size-3.5" /> {f.contentType === 'application/pdf' ? 'PDF' : 'Rasm'} {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function HomeworkItem({ homework, students }) {
  const [open, setOpen] = useState(false)
  const subs = useHomeworkSubmissions(open ? homework.id : null)
  const { remove } = useHomeworkActions()
  const byId = new Map(students.map((s) => [s.id, s]))
  const handedIn = new Set((subs ?? []).map((s) => s.studentId))
  const missing = students.filter((s) => !handedIn.has(s.id))

  const del = async () => {
    try {
      await remove(homework.id)
      toast.success("O'chirildi")
    } catch (err) {
      toast.error(err?.data ?? "O'chirib bo'lmadi")
    }
  }

  return (
    <div className="rounded-xl border border-border/60">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/50">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {homework.lessonNumber ? `${homework.lessonNumber}-dars · ` : ''}
            {homework.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {homework.mode === 'code' ? `${homework.exercises.length} ta masala · ` : ''}Muddat: {formatUzDayTime(homework.dueAt)} · {homework.submitted}/{students.length} topshirdi
            {homework.working > 0 ? ` · ${homework.working} ishlamoqda` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {homework.checking > 0 && <Badge variant="secondary">{homework.checking} tekshirilmoqda</Badge>}
          {homework.failed > 0 && <Badge variant="destructive">{homework.failed} xato</Badge>}
          {homework.flagged > 0 && <Badge variant="warning">{homework.flagged} AI shubha</Badge>}
          <Badge variant="coin">
            <Coins className="size-3" /> {homework.maxCoins}
          </Badge>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border/60">
          <div className="space-y-2 px-4 py-3 text-sm">
            {homework.task && <p className="whitespace-pre-line text-foreground/90">{homework.task}</p>}
            {homework.mode === 'code' && (
              <ol className="list-decimal space-y-1 pl-5 text-foreground/90">
                {homework.exercises.map((e, i) => (
                  <li key={i} className="whitespace-pre-line">
                    {e}
                    {homework.solutions?.[i] && (
                      <span className="mt-1 block rounded-md bg-success/10 px-2 py-1 font-mono text-xs whitespace-pre-wrap text-success">Javob: {homework.solutions[i]}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {homework.criteria && <p className="text-xs whitespace-pre-line text-muted-foreground"><b>Mezon (faqat AI ko'radi):</b> {homework.criteria}</p>}
          </div>
          {subs === undefined ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Yuklanmoqda…</p>
          ) : (
            <div className="divide-y divide-border/50 border-t border-border/60">
              {subs.map((s) => (
                <SubmissionRow key={s.id} sub={s} student={byId.get(s.studentId)} homework={homework} />
              ))}
              {missing.length > 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  <b>Topshirmaganlar:</b> {missing.map((s) => s.fullName).join(', ')}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end border-t border-border/60 px-4 py-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="size-4" /> O'chirish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Uy vazifasini o'chirish</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong className="text-foreground">{homework.title}</strong> o'chiriladi. O'quvchilarning topshiriqlari va ulardan tushgan coinlar ham o'chadi. Bu amalni ortga
                    qaytarib bo'lmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction onClick={del}>Ha, o'chirish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}

/** Teacher: the group's homework — set new homework and review what the AI decided. */
export function HomeworkPanel({ group, students, latestLessonNumber }) {
  const list = useGroupHomeworks(group.id)
  const takenLatest = (list ?? []).some((h) => h.lessonNumber === latestLessonNumber)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Vazifa oxirgi o'tilgan darsga beriladi. O'quvchilar o'z akkauntidan topshiradi, AI tekshiradi, izoh yozadi va "Uy vazifasi" coinini o'zi qo'yadi. AI yordamida yozilgan ish
          aniqlansa, coin yarmiga tushadi va o'quvchi ogohlantiriladi. Istalgan bahoni o'zingiz tuzatishingiz mumkin.
        </p>
        <AssignHomeworkDialog group={group} lessonNumber={latestLessonNumber} disabled={!latestLessonNumber || takenLatest} />
      </div>
      {!latestLessonNumber && <p className="text-sm text-warning">Avval birinchi darsni o'tkazib saqlang — uy vazifasi shu darsga beriladi.</p>}
      {takenLatest && <p className="text-sm text-muted-foreground">{latestLessonNumber}-darsga vazifa berilgan. Keyingisini yangi darsdan keyin bering.</p>}
      {list === undefined ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>
      ) : list.length === 0 ? (
        <EmptyState icon={BookOpenCheck} title="Hali uy vazifasi berilmagan" description="Birinchi vazifani bering — shundan keyin bu guruhda uy vazifasi coinini AI qo'yadi." />
      ) : (
        <div className="space-y-2">
          {list.map((h) => (
            <HomeworkItem key={h.id} homework={h} students={students} />
          ))}
        </div>
      )}
    </div>
  )
}
