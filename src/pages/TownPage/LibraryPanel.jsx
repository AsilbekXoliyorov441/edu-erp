import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, Loader2, Sparkles, Target, X } from 'lucide-react'
import { useLearningProfile } from '@/entities/town/model/store'
import { LEARN, formatMoney } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'

const SOURCE = {
  assigned: { label: 'Ustoz bergan', cls: 'bg-blue-500/25 text-blue-100' },
  level: { label: 'Darajangizga mos', cls: 'bg-white/15 text-white/80' },
  preset: { label: 'Tayyor savollar', cls: 'bg-white/10 text-white/70' },
  own: { label: 'Sizning mavzuingiz', cls: 'bg-white/15 text-white/80' },
}

function masteryTone(m) {
  if (m >= 0.8) return { bar: 'bg-emerald-400', label: "O'zlashtirildi" }
  if (m >= 0.4) return { bar: 'bg-amber-400', label: "O'rganilmoqda" }
  if (m > 0) return { bar: 'bg-orange-400', label: 'Boshlandi' }
  return { bar: 'bg-white/30', label: 'Yangi' }
}

/** Library entrance: the student's level and topics, each with how much they've mastered.
 * Start the recommended mixed set, or practise one topic. */
export function LibraryPanel({ onStart, onClose }) {
  const profile = useLearningProfile()
  const topics = profile?.topics ?? []
  const totalQ = topics.reduce((s, t) => s + t.total, 0)
  const mastered = topics.reduce((s, t) => s + t.mastered, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 text-white shadow-2xl ring-1 ring-white/15"
      >
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-2xl font-black">
                <BookOpen className="size-7" /> Kutubxona
              </p>
              <p className="text-sm text-white/75">
                Savol yeching — yangi savol {formatMoney(LEARN.NEW_REWARD)}, takror {formatMoney(LEARN.REPEAT_REWARD)}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer rounded-xl bg-black/20 p-2 hover:bg-black/30">
              <X className="size-5" />
            </button>
          </div>

          {profile === undefined ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-[11px] font-bold tracking-wider text-white/60 uppercase">Yo'nalish</p>
                  <p className="truncate text-lg font-black">{profile.directionLabel}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-[11px] font-bold tracking-wider text-white/60 uppercase">Darajangiz</p>
                  <p className="text-lg font-black">{profile.role === 'student' ? `${Math.max(1, profile.lesson)}-dars` : 'Ustoz'}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-[11px] font-bold tracking-wider text-white/60 uppercase">O'zlashtirildi</p>
                  <p className="text-lg font-black tabular-nums">
                    {mastered}/{totalQ}
                  </p>
                </div>
              </div>
              {profile.groupName && (
                <p className="flex items-center gap-1.5 text-xs text-white/70">
                  <GraduationCap className="size-4" /> {profile.groupName} guruhi — savollar guruhingiz darajasi va ustoz bergan mavzulardan tanlanadi
                </p>
              )}
              <button
                type="button"
                onClick={() => onStart()}
                disabled={!topics.length}
                className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white text-lg font-black text-emerald-700 shadow-xl transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                <Sparkles className="size-5" /> Tavsiya: aralash mashq ({LEARN.LIBRARY_QUESTIONS} savol)
              </button>
            </>
          )}
        </div>

        {profile && (
          <div className="flex-1 space-y-2 overflow-y-auto border-t border-white/10 bg-black/10 p-4 sm:p-5">
            <p className="text-xs font-bold tracking-wider text-white/60 uppercase">Mavzularingiz</p>
            {topics.length === 0 && (
              <p className="rounded-xl bg-black/20 p-4 text-sm">Hali mavzu yo'q — ustozingizdan guruhga test biriktirishni so'rang.</p>
            )}
            {topics.map((t) => {
              const tone = masteryTone(t.mastery)
              const src = SOURCE[t.source] ?? SOURCE.level
              return (
                <div key={t.key} className={cn('flex items-center gap-3 rounded-2xl p-3', t.current ? 'bg-white/20 ring-2 ring-amber-300' : 'bg-white/10')}>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-bold">{t.title}</p>
                      {t.current && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-950">
                          <Target className="size-3" /> Hozirgi mavzu
                        </span>
                      )}
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', src.cls)}>{src.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/25">
                        <motion.div className={cn('h-full rounded-full', tone.bar)} initial={{ width: 0 }} animate={{ width: `${Math.round(t.mastery * 100)}%` }} />
                      </div>
                      <span className="w-28 text-right text-[11px] font-semibold text-white/80 tabular-nums">
                        {tone.label} • {t.mastered}/{t.total}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStart(t.key)}
                    className="h-10 shrink-0 cursor-pointer rounded-xl bg-white/20 px-3 text-sm font-black hover:bg-white/30"
                  >
                    Mashq
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
