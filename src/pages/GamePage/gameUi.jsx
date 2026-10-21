import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Check, Flame, Lock, Medal, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { CodeBlock } from '@/shared/ui/code-block'
import { playSound, useSoundStore } from '@/shared/lib/sound/gameSounds'
import { CONFETTI_PIECES, OPTION_STYLES, heroOf, teamOf } from '@/pages/GamePage/gameTheme'
import { GAME_HEROES } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'

/** Full-bleed blue "stage" every game screen sits on — the place where the game happens,
 * visually set apart from the admin UI around it. */
export function GameStage({ children, className }) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4 text-white shadow-2xl shadow-blue-900/20 sm:p-6 lg:p-8',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 -z-10 size-80 rounded-full bg-indigo-300/20 blur-3xl" />
      {children}
    </div>
  )
}

/** White card on the stage. */
export function StageCard({ children, className }) {
  return (
    <div className={cn('rounded-2xl bg-white text-gray-900 shadow-xl shadow-blue-950/20 dark:bg-gray-900 dark:text-gray-100', className)}>
      {children}
    </div>
  )
}

export function SoundToggle({ className }) {
  const muted = useSoundStore((s) => s.muted)
  const toggle = useSoundStore((s) => s.toggleMuted)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
      title={muted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
      className={cn(
        'flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25',
        className,
      )}
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  )
}

/** Dot progress through the questions. */
export function QuestionDots({ total, current, revealed }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            i < current || (i === current && revealed) ? 'bg-white' : i === current ? 'bg-white/60' : 'bg-white/20',
          )}
        />
      ))}
    </div>
  )
}

/** "3, 2, 1…" before a question, with a beat on every number. */
export function LeadIn({ secondsLeft, index, total, isFinal }) {
  useEffect(() => {
    if (secondsLeft > 0) playSound('count')
  }, [secondsLeft])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-semibold text-white/80">
        {index + 1}-savol / {total}
      </motion.p>
      {isFinal && (
        <motion.p
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-extrabold text-amber-950 shadow-lg"
        >
          <Zap className="size-4 fill-current" /> OXIRGI SAVOL — 2× BALL
        </motion.p>
      )}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={secondsLeft}
          initial={{ scale: 2.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex size-40 items-center justify-center rounded-full bg-white text-8xl font-black text-blue-600 shadow-2xl"
        >
          {Math.max(1, secondsLeft)}
        </motion.span>
      </AnimatePresence>
      <p className="text-base font-medium text-white/80">Tayyor turing…</p>
    </div>
  )
}

/** Countdown: a shrinking bar plus the seconds, ticking audibly in the last 5 seconds. */
export function TimerBar({ secondsLeft, fraction, compact = false }) {
  const urgent = secondsLeft <= 5
  const lastTick = useRef(null)

  useEffect(() => {
    if (urgent && secondsLeft > 0 && lastTick.current !== secondsLeft) playSound('tick')
    lastTick.current = secondsLeft
  }, [secondsLeft, urgent])

  return (
    <div className="flex items-center gap-3">
      <motion.span
        key={urgent ? secondsLeft : 'calm'}
        initial={urgent ? { scale: 1.35 } : false}
        animate={{ scale: 1 }}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full font-black tabular-nums shadow-lg',
          compact ? 'size-11 text-lg' : 'size-14 text-2xl',
          urgent ? 'bg-rose-500 text-white' : 'bg-white text-blue-600',
        )}
      >
        {secondsLeft}
      </motion.span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
        <div
          className={cn('h-full rounded-full transition-[width] duration-100 ease-linear', urgent ? 'bg-rose-400' : 'bg-white')}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  )
}

