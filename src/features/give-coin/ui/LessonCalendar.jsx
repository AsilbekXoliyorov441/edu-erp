import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { LESSON_WEEKDAYS, getDayKey, getMonthKey, inferGroupSchedule } from '@/shared/lib/stats/monthlyGoal'
import { formatDayKey, formatUzMonthYear } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'

const WEEKDAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function dayKeyOf(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Month calendar of a group's lesson days: graded days (a lesson exists — can't be picked
 * again), missed lesson days (on the group's weekly track, in the past, never graded) and
 * the rest. Future days can't be picked. */
export function LessonCalendar({ lessons, selected, onSelect }) {
  const todayKey = getDayKey()
  const [month, setMonth] = useState(() => (selected ? selected.slice(0, 7) : getMonthKey()))

  const { countByDay, weekdays, startKey } = useMemo(() => {
    const counts = new Map()
    lessons.forEach((l) => {
      const key = getDayKey(l.date)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    const keys = [...counts.keys()].sort()
    return {
      countByDay: counts,
      weekdays: LESSON_WEEKDAYS[inferGroupSchedule(lessons)],
      startKey: keys[0] ?? null,
    }
  }, [lessons])

  const [year, mon] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate()
  const leading = (new Date(Date.UTC(year, mon - 1, 1)).getUTCDay() + 6) % 7

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const key = dayKeyOf(year, mon, day)
    const weekday = new Date(Date.UTC(year, mon - 1, day)).getUTCDay()
    const count = countByDay.get(key) ?? 0
    const lessonDay = weekdays.includes(weekday)
    const past = key < todayKey
    let status = 'off'
    if (count > 0) status = 'graded'
    else if (key > todayKey) status = lessonDay ? 'upcoming' : 'future'
    else if (lessonDay && past && startKey && key >= startKey) status = 'missed'
    else if (lessonDay) status = 'lesson'
    return { day, key, count, status, isToday: key === todayKey }
  })

  const graded = days.filter((d) => d.status === 'graded').length
  const missed = days.filter((d) => d.status === 'missed')
  const canGoNext = month < getMonthKey()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Oldingi oy"
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-bold text-foreground">{formatUzMonthYear(year, mon - 1)}</p>
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          disabled={!canGoNext}
          aria-label="Keyingi oy"
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="pb-1 text-[11px] font-semibold text-muted-foreground">
            {w}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const isSelected = d.key === selected
          const disabled = d.status === 'graded' || d.status === 'future' || d.status === 'upcoming'
          return (
            <button
              key={d.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d.key)}
              title={
                d.status === 'graded'
                  ? d.count > 1
                    ? `Bu kunda ${d.count} ta dars yozilgan — ortiqchasini "Darslar" bo'limidan o'chiring`
                    : 'Baholangan'
                  : d.status === 'missed'
                    ? "Dars kuni — baholanmagan"
                    : undefined
              }
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                d.status === 'graded' && 'cursor-not-allowed bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
                d.status === 'missed' && 'cursor-pointer bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30',
                d.status === 'lesson' && 'cursor-pointer bg-gray-100 text-foreground hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
                d.status === 'off' && 'cursor-pointer text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800',
                d.status === 'upcoming' && 'cursor-not-allowed border border-dashed border-gray-300 text-muted-foreground dark:border-gray-700',
                d.status === 'future' && 'cursor-not-allowed text-muted-foreground/40',
                d.isToday && 'outline-2 outline-offset-1 outline-blue-500',
                isSelected && 'bg-blue-600 text-white ring-2 ring-blue-300 hover:bg-blue-600',
              )}
            >
              {d.day}
              {d.status === 'graded' && <Check className="absolute right-0.5 bottom-0.5 size-3" strokeWidth={3} />}
              {d.count > 1 && (
                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 px-1 text-[9px] leading-4 font-black text-white">
                  {d.count}×
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-blue-100 dark:bg-blue-500/20" /> Baholangan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-red-50 ring-1 ring-red-200 dark:bg-red-500/10" /> Qoldirilgan dars kuni
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-gray-100 dark:bg-gray-800" /> Dars kuni
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-blue-600" /> Tanlangan
        </span>
      </div>

      <div className="rounded-xl bg-gray-100 px-3 py-2.5 text-sm dark:bg-gray-800/60">
        <p className="font-medium text-foreground">
          Bu oy: <span className="text-blue-600 dark:text-blue-400">{graded} ta dars baholangan</span>
          {missed.length > 0 && (
            <>
              {' • '}
              <span className="text-red-600 dark:text-red-400">{missed.length} ta dars kuni qoldirilgan</span>
            </>
          )}
        </p>
        {missed.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missed.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onSelect(d.key)}
                className={cn(
                  'cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold',
                  d.key === selected
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50 dark:bg-gray-900 dark:ring-red-500/30',
                )}
              >
                {formatDayKey(d.key)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
