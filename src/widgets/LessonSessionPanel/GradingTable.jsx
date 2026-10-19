import { useId } from 'react'
import { ArrowUpToLine, Check, Clock, RotateCcw, Search, Sparkles, UserCheck, X } from 'lucide-react'
import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { LESSON_MAX_COINS } from '@/shared/lib/stats/monthlyGoal'
import { cn } from '@/shared/lib/utils'

/** One grid shared by the header and every row, so columns line up exactly. */
const GRID =
  'grid grid-cols-[28px_minmax(200px,1fr)_136px_236px_122px_160px_84px_44px] items-center gap-x-[12px]'

const AVATAR_PALETTE = ['#A21CAF', '#BE185D', '#C2410C', '#0F766E', '#4338CA', '#7C3AED', '#0369A1', '#B45309', '#BE123C']

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Keldi', icon: Check, strokeWidth: 2.6, color: 'var(--cs-keldi)' },
  { value: 'late', label: 'Kechikdi', icon: Clock, strokeWidth: 2.4, color: 'var(--cs-kechikdi)' },
  { value: 'absent', label: 'Kelmadi', icon: X, strokeWidth: 2.6, color: 'var(--cs-kelmadi)' },
]

const FILTERS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'ungraded', label: 'Baholanmagan' },
  { value: 'absent', label: 'Kelmaganlar' },
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Monthly-goal bar colors: ≥80% on track, 60–79% close, below 60% at risk. */
function goalColors(percent) {
  if (percent >= 80) return { fill: 'var(--cs-accent)', text: 'var(--cs-accent-dark)' }
  if (percent >= 60) return { fill: 'var(--cs-kechikdi-dot)', text: 'var(--cs-kechikdi)' }
  return { fill: 'var(--cs-danger-fill)', text: 'var(--cs-kelmadi)' }
}

