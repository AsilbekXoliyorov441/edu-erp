import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleQuestion, SkipForward, Undo2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

function shortName(fullName) {
  const [first, last] = fullName.trim().split(/\s+/)
  return last ? `${first} ${last.charAt(0)}.` : first
}

/** Sticky Q&A bar: the app counts questions so the teacher doesn't have to. +1 in a student's
 * row gives them the current question and moves on; "Javobsiz" skips a question nobody
 * answered; "Orqaga" undoes the last question. */
export function QuestionTracker({ session, students }) {
  const { qaLog, currentQuestion } = session
  const names = new Map(students.map((s) => [s.id, shortName(s.fullName)]))
  const answered = qaLog.filter((e) => e.studentId).length
  const last = qaLog.at(-1)

  const historyRef = useRef(null)
  useEffect(() => {
    const el = historyRef.current
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [qaLog.length])

  return (
    <section
      aria-label="Savol-javob hisoblagichi"
      className="sticky top-[76px] z-[6] flex flex-wrap items-center gap-[14px] rounded-[16px] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-[12px] shadow-[0_8px_24px_rgba(15,23,42,.08)]"
    >
      <div className="flex items-center gap-[12px]">
        <div className="flex h-[52px] min-w-[96px] flex-col items-center justify-center rounded-[12px] bg-[var(--cs-accent)] px-[12px] text-[var(--cs-on-accent)]">
          <span className="text-[10.5px] font-semibold tracking-wide uppercase opacity-80">Hozir</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={currentQuestion}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="text-[20px] leading-none font-extrabold"
              aria-live="polite"
            >
              {currentQuestion}-savol
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex max-w-[220px] flex-col">
          <span className="flex items-center gap-[6px] text-[14px] font-bold text-[var(--cs-text)]">
            <MessageCircleQuestion size={16} className="text-[var(--cs-accent-dark)]" aria-hidden="true" />
            Savol-javob
          </span>
          <span className="text-[12px] leading-snug text-[var(--cs-muted)]">
            {last
              ? last.studentId
                ? `${last.q}-savol → ${names.get(last.studentId) ?? 'o‘quvchi'}`
                : `${last.q}-savol javobsiz qoldi`
              : "Kim to'g'ri javob bersa, uning qatorida +1 ni bosing"}
          </span>
        </div>
      </div>

      <div
        ref={historyRef}
        className="flex min-w-0 flex-1 gap-[6px] overflow-x-auto py-[2px] [scrollbar-width:thin]"
        aria-label="Savollar tarixi"
      >
        {qaLog.length === 0 ? (
          <span className="text-[12.5px] text-[var(--cs-faint)]">Hali savol berilmadi</span>
        ) : (
          qaLog.map((entry) => (
            <span
              key={entry.q}
              className={cn(
                'flex h-[30px] shrink-0 items-center gap-[6px] rounded-full pr-[10px] pl-[4px] text-[12.5px] font-semibold',
                entry.studentId
                  ? 'bg-[var(--cs-accent-soft)] text-[var(--cs-accent-dark)]'
                  : 'bg-[var(--cs-surface-muted)] text-[var(--cs-faint)]',
              )}
            >
              <span
                className={cn(
                  'flex size-[22px] items-center justify-center rounded-full text-[11px] font-extrabold',
                  entry.studentId ? 'bg-[var(--cs-accent)] text-[var(--cs-on-accent)]' : 'bg-[var(--cs-border)]',
                )}
              >
                {entry.q}
              </span>
              {entry.studentId ? names.get(entry.studentId) : 'javobsiz'}
            </span>
          ))
        )}
      </div>

      <div className="flex items-center gap-[8px]">
        <span className="hidden text-[12.5px] whitespace-nowrap text-[var(--cs-muted)] xl:inline">
          {qaLog.length} savol · {answered} javob
        </span>
        <button
          type="button"
          onClick={session.undoQuestion}
          disabled={qaLog.length === 0}
          title="Oxirgi savolni bekor qilish"
          className="cs-focus flex h-[40px] cursor-pointer items-center gap-[6px] rounded-[10px] px-[12px] text-[13.5px] font-semibold text-[var(--cs-text-3)] transition-colors hover:bg-[var(--cs-hover)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Undo2 size={16} aria-hidden="true" />
          Orqaga
        </button>
        <button
          type="button"
          onClick={session.skipQuestion}
          title="Hech kim javob bermadi — keyingi savolga o'tish"
          className="cs-focus flex h-[40px] cursor-pointer items-center gap-[6px] rounded-[10px] border border-[var(--cs-border-input)] bg-[var(--cs-surface)] px-[12px] text-[13.5px] font-semibold text-[var(--cs-text)] transition-colors hover:bg-[var(--cs-hover)]"
        >
          <SkipForward size={16} aria-hidden="true" />
          Javobsiz → keyingi
        </button>
      </div>
    </section>
  )
}
