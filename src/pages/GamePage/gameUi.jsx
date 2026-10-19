import { motion } from 'framer-motion'
import { Flame, Medal } from 'lucide-react'
import { CodeBlock } from '@/shared/ui/code-block'
import { OPTION_STYLES, teamOf } from '@/pages/GamePage/gameTheme'
import { cn } from '@/shared/lib/utils'

export function TimerRing({ secondsLeft, fraction, size = 72 }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const urgent = secondsLeft <= 5
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle cx="36" cy="36" r={radius} strokeWidth="7" className="fill-none stroke-gray-100 dark:stroke-gray-800" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          strokeWidth="7"
          strokeLinecap="round"
          className={cn('fill-none transition-[stroke-dashoffset] duration-200', urgent ? 'stroke-red-500' : 'stroke-blue-500')}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-xl font-extrabold tabular-nums',
          urgent ? 'text-red-500' : 'text-foreground',
        )}
      >
        {secondsLeft}
      </span>
    </div>
  )
}

export function QuestionBody({ question, large = false }) {
  return (
    <div className="space-y-4">
      {question.isCode ? (
        <CodeBlock code={question.text} />
      ) : (
        <p className={cn('font-bold text-foreground', large ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl')}>
          {question.text}
        </p>
      )}
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt=""
          className="mx-auto max-h-64 rounded-2xl border border-gray-200 object-contain dark:border-gray-800"
        />
      )}
    </div>
  )
}

/** The four answers as big tiles. On reveal the correct one stays bright and the share of
 * the class that picked each option is drawn underneath. */
export function OptionTiles({ question, selectedIndex = null, onSelect, disabled = false, showDistribution = false }) {
  const revealed = question.correctIndex !== null && question.correctIndex !== undefined
  const total = question.distribution?.reduce((s, n) => s + n, 0) ?? 0

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.options.map((option, i) => {
        const style = OPTION_STYLES[i]
        const isCorrect = revealed && i === question.correctIndex
        const dimmed = revealed && !isCorrect
        const count = question.distribution?.[i] ?? 0
        return (
          <motion.button
            key={i}
            type="button"
            disabled={disabled || !onSelect}
            onClick={() => onSelect?.(i)}
            whileTap={onSelect && !disabled ? { scale: 0.97 } : undefined}
            className={cn(
              'relative flex min-h-20 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left text-base font-semibold text-white shadow-sm transition-all sm:min-h-24 sm:text-lg',
              style.bg,
              onSelect && !disabled && 'cursor-pointer hover:brightness-110',
              dimmed && 'opacity-35',
              selectedIndex === i && 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 ' + style.ring,
              isCorrect && 'ring-4 ring-white/70',
            )}
          >
            <style.icon className="size-6 shrink-0 fill-white/90" />
            <span className="min-w-0 flex-1 break-words">{option}</span>
            {isCorrect && <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">TO'G'RI</span>}
            {showDistribution && revealed && (
              <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/15">
                <span className="block h-full bg-white/80" style={{ width: total ? `${(count / total) * 100}%` : 0 }} />
              </span>
            )}
            {showDistribution && revealed && (
              <span className="shrink-0 rounded-lg bg-black/15 px-2 py-0.5 text-sm tabular-nums">{count}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export function Leaderboard({ entries, limit = 10, highlightStudentId, showTeams = false }) {
  return (
    <div className="space-y-1.5">
      {entries.slice(0, limit).map((p) => (
        <motion.div
          layout
          key={p.playerId}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-3 py-2.5',
            p.studentId === highlightStudentId
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
          )}
        >
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              p.rank === 1
                ? 'bg-amber-400 text-amber-950'
                : p.rank === 2
                  ? 'bg-gray-300 text-gray-800'
                  : p.rank === 3
                    ? 'bg-orange-300 text-orange-950'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
            )}
          >
            {p.rank}
          </span>
          {showTeams && <span className="size-2.5 shrink-0 rounded-full" style={{ background: teamOf(p.team).color }} />}
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{p.fullName}</span>
          {p.streak >= 2 && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500">
              <Flame className="size-3.5" />
              {p.streak}
            </span>
          )}
          {p.lastPoints > 0 && <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">+{p.lastPoints}</span>}
          <span className="w-14 text-right text-sm font-bold tabular-nums text-foreground">{p.score}</span>
        </motion.div>
      ))}
    </div>
  )
}

export function TeamStandings({ teams }) {
  const best = Math.max(1, ...teams.map((t) => t.score))
  return (
    <div className="space-y-2">
      {teams.map((t, i) => {
        const team = teamOf(t.team)
        return (
          <div key={t.team} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-foreground">
                {i === 0 && t.score > 0 && <Medal className="size-4 text-amber-500" />}
                <span className="size-3 rounded-full" style={{ background: team.color }} />
                {team.name}
                <span className="text-xs font-normal text-muted-foreground">({t.members})</span>
              </span>
              <span className="font-bold tabular-nums text-foreground">{t.score}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="h-full rounded-full"
                style={{ background: team.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(t.score / best) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
      <p className="text-[11px] text-muted-foreground">Jamoa bali — a'zolar ballining o'rtachasi</p>
    </div>
  )
}

const PODIUM = [
  { place: 2, height: 'h-24', color: 'bg-gray-300 text-gray-800' },
  { place: 1, height: 'h-32', color: 'bg-amber-400 text-amber-950' },
  { place: 3, height: 'h-16', color: 'bg-orange-300 text-orange-950' },
]

export function Podium({ entries }) {
  return (
    <div className="flex items-end justify-center gap-3">
      {PODIUM.map(({ place, height, color }, i) => {
        const p = entries[place - 1]
        if (!p) return <div key={place} className="w-24 sm:w-32" />
        return (
          <motion.div
            key={place}
            className="flex w-24 flex-col items-center gap-2 sm:w-32"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (2 - i) * 0.25 }}
          >
            <span className="text-3xl">{place === 1 ? '🏆' : place === 2 ? '🥈' : '🥉'}</span>
            <p className="w-full truncate text-center text-sm font-bold text-foreground">{p.fullName}</p>
            <p className="text-xs font-semibold tabular-nums text-muted-foreground">{p.score} ball</p>
            <div className={cn('flex w-full items-start justify-center rounded-t-2xl pt-2 text-2xl font-extrabold', height, color)}>
              {place}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