function Toolbar({ query, onQueryChange, filter, onFilterChange, counts, onAllPresent, onAllMax, onClear }) {
  const searchId = useId()

  return (
    <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[var(--cs-border)] px-[16px] py-[14px]">
      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            O'quvchini qidirish
          </label>
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-[var(--cs-faint)]"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="O'quvchini qidirish"
            className="cs-focus h-[40px] w-[230px] rounded-[10px] border border-[var(--cs-border-input)] bg-[var(--cs-surface-subtle)] pr-[12px] pl-[36px] text-[14px] text-[var(--cs-text)] outline-none placeholder:text-[var(--cs-faint)]"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filtr"
          className="flex gap-[2px] rounded-[11px] border border-[var(--cs-border)] bg-[var(--cs-surface-muted)] p-[3px]"
        >
          {FILTERS.map((item) => {
            const active = filter === item.value
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(item.value)}
                className={cn(
                  'cs-focus flex h-[34px] cursor-pointer items-center gap-[8px] rounded-[8px] pr-[10px] pl-[12px] text-[13.5px] font-semibold transition-colors',
                  active
                    ? 'bg-[var(--cs-surface)] text-[var(--cs-text)] shadow-[0_1px_2px_rgba(15,23,42,.12)]'
                    : 'bg-transparent text-[var(--cs-tab-text)]',
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'flex h-[20px] min-w-[22px] items-center justify-center rounded-[99px] px-[6px] text-[12px] font-bold',
                    active
                      ? 'bg-[var(--cs-accent-soft)] text-[var(--cs-accent-dark)]'
                      : 'bg-[var(--cs-border)] text-[var(--cs-text-3)]',
                  )}
                >
                  {counts[item.value]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-[8px]">
        <button
          type="button"
          onClick={onAllPresent}
          className="cs-focus flex h-[40px] cursor-pointer items-center gap-[8px] rounded-[10px] border border-[var(--cs-border-input)] bg-[var(--cs-surface)] px-[14px] text-[14px] font-semibold text-[var(--cs-text)] transition-colors hover:bg-[var(--cs-hover)]"
        >
          <UserCheck size={16} strokeWidth={2.2} color="var(--cs-keldi)" aria-hidden="true" />
          Hammasi keldi
        </button>
        <button
          type="button"
          onClick={onAllMax}
          className="cs-focus flex h-[40px] cursor-pointer items-center gap-[8px] rounded-[10px] bg-[var(--cs-accent-soft)] px-[14px] text-[14px] font-bold text-[var(--cs-accent-dark)]"
        >
          <Sparkles size={16} aria-hidden="true" />
          Hammasiga maksimal
        </button>
        <button
          type="button"
          onClick={onClear}
          className="cs-focus flex h-[40px] cursor-pointer items-center gap-[8px] rounded-[10px] bg-transparent px-[12px] text-[14px] font-semibold text-[var(--cs-text-3)] transition-colors hover:bg-[var(--cs-hover)]"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Ballarni tozalash
        </button>
      </div>
    </div>
  )
}

function HeaderRow({ onColumnMax }) {
  return (
    <div
      role="row"
      className={cn(
        GRID,
        'h-[52px] border-b border-[var(--cs-border)] bg-[var(--cs-surface-subtle)] px-[16px] text-[12.5px] font-bold text-[var(--cs-muted)]',
      )}
    >
      <div role="columnheader">#</div>
      <div role="columnheader">O'quvchi</div>
      <div role="columnheader">Davomat</div>
      {COIN_CATEGORY_LIST.map((category) => (
        <div key={category.key} role="columnheader" className="flex items-center justify-between pr-[4px]">
          <div className="flex flex-col">
            <span className="text-[var(--cs-text-2)]">{category.label}</span>
            <span className="text-[11.5px] font-medium text-[var(--cs-faint)]">0–{category.max} ball</span>
          </div>
          <button
            type="button"
            onClick={() => onColumnMax(category.key)}
            aria-label={`${category.label}: kelganlarga maksimal ball`}
            title={`${category.label}: kelganlarga maksimal ball`}
            className="cs-focus flex h-[30px] cursor-pointer items-center gap-[4px] rounded-[8px] border border-[var(--cs-border-input)] bg-[var(--cs-surface)] px-[8px] text-[12px] font-bold text-[var(--cs-accent-dark)] transition-colors hover:bg-[var(--cs-hover)]"
          >
            <ArrowUpToLine size={13} strokeWidth={2.4} aria-hidden="true" />
            Max
          </button>
        </div>
      ))}
      <div role="columnheader" className="text-right">
        Jami
      </div>
      <div role="columnheader">
        <span className="sr-only">Amallar</span>
      </div>
    </div>
  )
}

function ScoreSegment({ studentName, category, value, disabled, onChange }) {
  return (
    <div
      role="group"
      aria-label={`${studentName}: ${category.label}`}
      className={cn(
        'inline-flex gap-[2px] rounded-[11px] border border-[var(--cs-border)] p-[3px]',
        disabled ? 'bg-[var(--cs-segment-absent)]' : 'bg-[var(--cs-surface-muted)]',
      )}
    >
      {Array.from({ length: category.max + 1 }, (_, n) => {
        const selected = value === n
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${studentName}: ${category.label} — ${n} ball`}
            onClick={() => onChange(n)}
            className={cn(
              'cs-focus flex h-[40px] w-[36px] items-center justify-center rounded-[8px] text-[15px] transition-colors',
              disabled
                ? 'cursor-not-allowed bg-transparent font-semibold text-[var(--cs-disabled)]'
                : selected
                  ? 'cursor-pointer bg-[var(--cs-accent)] font-extrabold text-[var(--cs-on-accent)] shadow-[0_1px_2px_rgba(15,23,42,.18)]'
                  : 'cursor-pointer bg-transparent font-semibold text-[var(--cs-text-2)] hover:bg-[var(--cs-score-hover)]',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

function TotalCell({ status, ungraded, total }) {
  const chip = 'inline-flex h-[26px] items-center whitespace-nowrap rounded-full px-[10px] text-[12px] font-bold'
  if (status === 'absent') {
    return <span className={cn(chip, 'bg-[var(--cs-danger-soft)] text-[var(--cs-kelmadi)]')}>Kelmadi</span>
  }
  if (ungraded) {
    return <span className={cn(chip, 'bg-[var(--cs-warn-soft)] text-[var(--cs-warn-text)]')}>kutilmoqda</span>
  }
  const full = total === LESSON_MAX_COINS
  return (
    <span
      className={cn(
        'inline-flex items-baseline rounded-[10px] px-[10px] py-[4px]',
        full && 'bg-[var(--cs-accent-soft)]',
      )}
    >
      <span className={cn('text-[18px] font-extrabold', full ? 'text-[var(--cs-accent-dark)]' : 'text-[var(--cs-text)]')}>
        {total}
      </span>
      <span
        className={cn('text-[12.5px] font-semibold', full ? 'text-[var(--cs-accent-dark)]' : 'text-[var(--cs-muted)]')}
      >
        /{LESSON_MAX_COINS}
      </span>
    </span>
  )
}

function StudentRow({ index, student, status, scores, total, ungraded, goalPercent, isFirst, session }) {
  const isAbsent = status === 'absent'
  const name = student.fullName
  const goal = goalPercent === undefined ? null : goalColors(goalPercent)

  return (
    <div
      role="row"
      className={cn(
        GRID,
        'px-[16px] py-[10px]',
        !isFirst && 'border-t border-[var(--cs-border-row)]',
        isAbsent ? 'bg-[var(--cs-row-absent)]' : ungraded ? 'bg-[var(--cs-row-pending)]' : 'bg-[var(--cs-surface)]',
      )}
    >
      <div role="cell" className="text-[13px] font-semibold text-[var(--cs-faint)]">
        {index}
      </div>

      <div role="cell" className="flex min-w-0 items-center gap-[12px]">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white',
            isAbsent && 'opacity-50',
          )}
          style={{ backgroundColor: AVATAR_PALETTE[hashString(student.id) % AVATAR_PALETTE.length] }}
        >
          {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div className="flex min-w-0 flex-col gap-[5px]">
          <span className="truncate text-[15px] font-bold text-[var(--cs-text)]">{name}</span>
          {goal && (
            <div className="flex items-center gap-[8px] text-[12px] text-[var(--cs-muted)]">
              <span className="shrink-0">Oylik maqsad</span>
              <span
                className="h-[6px] w-[56px] shrink-0 overflow-hidden rounded-[99px] bg-[var(--cs-track)]"
                role="progressbar"
                aria-label={`${name}: oylik maqsad`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(goalPercent)}
              >
                <span
                  className="block h-full rounded-[99px]"
                  style={{ width: `${Math.min(100, goalPercent)}%`, backgroundColor: goal.fill }}
                />
              </span>
              <span className="font-bold" style={{ color: goal.text }}>
                {Math.round(goalPercent)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div role="cell" className="flex gap-[4px]">
        {ATTENDANCE_OPTIONS.map((option) => {
          const selected = status === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-label={`${name}: ${option.label}`}
              title={option.label}
              onClick={() => session.setAttendance(student.id, option.value)}
              className={cn(
                'cs-focus flex size-[40px] cursor-pointer items-center justify-center rounded-[10px] border transition-colors',
                !selected &&
                  'border-[var(--cs-border-input)] bg-[var(--cs-surface)] text-[var(--cs-icon-idle)] hover:bg-[var(--cs-hover)]',
              )}
              style={selected ? { backgroundColor: option.color, borderColor: option.color, color: '#FFFFFF' } : undefined}
            >
              <option.icon size={18} strokeWidth={option.strokeWidth} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {COIN_CATEGORY_LIST.map((category) => (
        <div key={category.key} role="cell">
          <ScoreSegment
            studentName={name}
            category={category}
            value={scores?.[category.key] ?? null}
            disabled={isAbsent}
            onChange={(value) => session.setScore(student.id, category.key, value)}
          />
        </div>
      ))}

      <div role="cell" className="flex justify-end">
        <TotalCell status={status} ungraded={ungraded} total={total} />
      </div>

      <div role="cell">
        <button
          type="button"
          disabled={isAbsent}
          onClick={() => session.fillRowMax(student.id)}
          aria-label={`${name} — hammasiga maksimal ball`}
          title="Hammasiga maksimal"
          className={cn(
            'cs-focus flex size-[40px] items-center justify-center rounded-[10px] border border-[var(--cs-border)] bg-[var(--cs-surface)] transition-colors',
            isAbsent
              ? 'cursor-not-allowed text-[var(--cs-action-disabled)]'
              : 'cursor-pointer text-[var(--cs-accent-dark)] hover:bg-[var(--cs-hover)]',
          )}
        >
          <Sparkles size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** Lesson grading board: toolbar + one row per student. `rows` are already filtered and carry
 * their original 1-based `index`, so numbering stays stable while filtering. */
export function GradingTable({ rows, query, onQueryChange, filter, onFilterChange, counts, session, goalProgress }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[var(--cs-border)] bg-[var(--cs-surface)]">
      <Toolbar
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        counts={counts}
        onAllPresent={session.markAllPresent}
        onAllMax={session.fillAllMax}
        onClear={session.clearScores}
      />

      <div className="overflow-x-auto">
        <div role="table" aria-label="Dars baholash" className="min-w-[1130px]">
          <HeaderRow onColumnMax={session.fillColumnMax} />
          {rows.length === 0 ? (
            <div role="row">
              <div role="cell" className="px-[16px] py-[40px] text-center text-[14px] text-[var(--cs-muted)]">
                Hech kim topilmadi. Filtr yoki qidiruvni o'zgartirib ko'ring.
              </div>
            </div>
          ) : (
            rows.map(({ student, index }, i) => (
              <StudentRow
                key={student.id}
                index={index}
                student={student}
                status={session.attendance[student.id]}
                scores={session.scores[student.id]}
                total={session.getRowTotal(student.id)}
                ungraded={session.isUngraded(student.id)}
                goalPercent={goalProgress ? (goalProgress.get(student.id)?.percent ?? 0) : undefined}
                isFirst={i === 0}
                session={session}
              />
            ))
          )}
        </div>
      </div>
    </section>
  )
}
