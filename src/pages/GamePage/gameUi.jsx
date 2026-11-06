import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Flame,
  Loader2,
  Lock,
  Medal,
  Music,
  Shield,
  Split,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'
import { CodeBlock } from '@/shared/ui/code-block'
import { playSound, setMusicIntensity, useSoundStore } from '@/shared/lib/sound/gameSounds'
import { CONFETTI_PIECES, OPTION_STYLES, heroOf, teamOf, usesPhoto } from '@/pages/GamePage/gameTheme'
import { GAME_HEROES, GAME_POWERUPS, GAME_REACTIONS, PHOTO_HERO_ID } from '@/shared/config/constants'
import { AvatarUploadButton } from '@/features/upload-avatar/ui/AvatarUploadButton'
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

export function SoundToggle({ className, withMusic = false }) {
  const muted = useSoundStore((s) => s.muted)
  const toggle = useSoundStore((s) => s.toggleMuted)
  const musicOn = useSoundStore((s) => s.musicOn)
  const toggleMusic = useSoundStore((s) => s.toggleMusic)
  return (
    <>
      {withMusic && !muted && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={musicOn ? "Musiqani o'chirish" : 'Musiqani yoqish'}
          title={musicOn ? "Musiqani o'chirish" : 'Musiqani yoqish'}
          className={cn(
            'relative flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25',
            !musicOn && 'opacity-60',
          )}
        >
          <Music className="size-5" />
          {!musicOn && <span className="absolute h-0.5 w-6 rotate-45 rounded bg-white" />}
        </button>
      )}
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
    </>
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
    if (urgent && secondsLeft > 0 && lastTick.current !== secondsLeft) playSound(secondsLeft <= 3 ? 'heartbeat' : 'tick')
    lastTick.current = secondsLeft
    setMusicIntensity(urgent ? 1 : 0)
  }, [secondsLeft, urgent])

  return (
    <motion.div
      className="flex items-center gap-3"
      animate={secondsLeft <= 3 && secondsLeft > 0 ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      key={secondsLeft <= 3 ? `shake-${secondsLeft}` : 'still'}
    >
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
    </motion.div>
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
export function OptionTiles({
  question,
  selectedIndex = null,
  onSelect,
  disabled = false,
  showCounts = false,
  large = false,
  hiddenIndices = [],
}) {
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
        const eliminated = !revealed && hiddenIndices.includes(i)
        const interactive = onSelect && !disabled && !eliminated
        return (
          <motion.button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(i)}
            initial={{ opacity: 0, y: 14 }}
            animate={{
              opacity: eliminated ? 0.15 : dimmed ? 0.35 : 1,
              y: 0,
              scale: isCorrect ? 1.02 : eliminated ? 0.94 : 1,
              rotate: eliminated ? (i % 2 ? 1.5 : -1.5) : 0,
            }}
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
              eliminated && 'grayscale',
            )}
          >
            {eliminated && (
              <span className="absolute inset-0 z-10 flex items-center justify-center">
                <X className="size-14 text-white/90" strokeWidth={3} />
              </span>
            )}
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
            <HeroAvatar player={p} size="xs" teamColor={showTeams ? teamOf(p.team).color : undefined} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.fullName}</span>
            {p.lastBoost === 'double' && (
              <span title="2× ball" className="rounded bg-amber-400 px-1 text-[10px] font-black text-amber-950">
                2×
              </span>
            )}
            {p.lastBoost === 'shield' && <Shield title="Qalqon" className="size-3.5 fill-sky-400 text-sky-500" />}
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

/** `delay` lines each step up with the drum roll: 3rd, then 2nd, then 1st on the crash. */
const PODIUM = [
  { place: 2, height: 'h-28', color: 'from-gray-200 to-gray-300 text-gray-700', medal: '🥈', delay: 1.0 },
  { place: 1, height: 'h-40', color: 'from-amber-300 to-amber-400 text-amber-900', medal: '🏆', delay: 1.8 },
  { place: 3, height: 'h-20', color: 'from-orange-200 to-orange-300 text-orange-800', medal: '🥉', delay: 0.45 },
]

