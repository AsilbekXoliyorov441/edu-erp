import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Bot, Check, CheckCircle2, Loader2, Pencil, Send } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { CodeEditor } from '@/shared/ui/code-editor'
import { useHomeworkActions } from '@/entities/homework/model/store'
import { cn } from '@/shared/lib/utils'
import { HomeworkHeader, Verdict } from '@/pages/HomeworkPage/parts'

const NO_STATS = { typed: 0, pasted: 0, activeMs: 0 }

/** Unsaved typing is kept in the browser, so a reload or a lost connection loses nothing. */
function draftKey(homeworkId, index) {
  return `homework-draft:${homeworkId}:${index}`
}

function readDraft(homeworkId, index) {
  try {
    return JSON.parse(localStorage.getItem(draftKey(homeworkId, index)) ?? 'null')
  } catch {
    return null
  }
}

function writeDraft(homeworkId, index, draft) {
  try {
    localStorage.setItem(draftKey(homeworkId, index), JSON.stringify(draft))
  } catch {
    /* storage full or blocked — the server copy is saved on "Done" anyway */
  }
}

function scoreTone(score) {
  if (score >= 8) return 'success'
  if (score >= 5) return 'warning'
  return 'destructive'
}

/** One exercise: its text, the editor, and "Done" / "Tahrirlash". After the check, the AI's
 * score and feedback for this exercise appear under it. */
function Exercise({ homework, index, text, answer, result, locked }) {
  const { saveAnswer } = useHomeworkActions()
  const [busy, setBusy] = useState(false)
  // where the editor starts: the saved answer, or this browser's unsaved draft
  const [start] = useState(() => {
    const draft = readDraft(homework.id, index)
    if (answer && (answer.done || !draft)) return { code: answer.code, stats: { typed: answer.typed, pasted: answer.pasted, activeMs: answer.activeMs } }
    if (draft) return { code: draft.code ?? '', stats: draft.stats ?? NO_STATS }
    return { code: '', stats: NO_STATS }
  })
  const code = useRef(start.code)
  const session = useRef(NO_STATS)
  const done = !!answer?.done

  const totals = () => ({
    typed: start.stats.typed + session.current.typed,
    pasted: start.stats.pasted + session.current.pasted,
    activeMs: start.stats.activeMs + session.current.activeMs,
  })

  const save = async (markDone) => {
    if (markDone && !code.current.trim()) {
      toast.error('Avval kodni yozing')
      return
    }
    setBusy(true)
    try {
      await saveAnswer(homework.id, index, code.current, markDone, totals())
      if (markDone) toast.success(`${index + 1}-masala saqlandi`)
    } catch (err) {
      toast.error(err?.data ?? "Saqlab bo'lmadi. Internetni tekshiring.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('space-y-3 rounded-2xl border p-4', done ? 'border-success/40 bg-success/5' : 'border-border/70 bg-card')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-black',
              done ? 'bg-success text-white' : 'bg-primary/10 text-primary',
            )}
          >
            {done ? <Check className="size-4" /> : index + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed whitespace-pre-line text-foreground">{text}</p>
        </div>
        {result && <Badge variant={scoreTone(result.score)} className="shrink-0">{result.score}/10</Badge>}
      </div>

      <CodeEditor
        value={start.code}
        language={homework.language}
        readOnly={locked || done || busy}
        onChange={(value) => {
          code.current = value
          writeDraft(homework.id, index, { code: value, stats: totals() })
        }}
        onStats={(s) => {
          session.current = s
        }}
      />

      {result && (
        <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="whitespace-pre-line">{result.feedback}</p>
        </div>
      )}

      {!locked && (
        <div className="flex justify-end">
          {done ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => save(false)}>
              <Pencil className="size-3.5" /> Tahrirlash
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => save(true)} className="bg-success text-white hover:bg-success/90">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Done
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** Code homework: every exercise in its own editor; "Yakunlash" hands it all in once each one
 * is done, and the AI's verdict for every exercise appears right under it. */
export function CodeHomework({ homework, now }) {
  const { finish } = useHomeworkActions()
  const [sending, setSending] = useState(false)
  const sub = homework.submission
  const open = homework.dueAt > now
  const handedIn = sub && (sub.status === 'checking' || sub.status === 'checked')
  const locked = handedIn || !open
  const answers = sub?.answers ?? []
  const doneCount = homework.exercises.filter((_, i) => answers[i]?.done).length
  const allDone = doneCount === homework.exercises.length

  const send = async () => {
    setSending(true)
    try {
      await finish(homework.id)
      toast.success('Yuborildi! AI tekshirmoqda…')
    } catch (err) {
      toast.error(err?.data ?? "Yuborib bo'lmadi")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5">
          <HomeworkHeader homework={homework} now={now} />
          {!handedIn && open && (
            <p className="text-xs text-muted-foreground">
              Har bir masalani muharrirda yozing va <b>Done</b> ni bosing. Hammasi tayyor bo'lgach — <b>Yakunlash</b>. Kodni o'zingiz yozing: boshqa joydan qo'yilgan (paste) kod AI
              va ustozga ko'rinadi, coin kamayadi.
            </p>
          )}
          {!open && !handedIn && <p className="text-sm font-medium text-destructive">Muddat tugagan — vazifa yuborilmadi.</p>}
          {sub && sub.status !== 'draft' && <Verdict sub={sub} maxCoins={homework.maxCoins} />}
        </CardContent>
      </Card>

      {homework.exercises.map((text, i) => (
        <Exercise
          key={`${homework.id}:${i}`}
          homework={homework}
          index={i}
          text={text}
          answer={answers[i]}
          result={sub?.status === 'checked' ? sub.exerciseResults?.[i] : null}
          locked={locked}
        />
      ))}

      {!locked && (
        <div className="sticky bottom-20 z-[5] flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,.10)] lg:bottom-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-foreground">
              {doneCount}/{homework.exercises.length} masala tayyor
            </p>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${(doneCount / homework.exercises.length) * 100}%` }} />
            </div>
          </div>
          <Button onClick={send} disabled={!allDone || sending} title={allDone ? undefined : 'Avval hamma masalada Done ni bosing'}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Yakunlash va yuborish
          </Button>
        </div>
      )}
    </div>
  )
}
