import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarCheck, Check, ListChecks, Play, Search } from 'lucide-react'
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
import { getDayKey } from '@/shared/lib/stats/monthlyGoal'
import { formatDayKey } from '@/shared/lib/date'
import { LessonCalendar } from '@/features/give-coin/ui/LessonCalendar'
import { useTopics } from '@/entities/test/model/store'
import { LESSON_QUIZ } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'

/** Turns a `yyyy-MM-dd` day into a full ISO datetime — the day the teacher picked, combined
 * with the current time-of-day so entries within the same day still sort chronologically. */
function toIsoWithCurrentTime(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number)
  const now = new Date()
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString()
}

/** Today if it hasn't been graded yet, otherwise nothing — the teacher picks a day. */
function defaultDay(lessons) {
  const today = getDayKey()
  return lessons.some((l) => getDayKey(l.date) === today) ? null : today
}

/** Step 2: which topics the start-of-lesson Q&A is built from. Topics attached to this
 * group come first. */
function TopicPicker({ group, selected, onToggle }) {
  const { items } = useTopics()
  const [query, setQuery] = useState('')
  const topics = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return items
      .filter((t) => t.questionCount > 0)
      .filter((t) => !needle || t.title.toLocaleLowerCase().includes(needle))
      .map((t) => ({ ...t, attached: t.groupIds?.includes(group.id) }))
      .sort((a, b) => Number(b.attached) - Number(a.attached))
  }, [items, query, group.id])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mavzuni qidirish"
          className="h-10 w-full rounded-xl border border-border bg-background pr-3 pl-9 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
        {topics.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Savollari bor mavzu topilmadi.</p>
        )}
        {topics.map((t) => {
          const checked = selected.includes(t.id)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors',
                checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md border-2',
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                )}
              >
                {checked && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{t.title}</span>
                <span className="text-xs text-muted-foreground">
                  {t.questionCount} savol{t.attached ? ' · guruhga biriktirilgan' : ''}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function StartLessonDialog({ group, onStart, disabled, lessons = [] }) {
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState(null)
  const [step, setStep] = useState('day')
  const [testIds, setTestIds] = useState([])
  const [starting, setStarting] = useState(false)
  const gradedToday = lessons.some((l) => getDayKey(l.date) === getDayKey())

  const toggleTest = (id) => setTestIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const start = async (ids) => {
    if (!day) return
    setStarting(true)
    try {
      await onStart(toIsoWithCurrentTime(day), ids)
      setOpen(false)
    } catch {
      /* the caller already showed the error */
    } finally {
      setStarting(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!day) return
    if (step === 'day') setStep('topics')
    else start(testIds)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setDay(defaultDay(lessons))
          setStep('day')
          setTestIds([])
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-1.5">
          <Play className="size-4" /> Darsni boshlash
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          {step === 'day' ? (
            <>
              <DialogHeader>
                <DialogTitle>Darsni boshlash</DialogTitle>
                <DialogDescription>
                  Qaysi kunning darsini baholaysiz? Baholangan kunlarni qayta tanlab bo'lmaydi.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {gradedToday && !day && (
                  <p className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <CalendarCheck className="size-4 shrink-0" /> Bugungi dars allaqachon baholangan.
                  </p>
                )}
                <LessonCalendar group={group} lessons={lessons} selected={day} onSelect={setDay} />
              </div>
              <DialogFooter className="items-center gap-3 sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {day ? (
                    <>
                      Tanlangan: <b className="text-foreground">{formatDayKey(day)}</b>
                    </>
                  ) : (
                    'Kunni tanlang'
                  )}
                </p>
                <Button type="submit" disabled={!day} className="gap-1.5">
                  Keyingi
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ListChecks className="size-5 text-primary" /> Savol-javob testi
                </DialogTitle>
                <DialogDescription>
                  Qaysi mavzulardan tuzay? Har bir o'quvchiga {LESSON_QUIZ.QUESTION_COUNT} ta tasodifiy savol
                  tushadi, har biriga {LESSON_QUIZ.SECONDS_PER_QUESTION} soniya. Har bir to'g'ri javob — 1 coin.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <TopicPicker group={group} selected={testIds} onToggle={toggleTest} />
              </div>
              <DialogFooter className="flex-wrap items-center gap-2 sm:justify-between">
                <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => setStep('day')}>
                  <ArrowLeft className="size-4" /> Orqaga
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={starting} onClick={() => start([])}>
                    Testsiz boshlash
                  </Button>
                  <Button type="submit" disabled={testIds.length === 0 || starting} className="gap-1.5">
                    <Play className="size-4" /> Boshlash
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
