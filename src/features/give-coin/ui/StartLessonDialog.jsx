import { useState } from 'react'
import { CalendarCheck, Play } from 'lucide-react'
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

export function StartLessonDialog({ onStart, disabled, lessons = [] }) {
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState(null)
  const gradedToday = lessons.some((l) => getDayKey(l.date) === getDayKey())

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!day) return
    onStart(toIsoWithCurrentTime(day))
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setDay(defaultDay(lessons))
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-1.5">
          <Play className="size-4" /> Darsni boshlash
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
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
            <LessonCalendar lessons={lessons} selected={day} onSelect={setDay} />
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
              <Play className="size-4" /> Boshlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
