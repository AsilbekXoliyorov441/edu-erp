import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Check, ChevronLeft, ChevronRight, Coins, Pencil } from 'lucide-react'
import { RenameGroupDialog } from '@/features/rename-group/ui/RenameGroupDialog'
import { useCurrentMonthGoal } from '@/entities/monthly-goal/model/store'
import { formatUzLongDate, getMonthLabel } from '@/shared/lib/date'
import { useLessonSession } from '@/features/give-coin/model/useLessonSession'
import { GradingTable } from '@/widgets/LessonSessionPanel/GradingTable'
import { cn } from '@/shared/lib/utils'

const NAV_BUTTON =
  'cs-focus flex h-[52px] w-[44px] items-center justify-center rounded-[12px] border border-[var(--cs-border)] bg-[var(--cs-surface)] transition-colors'

function Chip({ className, children }) {
  return (
    <span
      className={cn(
        'inline-flex h-[28px] items-center gap-[6px] rounded-full bg-[var(--cs-surface-muted)] px-[10px] text-[13px] font-semibold text-[var(--cs-text-2)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

function LessonCard({ group, stats, lessonNumber, monthIndex, date, onBack }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-[16px] rounded-[16px] border border-[var(--cs-border)] bg-[var(--cs-surface)] px-[20px] py-[18px]">
      <div className="flex items-center gap-[14px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Orqaga"
          className="cs-focus flex size-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-3)] transition-colors hover:bg-[var(--cs-hover)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[4px]">
            <h2 className="text-[24px] leading-tight font-extrabold tracking-[-0.01em] text-[var(--cs-text)]">{group.name}</h2>
            <RenameGroupDialog
              group={group}
              trigger={
                <button
                  type="button"
                  aria-label="Guruh nomini tahrirlash"
                  className="cs-focus flex size-[36px] cursor-pointer items-center justify-center rounded-[8px] bg-transparent text-[var(--cs-muted)] transition-colors hover:bg-[var(--cs-hover)]"
                >
                  <Pencil size={16} />
                </button>
              }
            />
          </div>
          <div className="flex flex-wrap gap-[6px]">
            <Chip>{stats.studentCount} o'quvchi</Chip>
            <Chip>{stats.lessonCount} dars o'tildi</Chip>
            <Chip className="bg-[var(--cs-warn-soft)] text-[var(--cs-warn-text)]">
              <Coins size={14} strokeWidth={2.2} aria-hidden="true" />
              {stats.avgCoins} o'rtacha coin
            </Chip>
          </div>
        </div>
      </div>

      {/* Only a new lesson can be graded here (the save API creates lessons, it can't edit
          past ones), so there is no previous/next lesson to jump to. */}
      <div className="flex items-center gap-[8px]">
        <button type="button" disabled aria-label="Oldingi dars" className={cn(NAV_BUTTON, 'text-[var(--cs-disabled)]')}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex h-[52px] items-center gap-[12px] rounded-[12px] border border-[var(--cs-border)] bg-[var(--cs-nav-bg)] pr-[18px] pl-[14px]">
          <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-[var(--cs-accent-soft)] text-[var(--cs-accent-dark)]">
            <Calendar size={18} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-[1px]">
            <span className="text-[15px] leading-tight font-extrabold text-[var(--cs-text)]">
              {lessonNumber}-dars · {getMonthLabel(monthIndex)}
            </span>
            <span className="text-[12.5px] leading-tight text-[var(--cs-muted)]">{formatUzLongDate(date)}</span>
          </div>
        </div>
        <button type="button" disabled aria-label="Keyingi dars" className={cn(NAV_BUTTON, 'text-[var(--cs-disabled)]')}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}

function StatCard({ dot, icon, label, children }) {
  return (
    <div className="flex flex-col gap-[6px] rounded-[14px] border border-[var(--cs-border)] bg-[var(--cs-surface)] px-[16px] py-[14px]">
      <span className="flex items-center gap-[8px] text-[13px] font-semibold text-[var(--cs-muted)]">
        {icon ?? <span className="size-[8px] shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden="true" />}
        {label}
      </span>
      {children}
    </div>
  )
}

const STAT_VALUE = 'text-[26px] leading-[1.2] font-extrabold text-[var(--cs-text)]'

function formatAverage(value) {
  return value.toFixed(1).replace('.', ',')
}

export function LessonSessionPanel({ group, students, stats, nextLessonNumber, monthIndex, date, onDone, onCancel }) {
  const session = useLessonSession({ group, students, date })
  const monthlyGoal = useCurrentMonthGoal()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const { attendance, getRowTotal, isUngraded } = session

  const total = students.length
  const presentCount = students.filter((s) => attendance[s.id] === 'present').length
  const lateCount = students.filter((s) => attendance[s.id] === 'late').length
  const absentCount = students.filter((s) => attendance[s.id] === 'absent').length
  const ungradedCount = students.filter((s) => isUngraded(s.id)).length
  const gradedCount = total - ungradedCount
  const sessionTotal = students.reduce((sum, s) => sum + getRowTotal(s.id), 0)
  const gradedAttendees = students.filter((s) => attendance[s.id] !== 'absent' && !isUngraded(s.id))
  const average = gradedAttendees.length
    ? gradedAttendees.reduce((sum, s) => sum + getRowTotal(s.id), 0) / gradedAttendees.length
    : 0

  const counts = { all: total, ungraded: ungradedCount, absent: absentCount }
  const needle = query.trim().toLocaleLowerCase()
  const rows = students
    .map((student, i) => ({ student, index: i + 1 }))
    .filter(({ student }) => {
      if (filter === 'ungraded' && !isUngraded(student.id)) return false
      if (filter === 'absent' && attendance[student.id] !== 'absent') return false
      return !needle || student.fullName.toLocaleLowerCase().includes(needle)
    })

  const showUngraded = () => {
    setFilter('ungraded')
    setQuery('')
  }

  const handleSave = async () => {
    try {
      await session.save()
    } catch {
      toast.error("Saqlab bo'lmadi. Qaytadan urinib ko'ring.")
      return
    }
    onDone()
  }

  const status = session.dirty ? 'dirty' : session.savedOnce ? 'saved' : null

  return (
    <div className="flex flex-col gap-[16px] text-[var(--cs-text)] tabular-nums">
      <LessonCard
        group={group}
        stats={stats}
        lessonNumber={nextLessonNumber}
        monthIndex={monthIndex}
        date={date}
        onBack={onCancel}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[12px]">
        <StatCard dot="var(--cs-keldi)" label="Keldi">
          <span className={STAT_VALUE}>{presentCount}</span>
        </StatCard>
        <StatCard dot="var(--cs-kechikdi-dot)" label="Kechikdi">
          <span className={STAT_VALUE}>{lateCount}</span>
        </StatCard>
        <StatCard dot="var(--cs-kelmadi)" label="Kelmadi">
          <span className={STAT_VALUE}>{absentCount}</span>
        </StatCard>
        <StatCard dot="var(--cs-accent)" label="Baholandi">
          <span className={STAT_VALUE}>
            {gradedCount}
            <span className="text-[16px] font-bold text-[var(--cs-muted)]"> / {total}</span>
          </span>
          <span
            className="h-[6px] overflow-hidden rounded-[99px] bg-[var(--cs-track)]"
            role="progressbar"
            aria-label="Baholandi"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={gradedCount}
          >
            <span
              className="block h-full rounded-[99px] bg-[var(--cs-accent)] transition-[width]"
              style={{ width: `${total ? (gradedCount / total) * 100 : 0}%` }}
            />
          </span>
        </StatCard>
        <StatCard
          icon={<Coins size={14} strokeWidth={2.4} color="var(--cs-kechikdi-dot)" aria-hidden="true" className="shrink-0" />}
          label="Bu dars uchun coin"
        >
          <span className={STAT_VALUE}>{sessionTotal}</span>
          <span className="text-[12.5px] text-[var(--cs-muted)]">o'rtacha {formatAverage(average)} / 10</span>
        </StatCard>
      </div>

      <GradingTable
        rows={rows}
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        session={session}
        goalProgress={monthlyGoal.active ? monthlyGoal.progress : null}
      />

      <div className="sticky bottom-20 z-[5] flex flex-wrap items-center justify-between gap-[12px] rounded-[16px] border border-[var(--cs-border)] bg-[var(--cs-surface)] py-[12px] pr-[12px] pl-[18px] shadow-[0_10px_30px_rgba(15,23,42,.10)] lg:bottom-[16px]">
        <div className="flex flex-wrap items-center gap-[14px] text-[14px] text-[var(--cs-text-3)]">
          <span className="flex items-center gap-[8px]">
            <Coins size={18} strokeWidth={2.2} color="var(--cs-kechikdi-dot)" aria-hidden="true" />
            Jami:
            <span className="text-[18px] font-extrabold text-[var(--cs-text)]">{sessionTotal} coin</span>
          </span>
          {status && (
            <>
              <span className="h-[24px] w-px bg-[var(--cs-border)]" aria-hidden="true" />
              <span
                className="flex items-center gap-[8px] font-semibold"
                style={{ color: status === 'dirty' ? 'var(--cs-kechikdi)' : 'var(--cs-keldi)' }}
                role="status"
              >
                <span
                  className="size-[8px] rounded-full"
                  style={{ backgroundColor: status === 'dirty' ? 'var(--cs-kechikdi-dot)' : 'var(--cs-keldi)' }}
                  aria-hidden="true"
                />
                {status === 'dirty' ? "Saqlanmagan o'zgarishlar" : 'Saqlandi'}
              </span>
            </>
          )}
          {ungradedCount > 0 && (
            <button
              type="button"
              onClick={showUngraded}
              className="cs-focus h-[36px] cursor-pointer rounded-[8px] bg-transparent font-bold text-[var(--cs-accent-dark)] underline underline-offset-[3px]"
            >
              {ungradedCount} o'quvchi baholanmagan — ko'rsatish
            </button>
          )}
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={session.reset}
            className="cs-focus h-[44px] cursor-pointer rounded-[12px] border border-[var(--cs-border-input)] bg-[var(--cs-surface)] px-[18px] text-[14.5px] font-semibold text-[var(--cs-text)] transition-colors hover:bg-[var(--cs-hover)]"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={session.saving || students.length === 0}
            className="cs-focus flex h-[44px] cursor-pointer items-center gap-[8px] rounded-[12px] bg-[var(--cs-accent)] px-[22px] text-[14.5px] font-bold text-[var(--cs-on-accent)] shadow-[0_1px_2px_rgba(15,23,42,.2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
            Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}
