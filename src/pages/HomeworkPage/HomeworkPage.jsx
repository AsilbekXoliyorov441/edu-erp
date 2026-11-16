import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { BookOpenCheck, Check, CircleDot, FileText, ImagePlus, Loader2, Send, X } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { useHomeworkActions, useMyHomeworks } from '@/entities/homework/model/store'
import { shrinkImage } from '@/shared/lib/image'
import { HOMEWORK } from '@/shared/config/constants'
import { formatDayKey } from '@/shared/lib/date'
import { getDayKey } from '@/shared/lib/stats/monthlyGoal'
import { HomeworkHeader, Verdict } from '@/pages/HomeworkPage/parts'
import { useNow } from '@/pages/HomeworkPage/time'
import { CodeHomework } from '@/pages/HomeworkPage/CodeHomework'
import { cn } from '@/shared/lib/utils'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf'

/** The answer form: a text answer and/or up to `MAX_FILES` photos or PDFs. */
function HandInForm({ homework, onDone }) {
  const { handIn } = useHomeworkActions()
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const input = useRef(null)

  const addFiles = async (list) => {
    const picked = [...list].slice(0, HOMEWORK.MAX_FILES - files.length)
    const ready = []
    for (const f of picked) {
      if (!ACCEPT.split(',').includes(f.type)) {
        toast.error(`${f.name}: faqat rasm yoki PDF`)
        continue
      }
      const small = await shrinkImage(f)
      if (small.size > HOMEWORK.MAX_FILE_BYTES) {
        toast.error(`${f.name}: 10 MB dan katta`)
        continue
      }
      ready.push(small)
    }
    setFiles((prev) => [...prev, ...ready].slice(0, HOMEWORK.MAX_FILES))
  }

  const send = async () => {
    if (!text.trim() && files.length === 0) {
      toast.error('Javob yozing yoki daftaringiz rasmini yuklang')
      return
    }
    setBusy(true)
    try {
      const res = await handIn(homework.id, text, files)
      if (!res?.ok) {
        toast.error(res?.error ?? "Topshirib bo'lmadi")
        return
      }
      toast.success('Topshirildi! AI tekshirmoqda…')
      onDone?.()
    } catch (err) {
      toast.error(err?.data ?? "Yuklab bo'lmadi. Internetni tekshirib qayta urinib ko'ring.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Javobingizni shu yerga yozing (yoki daftar rasmini yuklang)"
        maxLength={HOMEWORK.MAX_TEXT}
        className="min-h-[110px]"
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={`${f.name}:${i}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium">
              {f.type === 'application/pdf' ? <FileText className="size-3.5" /> : <ImagePlus className="size-3.5" />}
              <span className="max-w-[160px] truncate">{f.name}</span>
              <button type="button" aria-label="Olib tashlash" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Button type="button" variant="outline" disabled={busy || files.length >= HOMEWORK.MAX_FILES} onClick={() => input.current?.click()}>
          <ImagePlus className="size-4" /> Rasm / PDF ({files.length}/{HOMEWORK.MAX_FILES})
        </Button>
        <Button type="button" onClick={send} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Topshirish
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Vazifani o'zingiz bajaring: AI yordamida yozilgan ish aniqlansa, coin kamaytiriladi va ustozga ko'rinadi.
      </p>
    </div>
  )
}

/** Photo / PDF / text homework: one answer for the whole task. */
function FilesHomework({ homework, now }) {
  const sub = homework.submission
  const open = homework.dueAt > now
  const canHandIn = open && (!sub || sub.status === 'failed')
  return (
    <Card className={cn(canHandIn && 'border-primary/40')}>
      <CardContent className="space-y-4 p-5">
        <HomeworkHeader homework={homework} now={now} />
        {sub && <Verdict sub={sub} maxCoins={homework.maxCoins} />}
        {canHandIn && <HandInForm homework={homework} />}
        {!open && !sub && <p className="text-sm font-medium text-destructive">Muddat tugagan — topshirilmadi.</p>}
      </CardContent>
    </Card>
  )
}

/** Where a lesson's homework stands for this student. */
function homeworkState(lesson, now) {
  const h = lesson.homework
  if (!h) return 'none'
  const st = h.submission?.status
  if (st === 'checked' || st === 'checking') return 'done'
  if (h.dueAt <= now) return 'missed'
  return 'open'
}

const STATE_STYLE = {
  open: 'border-primary bg-primary/10 text-primary',
  done: 'border-success/50 bg-success/10 text-success',
  missed: 'border-destructive/40 bg-destructive/5 text-destructive',
  none: 'border-border bg-card text-muted-foreground',
}

/** The lessons as a scrollable row of chips: which ones have homework, and its state. */
function LessonPicker({ lessons, selectedId, onSelect, now }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2">
        {lessons.map((l) => {
          const state = homeworkState(l, now)
          const selected = l.id === selectedId
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelect(l.id)}
              className={cn(
                'flex h-14 min-w-[84px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
                STATE_STYLE[state],
                selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
              )}
            >
              <span className="flex items-center gap-1 text-sm font-black">
                {state === 'done' && <Check className="size-3.5" />}
                {state === 'open' && <CircleDot className="size-3.5" />}
                {l.number}-dars
              </span>
              <span className="font-medium opacity-80">{state === 'none' ? "vazifa yo'q" : state === 'open' ? 'vazifa bor' : state === 'done' ? 'yuborilgan' : "o'tib ketgan"}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Student: pick a lesson; if it has homework, do it here — code exercises in the built-in
 * editor, or a photo / PDF answer — and get the AI's score, coins and feedback right away. */
export function HomeworkPage() {
  const lessons = useMyHomeworks()
  const now = useNow()
  const [pickedId, setPickedId] = useState(null)

  if (lessons === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // by default: the oldest homework still to do, else the latest lesson with homework
  const firstOpen = [...lessons].reverse().find((l) => homeworkState(l, now) === 'open')
  const fallback = firstOpen ?? lessons.find((l) => l.homework) ?? lessons[0]
  const selected = lessons.find((l) => l.id === pickedId) ?? fallback
  const homework = selected?.homework

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Uy vazifalari</h2>
        <p className="text-sm text-muted-foreground">Darsni tanlang — vazifa bo'lsa, masalalarni shu yerda ishlang. AI darhol tekshiradi va coin tushadi.</p>
      </div>
      {lessons.length === 0 ? (
        <EmptyState icon={BookOpenCheck} title="Hali dars o'tilmagan" description="Darslar va ularning uy vazifalari shu yerda paydo bo'ladi." />
      ) : (
        <>
          <LessonPicker lessons={lessons} selectedId={selected?.id} onSelect={setPickedId} now={now} />
          {!homework ? (
            <EmptyState
              icon={BookOpenCheck}
              title={`${selected.number}-darsga uy vazifasi berilmagan`}
              description={`${formatDayKey(getDayKey(selected.date))}. Ustoz vazifa berganda bildirishnoma keladi.`}
            />
          ) : homework.mode === 'code' ? (
            <CodeHomework key={homework.id} homework={homework} now={now} />
          ) : (
            <FilesHomework key={homework.id} homework={homework} now={now} />
          )}
        </>
      )}
    </div>
  )
}