export function QuestionCard({ question, large = false }) {
  return (
    <StageCard className={cn('space-y-4 text-center', large ? 'p-6 sm:p-10' : 'p-5 sm:p-6')}>
      {question.isCode ? (
        <div className="text-left">
          <CodeBlock code={question.text} />
        </div>
      ) : (
        <p className={cn('font-extrabold leading-snug', large ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl')}>{question.text}</p>
      )}
      {question.imageUrl && (
        <img src={question.imageUrl} alt="" className="mx-auto max-h-64 rounded-xl border border-gray-200 object-contain dark:border-gray-700" />
      )}
    </StageCard>
  )
}

/** The four answers as big tiles. On reveal the correct one gets a check, the rest fade, and
 * each tile shows how many picked it. */
export function OptionTiles({ question, selectedIndex = null, onSelect, disabled = false, showCounts = false, large = false }) {
  const revealed = question.correctIndex !== null && question.correctIndex !== undefined
  const total = question.distribution?.reduce((s, n) => s + n, 0) ?? 0

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.options.map((option, i) => {
        const style = OPTION_STYLES[i]
        const isCorrect = revealed && i === question.correctIndex
        const isPicked = selectedIndex === i
        const dimmed = revealed ? !isCorrect : selectedIndex !== null && !isPicked
        const count = question.distribution?.[i] ?? 0
        const interactive = onSelect && !disabled
        return (
          <motion.button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(i)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: dimmed ? 0.35 : 1, y: 0, scale: isCorrect ? 1.02 : 1 }}
            transition={{ delay: revealed ? 0 : i * 0.06 }}
            whileHover={interactive ? { y: -3 } : undefined}
            whileTap={interactive ? { scale: 0.96 } : undefined}
            className={cn(
              'relative flex items-center gap-3 overflow-hidden rounded-2xl text-left font-bold text-white shadow-lg transition-colors',
              large ? 'min-h-24 px-5 py-4 text-xl sm:min-h-28' : 'min-h-20 px-4 py-3 text-lg sm:min-h-24',
              style.bg,
              style.shadow,
              interactive && cn('cursor-pointer', style.hover),
              isPicked && !revealed && cn('ring-4', style.ring),
              isCorrect && 'ring-4 ring-white',
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg font-black">
              {style.letter}
            </span>
            <style.icon className="size-5 shrink-0 fill-white/90 opacity-80" />
            <span className="min-w-0 flex-1 break-words">{option}</span>
            {isCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600"
              >
                <Check className="size-6" strokeWidth={3} />
              </motion.span>
            )}
            {revealed && isPicked && !isCorrect && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/25">
                <X className="size-6" strokeWidth={3} />
              </span>
            )}
            {showCounts && revealed && (
              <>
                <span className="shrink-0 rounded-lg bg-black/20 px-2.5 py-1 text-base tabular-nums">{count}</span>
                <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
                  <motion.span
                    className="block h-full bg-white/90"
                    initial={{ width: 0 }}
                    animate={{ width: total ? `${(count / total) * 100}%` : 0 }}
                    transition={{ duration: 0.6 }}
                  />
                </span>
              </>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

function RankDelta({ rank, prevRank }) {
  if (!prevRank || prevRank === rank) return null
  const up = prevRank > rank
  return (
    <span className={cn('flex items-center text-xs font-bold', up ? 'text-emerald-500' : 'text-rose-500')}>
      {up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
      {Math.abs(prevRank - rank)}
    </span>
  )
}

const RANK_BADGE = ['bg-amber-400 text-amber-950', 'bg-gray-300 text-gray-800', 'bg-orange-300 text-orange-950']

export function Leaderboard({ entries, limit = 10, highlightStudentId, showTeams = false }) {
  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {entries.slice(0, limit).map((p) => (
          <motion.div
            layout
            key={p.playerId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 } }}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5',
              p.studentId === highlightStudentId
                ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-500/15'
                : 'bg-gray-50 dark:bg-gray-800/60',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black',
                RANK_BADGE[p.rank - 1] ?? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
              )}
            >
              {p.rank}
            </span>
            <HeroAvatar heroId={p.hero} fallbackKey={p.playerId} size="xs" teamColor={showTeams ? teamOf(p.team).color : undefined} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.fullName}</span>
            <RankDelta rank={p.rank} prevRank={p.prevRank} />
            {p.streak >= 2 && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500">
                <Flame className="size-3.5 fill-current" />
                {p.streak}
              </span>
            )}
            {p.lastPoints > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                +{p.lastPoints}
              </motion.span>
            )}
            <span className="w-14 text-right text-sm font-black tabular-nums">{p.score}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function TeamStandings({ teams }) {
  const best = Math.max(1, ...teams.map((t) => t.score))
  return (
    <div className="space-y-3">
      {teams.map((t, i) => {
        const team = teamOf(t.team)
        return (
          <motion.div layout key={t.team} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-bold">
                {i === 0 && t.score > 0 ? <Medal className="size-4 text-amber-500" /> : <span className="w-4" />}
                <span className="size-3 rounded-full" style={{ background: team.color }} />
                {team.name}
                <span className="text-xs font-normal text-gray-500">({t.members})</span>
              </span>
              <span className="font-black tabular-nums">{t.score}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="h-full rounded-full"
                style={{ background: team.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(t.score / best) * 100}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
          </motion.div>
        )
      })}
      <p className="text-[11px] text-gray-500">Jamoa bali — a'zolar ballining o'rtachasi</p>
    </div>
  )
}

const PODIUM = [
  { place: 2, height: 'h-28', color: 'from-gray-200 to-gray-300 text-gray-700', medal: '🥈' },
  { place: 1, height: 'h-40', color: 'from-amber-300 to-amber-400 text-amber-900', medal: '🏆' },
  { place: 3, height: 'h-20', color: 'from-orange-200 to-orange-300 text-orange-800', medal: '🥉' },
]

export function Podium({ entries }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      {PODIUM.map(({ place, height, color, medal }, i) => {
        const p = entries[place - 1]
        if (!p) return <div key={place} className="w-24 sm:w-36" />
        return (
          <motion.div
            key={place}
            className="flex w-24 flex-col items-center gap-2 sm:w-36"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + (2 - i) * 0.35, type: 'spring', stiffness: 120 }}
          >
            <motion.div
              className="relative"
              animate={place === 1 ? { y: [0, -8, 0] } : undefined}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              <HeroAvatar heroId={p.hero} fallbackKey={p.playerId} size={place === 1 ? 'lg' : 'md'} className="ring-4 ring-white/40" />
              <span className="absolute -right-2 -bottom-1 text-2xl sm:text-3xl">{medal}</span>
            </motion.div>
            <p className="w-full truncate text-center text-sm font-extrabold sm:text-base">{p.fullName}</p>
            <p className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold tabular-nums">{p.score} ball</p>
            <div
              className={cn(
                'flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b pt-3 text-3xl font-black shadow-xl',
                height,
                color,
              )}
            >
              {place}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/** One-shot confetti burst over its container. */
export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {CONFETTI_PIECES.map((c) => (
        <motion.span
          key={c.id}
          className="absolute top-0 block"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.round ? c.size : c.size * 0.45,
            background: c.color,
            borderRadius: c.round ? '9999px' : '2px',
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 700, x: c.drift, rotate: c.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

const HERO_SIZES = {
  xs: 'size-7 text-base',
  sm: 'size-9 text-xl',
  md: 'size-14 text-3xl',
  lg: 'size-24 text-6xl',
  xl: 'size-32 text-7xl',
}

/** A player's hero: emoji on its own gradient. `teamColor` adds a ring in team games. */
export function HeroAvatar({ heroId, fallbackKey, size = 'sm', teamColor, className }) {
  const hero = heroOf(heroId, fallbackKey)
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full leading-none shadow-md', HERO_SIZES[size], className)}
      style={{
        background: `linear-gradient(135deg, ${hero.from}, ${hero.to})`,
        boxShadow: teamColor ? `0 0 0 3px ${teamColor}` : undefined,
      }}
      title={hero.name}
    >
      <span aria-hidden="true">{hero.emoji}</span>
    </span>
  )
}

/** Hero selection before joining. Heroes other players already took are locked and show
 * who has them. */
export function HeroPicker({ selected, onSelect, takenBy, onConfirm, busy, confirmLabel = "Shu qahramon bilan kirish" }) {
  const chosen = GAME_HEROES.find((h) => h.id === selected)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-3xl font-black sm:text-4xl">Qahramoningizni tanlang</h3>
        <p className="text-white/80">U sizni butun o'yin davomida — kutish zalida, reytingda va podiumda ko'rsatadi</p>
      </div>

      <div className="flex justify-center">
        <AnimatePresence mode="popLayout">
          {chosen && (
            <motion.div
              key={chosen.id}
              initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                <HeroAvatar heroId={chosen.id} size="xl" className="ring-8 ring-white/25" />
              </motion.div>
              <p className="text-xl font-black">{chosen.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {GAME_HEROES.map((hero, i) => {
          const owner = takenBy.get(hero.id)
          const isSelected = hero.id === selected
          return (
            <motion.button
              key={hero.id}
              type="button"
              disabled={!!owner}
              onClick={() => {
                playSound('lock')
                onSelect(hero.id)
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025 }}
              whileHover={owner ? undefined : { y: -4 }}
              whileTap={owner ? undefined : { scale: 0.92 }}
              className={cn(
                'relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl p-1 shadow-lg transition-shadow',
                isSelected ? 'ring-4 ring-white' : 'ring-1 ring-white/20',
                owner && 'cursor-not-allowed',
              )}
              style={{ background: `linear-gradient(135deg, ${hero.from}, ${hero.to})` }}
            >
              <span className={cn('text-4xl leading-none sm:text-5xl', owner && 'opacity-30 grayscale')}>{hero.emoji}</span>
              <span className="max-w-full truncate text-[11px] font-bold sm:text-xs">{hero.name}</span>
              {owner && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-[10px] font-bold">
                  <Lock className="size-4" />
                  <span className="max-w-full truncate px-1">{owner}</span>
                </span>
              )}
              {isSelected && (
                <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-white text-blue-600">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      <motion.button
        type="button"
        onClick={onConfirm}
        disabled={!selected || busy}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="mx-auto flex h-14 w-full max-w-sm cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white text-lg font-black text-blue-600 shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
      >
        {chosen ? `${chosen.emoji} ${confirmLabel}` : 'Qahramon tanlang'}
      </motion.button>
    </div>
  )
}