export function Podium({ entries }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      {PODIUM.map(({ place, height, color, medal, delay }) => {
        const p = entries[place - 1]
        if (!p) return <div key={place} className="w-24 sm:w-36" />
        return (
          <motion.div
            key={place}
            className="flex w-24 flex-col items-center gap-2 sm:w-36"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: place === 1 ? 200 : 120 }}
          >
            <motion.div
              className="relative"
              animate={place === 1 ? { y: [0, -8, 0] } : undefined}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              {place === 1 && (
                <motion.span
                  initial={{ y: -30, opacity: 0, rotate: -30 }}
                  animate={{ y: 0, opacity: 1, rotate: -12 }}
                  transition={{ delay: 2.3, type: 'spring' }}
                  className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 text-4xl"
                >
                  👑
                </motion.span>
              )}
              <HeroAvatar player={p} size={place === 1 ? 'lg' : 'md'} className="ring-4 ring-white/40" />
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

/** A player's avatar: their own photo, or an emoji hero on its gradient. Pass `player` (a
 * leaderboard row) or the individual props. `teamColor` adds a ring in team games. */
export function HeroAvatar({ player, heroId = player?.hero, fallbackKey = player?.playerId ?? '', photoUrl = player?.photoUrl, size = 'sm', teamColor, className }) {
  const [broken, setBroken] = useState(false)
  if (usesPhoto(heroId, photoUrl) && !broken) {
    return (
      <span
        className={cn('block shrink-0 overflow-hidden rounded-full bg-white/30 shadow-md', HERO_SIZES[size], className)}
        style={{ boxShadow: teamColor ? `0 0 0 3px ${teamColor}` : undefined }}
        title={player?.fullName}
      >
        <img src={photoUrl} alt="" className="size-full object-cover" onError={() => setBroken(true)} draggable={false} />
      </span>
    )
  }
  const hero = heroOf(heroId === PHOTO_HERO_ID ? null : heroId, fallbackKey)
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
export function HeroPicker({ selected, onSelect, takenBy, onConfirm, busy, confirmLabel = "Shu qahramon bilan kirish", photoUrl }) {
  const isPhoto = selected === PHOTO_HERO_ID && !!photoUrl
  const chosen = isPhoto ? { id: PHOTO_HERO_ID, name: 'Mening rasmim', emoji: '📸' } : GAME_HEROES.find((h) => h.id === selected)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-3xl font-black sm:text-4xl">Kim bo'lib o'ynaysiz?</h3>
        <p className="text-white/80">O'z rasmingiz yoki qahramon — u sizni kutish zalida, reytingda va podiumda ko'rsatadi</p>
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
                <HeroAvatar heroId={chosen.id} photoUrl={photoUrl} size="xl" className="ring-8 ring-white/25" />
              </motion.div>
              <p className="text-xl font-black">{chosen.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PhotoChoice photoUrl={photoUrl} selected={isPhoto} onSelect={() => onSelect(PHOTO_HERO_ID)} />

      <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-white/60 uppercase">
        <span className="h-px flex-1 bg-white/20" /> yoki qahramon tanlang <span className="h-px flex-1 bg-white/20" />
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
                playSound('select')
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

/** "Play as me": the student's profile photo as a big first choice, or an upload prompt. */
function PhotoChoice({ photoUrl, selected, onSelect }) {
  if (!photoUrl) {
    return (
      <AvatarUploadButton onUploaded={onSelect}>
        {(open, busy) => (
          <motion.button
            type="button"
            onClick={open}
            disabled={busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-white/40 bg-white/10 p-4 text-left transition-colors hover:bg-white/15 disabled:opacity-60"
          >
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/20">
              {busy ? <Loader2 className="size-7 animate-spin" /> : <Camera className="size-7" />}
            </span>
            <span>
              <span className="block text-lg font-black">O'z rasmingiz bilan o'ynang 📸</span>
              <span className="block text-sm text-white/75">Rasm yuklang — u profilingizga ham saqlanadi</span>
            </span>
          </motion.button>
        )}
      </AvatarUploadButton>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        onClick={() => {
          playSound('select')
          onSelect()
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative flex flex-1 cursor-pointer items-center gap-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-orange-400 p-3 text-left shadow-xl',
          selected ? 'ring-4 ring-white' : 'ring-1 ring-white/30',
        )}
      >
        <img src={photoUrl} alt="" className="size-16 shrink-0 rounded-full object-cover ring-4 ring-white/50" />
        <span>
          <span className="block text-lg font-black">Mening rasmim</span>
          <span className="block text-sm text-white/85">Hamma sizni o'z yuzingiz bilan ko'radi</span>
        </span>
        {selected && (
          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-white text-fuchsia-600">
            <Check className="size-4" strokeWidth={3} />
          </span>
        )}
      </motion.button>
      <AvatarUploadButton onUploaded={onSelect}>
        {(open, busy) => (
          <button
            type="button"
            onClick={open}
            disabled={busy}
            title="Boshqa rasm yuklash"
            aria-label="Boshqa rasm yuklash"
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/15 transition-colors hover:bg-white/25 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
          </button>
        )}
      </AvatarUploadButton>
    </div>
  )
}

/* ---------------------------------------------------------- reactions ------------- */

/** Floating emoji reactions over the whole stage. Only reactions that arrive after the
 * screen opened float — old ones are skipped. */
export function ReactionLayer({ reactions = [], withSound = false }) {
  const seen = useRef(null)
  const [flying, setFlying] = useState([])

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(reactions.map((r) => r.id))
      return
    }
    const fresh = reactions.filter((r) => !seen.current.has(r.id))
    if (fresh.length === 0) return
    fresh.forEach((r) => seen.current.add(r.id))
    if (withSound) playSound('pop')
    setFlying((list) => [
      ...list.slice(-30),
      ...fresh.map((r) => ({ ...r, x: 8 + Math.random() * 84, drift: (Math.random() - 0.5) * 120, scale: 0.9 + Math.random() * 0.6 })),
    ])
  }, [reactions, withSound])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {flying.map((r) => (
          <motion.div
            key={r.id}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${r.x}%` }}
            initial={{ y: 40, opacity: 0, scale: 0.4 }}
            animate={{ y: -520, x: r.drift, opacity: [0, 1, 1, 0], scale: r.scale }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            onAnimationComplete={() => setFlying((list) => list.filter((x) => x.id !== r.id))}
          >
            <span className="text-5xl drop-shadow-lg">{r.emoji}</span>
            <span className="mt-1 flex items-center gap-1 rounded-full bg-black/35 py-0.5 pr-2 pl-0.5 text-[11px] font-bold whitespace-nowrap text-white backdrop-blur">
              <HeroAvatar player={r} size="xs" className="size-5 text-xs" />
              {r.fullName.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Emoji buttons a player taps to react. */
export function ReactionBar({ onReact }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 rounded-2xl bg-black/15 p-2 backdrop-blur">
      {GAME_REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          whileHover={{ scale: 1.2, y: -3 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => {
            playSound('pop')
            onReact(emoji)
          }}
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-2xl transition-colors hover:bg-white/20"
          aria-label={`Reaksiya ${emoji}`}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------- power-ups ------------- */

const POWERUP_ICONS = { fifty: Split, double: Zap, shield: Shield }
const POWERUP_COLORS = {
  fifty: 'from-violet-500 to-fuchsia-500',
  double: 'from-amber-400 to-orange-500',
  shield: 'from-sky-400 to-cyan-500',
}

/** Once-per-game boosts above the answer tiles. 50/50 fires immediately; 2× and the shield
 * are armed and ride along with the answer. */
export function PowerUpBar({ available, armed, onArm, onFifty, fiftyUsedNow, busy }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {GAME_POWERUPS.map((p) => {
        const Icon = POWERUP_ICONS[p.id]
        const isArmed = armed === p.id || (p.id === 'fifty' && fiftyUsedNow)
        const usable = available[p.id] && !busy
        return (
          <motion.button
            key={p.id}
            type="button"
            title={p.hint}
            disabled={!usable && !isArmed}
            onClick={() => (p.id === 'fifty' ? onFifty() : onArm(armed === p.id ? null : p.id))}
            whileHover={usable ? { y: -2 } : undefined}
            whileTap={usable ? { scale: 0.94 } : undefined}
            animate={isArmed ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={isArmed ? { repeat: Infinity, duration: 1 } : undefined}
            className={cn(
              'relative flex h-12 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br text-sm font-black shadow-lg',
              POWERUP_COLORS[p.id],
              isArmed && 'ring-4 ring-white',
              !usable && !isArmed && 'cursor-not-allowed opacity-35 grayscale',
            )}
          >
            <Icon className="size-4 fill-white/30" />
            {p.label}
            {isArmed && p.id !== 'fifty' && (
              <span className="absolute top-0.5 right-1 text-[9px] font-black tracking-wide uppercase">faol</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

/** Big "OLOVDA!" banner for a 3+ streak. */
export function OnFireBanner({ streak }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -8 }}
      animate={{ scale: [0, 1.25, 1], rotate: [-8, 4, -2] }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 px-5 py-2 text-2xl font-black tracking-wide text-white uppercase shadow-[0_0_40px_rgba(249,115,22,0.8)]"
    >
      <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
        🔥
      </motion.span>
      Olovda! {streak} ketma-ket
      <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}>
        🔥
      </motion.span>
    </motion.div>
  )
}
