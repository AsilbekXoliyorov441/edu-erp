import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Eye,
  Flag,
  Flame,
  Gamepad2,
  Loader2,
  Play,
  Timer,
  Trophy,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { EmptyState } from '@/shared/ui/empty-state'
import { AnimatedNumber } from '@/shared/ui/animated-number'
import { playSound, unlockAudio } from '@/shared/lib/sound/gameSounds'
import { useGameActions, useGameState, useQuestionClock, useServerClockOffset } from '@/entities/game/model/store'
import { ROUTES } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'
import { OPTION_STYLES, heroOf, readLastHero, saveLastHero, teamOf } from '@/pages/GamePage/gameTheme'
import {
  Confetti,
  GameStage,
  HeroAvatar,
  HeroPicker,
  LeadIn,
  Leaderboard,
  OptionTiles,
  Podium,
  QuestionCard,
  QuestionDots,
  SoundToggle,
  StageCard,
  TeamStandings,
  TimerBar,
} from '@/pages/GamePage/gameUi'

function useAction(fn) {
  const [busy, setBusy] = useState(false)
  const run = async (...args) => {
    setBusy(true)
    try {
      await fn(...args)
    } catch (err) {
      toast.error(err.data ?? 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }
  return [run, busy]
}

/** Plays `name` once each time `key` becomes a new non-null value (including on mount). */
function useSoundOnce(key, name) {
  const last = useRef(null)
  useEffect(() => {
    if (key !== null && key !== last.current && name) playSound(name)
    last.current = key
  }, [key, name])
}

function StageHeader({ state, right }) {
  const inQuestion = state.status === 'question' || state.status === 'reveal'
  return (
    <div className="mb-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={ROUTES.GAMES}
            aria-label="Orqaga"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 truncate text-lg font-extrabold sm:text-xl">
              {state.status !== 'finished' && (
                <span className="flex items-center gap-1 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-black tracking-wider">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
                </span>
              )}
              <span className="truncate">{state.title}</span>
            </h2>
            <p className="truncate text-sm text-white/75">
              {state.groupName} • {state.mode === 'team' ? "Jamoaviy o'yin" : "Yakka o'yin"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {inQuestion && (
            <span className="rounded-xl bg-white/15 px-3 py-2 text-sm font-bold tabular-nums">
              {state.currentIndex + 1} / {state.totalQuestions}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold tabular-nums">
            <Users className="size-4" /> {state.leaderboard.length}
          </span>
          <SoundToggle />
          {right}
        </div>
      </div>
      {inQuestion && (
        <QuestionDots total={state.totalQuestions} current={state.currentIndex} revealed={state.status === 'reveal'} />
      )}
    </div>
  )
}

function PlayerBubble({ player, index, showTeam = false }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: Math.min(index * 0.02, 0.3) }}
      className="flex items-center gap-2 rounded-full bg-white py-1 pr-3.5 pl-1 text-sm font-semibold text-gray-900 shadow-md"
    >
      <HeroAvatar
        heroId={player.hero}
        fallbackKey={player.playerId}
        size="sm"
        teamColor={showTeam ? teamOf(player.team).color : undefined}
      />
      {player.fullName}
    </motion.span>
  )
}

/* ------------------------------------------------------------------ host ------------- */

/** "🦁 Ali sahnaga chiqdi!" — a big pop-up for each student who joins while the host
 * screen is open (not for those already there when it loaded). */
function JoinAnnouncement({ players }) {
  const latest = players.reduce((a, b) => (!a || (b.joinedAt ?? 0) > (a.joinedAt ?? 0) ? b : a), null)
  const [initialId] = useState(latest?.playerId ?? null)
  const [dismissedId, setDismissedId] = useState(null)
  const visible = latest && latest.playerId !== initialId && latest.playerId !== dismissedId

  useEffect(() => {
    if (!visible) return undefined
    const id = setTimeout(() => setDismissedId(latest.playerId), 2600)
    return () => clearTimeout(id)
  }, [visible, latest?.playerId])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={latest.playerId}
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex justify-center"
        >
          <div className="flex items-center gap-4 rounded-3xl bg-white px-6 py-4 text-gray-900 shadow-2xl">
            <motion.div animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] }} transition={{ duration: 0.8 }}>
              <HeroAvatar heroId={latest.hero} fallbackKey={latest.playerId} size="lg" />
            </motion.div>
            <div className="text-left">
              <p className="text-2xl font-black">{latest.fullName}</p>
              <p className="font-semibold text-blue-600">
                {heroOf(latest.hero, latest.playerId).name} sahnaga chiqdi! 🎉
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HostLobby({ state, onStart, busy }) {
  const teams =
    state.mode === 'team'
      ? Array.from({ length: state.teamCount }, (_, team) => ({ team, members: state.leaderboard.filter((p) => p.team === team) }))
      : null

  return (
    <div className="relative space-y-8 py-4 text-center">
      <JoinAnnouncement players={state.leaderboard} />
      <div className="space-y-3">
        <motion.div
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
          className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-2xl"
        >
          <Gamepad2 className="size-10" />
        </motion.div>
        <h3 className="text-3xl font-black sm:text-4xl">O'quvchilar qo'shilmoqda</h3>
        <p className="mx-auto max-w-lg text-white/80">
          O'quvchilar akkauntida <b>"O'yinlar"</b> bo'limini ochib, <b>"O'yinga qo'shilish"</b> tugmasini bosadi.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-6xl font-black tabular-nums">
          <AnimatedNumber value={state.leaderboard.length} />
        </span>
        <span className="text-left text-sm font-semibold leading-tight text-white/80">
          o'quvchi
          <br />
          qo'shildi
        </span>
      </div>

      {teams ? (
        <div className={cn('grid gap-3 text-left', teams.length > 2 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2')}>
          {teams.map(({ team, members }) => (
            <div key={team} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <p className="mb-3 flex items-center gap-2 font-bold">
                <span className="size-3 rounded-full ring-2 ring-white/60" style={{ background: teamOf(team).color }} />
                {teamOf(team).name}
                <span className="ml-auto rounded-full bg-white/15 px-2 text-xs">{members.length}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {members.map((p, i) => (
                    <PlayerBubble key={p.playerId} player={p} index={i} showTeam={state.mode === 'team'} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-24 flex-wrap justify-center gap-2">
          <AnimatePresence>
            {state.leaderboard.map((p, i) => (
              <PlayerBubble key={p.playerId} player={p} index={i} showTeam={state.mode === 'team'} />
            ))}
          </AnimatePresence>
          {state.leaderboard.length === 0 && (
            <span className="flex items-center gap-2 text-white/70">
              <Loader2 className="size-4 animate-spin" /> Birinchi o'quvchini kutyapmiz…
            </span>
          )}
        </div>
      )}

      <motion.button
        type="button"
        onClick={onStart}
        disabled={busy || state.leaderboard.length === 0}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="mx-auto flex h-16 cursor-pointer items-center gap-3 rounded-2xl bg-white px-12 text-xl font-black text-blue-600 shadow-2xl transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play className="size-7 fill-current" /> Boshlash
      </motion.button>
    </div>
  )
}

function RevealStats({ state }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold">
        <CheckCircle2 className="size-4" /> {state.correctCount} / {state.leaderboard.length} to'g'ri
      </span>
      {state.fastest && (
        <span className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950">
          <Zap className="size-4 fill-current" /> Eng tez: {state.fastest.fullName} • {state.fastest.seconds} s
        </span>
      )}
    </div>
  )
}

function HostQuestion({ state, offset, onReveal, onNext, busy }) {
  const revealed = state.status === 'reveal'
  const clock = useQuestionClock(state.questionStartedAt, state.durationSec, !revealed, offset)
  const isLast = state.currentIndex + 1 >= state.totalQuestions

  useSoundOnce(clock.phase === 'running' ? state.currentIndex : null, 'go')
  useSoundOnce(revealed ? state.currentIndex : null, 'reveal')

  if (!revealed && clock.phase === 'leadin') {
    return (
      <LeadIn secondsLeft={clock.leadInLeft} index={state.currentIndex} total={state.totalQuestions} isFinal={state.isFinalQuestion} />
    )
  }

  const answeredShare = state.leaderboard.length ? state.answeredCount / state.leaderboard.length : 0

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {revealed ? <RevealStats state={state} /> : <TimerBar secondsLeft={clock.secondsLeft} fraction={clock.fraction} />}
        {state.isFinalQuestion && (
          <p className="flex w-fit items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">
            <Zap className="size-3.5 fill-current" /> 2× BALL
          </p>
        )}
        <QuestionCard question={state.question} large />
        <OptionTiles question={state.question} showCounts large />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <div className="min-w-48 flex-1 space-y-1.5">
            <p className="text-sm font-semibold text-white/85">
              <b className="text-xl text-white tabular-nums">{state.answeredCount}</b> / {state.leaderboard.length} javob berdi
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <motion.div className="h-full rounded-full bg-white" animate={{ width: `${answeredShare * 100}%` }} />
            </div>
          </div>
          {revealed ? (
            <motion.button
              type="button"
              onClick={onNext}
              disabled={busy}
              whileTap={{ scale: 0.97 }}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-6 font-black text-blue-600 shadow-lg disabled:opacity-60"
            >
              {isLast ? (
                <>
                  <Trophy className="size-5" /> G'oliblar
                </>
              ) : (
                <>
                  Keyingi savol <ChevronRight className="size-5" />
                </>
              )}
            </motion.button>
          ) : (
            <button
              type="button"
              onClick={onReveal}
              disabled={busy}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-5 font-bold ring-1 ring-white/30 transition-colors hover:bg-white/25 disabled:opacity-60"
            >
              <Eye className="size-5" /> Javobni ko'rsatish
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {state.mode === 'team' && (
          <StageCard className="p-4">
            <p className="mb-3 text-sm font-extrabold">Jamoalar</p>
            <TeamStandings teams={state.teams} />
          </StageCard>
        )}
        <StageCard className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <Trophy className="size-4 text-amber-500" /> Reyting
          </p>
          <Leaderboard entries={state.leaderboard} limit={8} showTeams={state.mode === 'team'} />
        </StageCard>
      </div>
    </div>
  )
}

function FinalResults({ state, highlightStudentId }) {
  const winnerTeam = state.mode === 'team' ? state.teams[0] : null
  useSoundOnce(state.id, 'fanfare')

  return (
    <div className="relative space-y-8">
      <Confetti />
      <div className="space-y-2 text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-white/75 uppercase">O'yin yakunlandi</p>
        <h3 className="text-4xl font-black">G'oliblar 🎉</h3>
      </div>
      {winnerTeam && winnerTeam.score > 0 && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mx-auto w-fit rounded-2xl px-6 py-3 text-center shadow-2xl ring-4 ring-white/40"
          style={{ background: teamOf(winnerTeam.team).color }}
        >
          <p className="text-xs font-bold tracking-wider uppercase opacity-90">G'olib jamoa</p>
          <p className="text-2xl font-black">
            {teamOf(winnerTeam.team).name} • {winnerTeam.score}
          </p>
        </motion.div>
      )}
      <Podium entries={state.leaderboard} />
      <div className={cn('grid gap-4', state.mode === 'team' && 'lg:grid-cols-[1fr_340px]')}>
        <StageCard className="p-4 sm:p-5">
          <p className="mb-3 text-sm font-extrabold">To'liq natijalar</p>
          <Leaderboard entries={state.leaderboard} limit={100} highlightStudentId={highlightStudentId} showTeams={state.mode === 'team'} />
        </StageCard>
        {state.mode === 'team' && (
          <StageCard className="p-4 sm:p-5">
            <p className="mb-3 text-sm font-extrabold">Jamoalar</p>
            <TeamStandings teams={state.teams} />
          </StageCard>
        )}
      </div>
    </div>
  )
}

function HostView({ state, offset }) {
  const actions = useGameActions()
  const [start, starting] = useAction(() => actions.start(state.id))
  const [reveal, revealing] = useAction(() => actions.reveal(state.id))
  const [next, advancing] = useAction(() => actions.next(state.id))
  const [finish, finishing] = useAction(() => actions.finish(state.id))

  // A pop for every new student in the lobby.
  const playerCount = state.leaderboard.length
  const lastCount = useRef(playerCount)
  useEffect(() => {
    if (state.status === 'lobby' && playerCount > lastCount.current) playSound('join')
    lastCount.current = playerCount
  }, [playerCount, state.status])

  return (
    <GameStage className="min-h-[calc(100vh-9rem)]">
      <StageHeader
        state={state}
        right={
          state.status !== 'finished' && (
            <button
              type="button"
              onClick={finish}
              disabled={finishing}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 px-3 text-sm font-bold transition-colors hover:bg-rose-500 disabled:opacity-60"
            >
              <Flag className="size-4" /> <span className="hidden sm:inline">Tugatish</span>
            </button>
          )
        }
      />
      {state.status === 'lobby' && <HostLobby state={state} onStart={start} busy={starting} />}
      {(state.status === 'question' || state.status === 'reveal') && state.question && (
        <HostQuestion state={state} offset={offset} onReveal={reveal} onNext={next} busy={revealing || advancing} />
      )}
      {state.status === 'finished' && <FinalResults state={state} />}
    </GameStage>
  )
}

/* ---------------------------------------------------------------- player ------------- */

function PlayerLobby({ state, onChangeHero }) {
  const me = state.me
  const team = me && state.mode === 'team' ? teamOf(me.team) : null
  const hero = heroOf(me.hero, me.playerId)

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 13 }}
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
          <HeroAvatar heroId={me.hero} fallbackKey={me.playerId} size="xl" teamColor={team?.color} className="ring-8 ring-white/20" />
        </motion.div>
      </motion.div>
      <div className="space-y-1">
        <p className="text-3xl font-black">Siz o'yindasiz! 🎉</p>
        <p className="text-white/80">
          {me.fullName} • <b>{hero.name}</b>
        </p>
      </div>
      <button
        type="button"
        onClick={onChangeHero}
        className="cursor-pointer rounded-xl bg-white/15 px-4 py-2 text-sm font-bold transition-colors hover:bg-white/25"
      >
        Qahramonni almashtirish
      </button>
      {team && (
        <span className="rounded-full px-4 py-1.5 text-sm font-bold shadow-lg ring-2 ring-white/40" style={{ background: team.color }}>
          {team.name}
        </span>
      )}
      <div className="space-y-2">
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-2.5 rounded-full bg-white"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
            />
          ))}
        </div>
        <p className="text-sm text-white/80">Ustoz o'yinni boshlashini kuting • {state.leaderboard.length} o'quvchi</p>
      </div>
    </div>
  )
}

function RankLine({ me }) {
  const delta = me.prevRank ? me.prevRank - me.rank : 0
  return (
    <p className="flex items-center justify-center gap-2 text-base font-semibold">
      <span>
        <b className="text-2xl font-black">{me.rank}</b>-o'rin
      </span>
      {delta !== 0 && (
        <span
          className={cn(
            'flex items-center rounded-full px-2 py-0.5 text-xs font-black',
            delta > 0 ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950',
          )}
        >
          {delta > 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {Math.abs(delta)}
        </span>
      )}
      <span className="text-white/70">•</span>
      <span className="tabular-nums">
        <AnimatedNumber value={me.score} /> ball
      </span>
    </p>
  )
}

function PlayerReveal({ state }) {
  const { me, question } = state
  const answer = me?.answer
  const correct = !!answer?.correct
  const outcome = !answer ? 'none' : correct ? 'correct' : 'wrong'

  const climbed = me?.prevRank && me.prevRank > me.rank
  const sound = outcome === 'correct' ? 'correct' : 'wrong'
  useSoundOnce(`${state.currentIndex}`, sound)
  useEffect(() => {
    if (!climbed) return undefined
    const id = setTimeout(() => playSound('climb'), 700)
    return () => clearTimeout(id)
  }, [climbed, state.currentIndex])

  return (
    <motion.div key={`reveal-${state.currentIndex}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative space-y-5">
      {outcome === 'correct' && <Confetti />}
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-3xl p-8 text-center shadow-2xl',
          outcome === 'correct' ? 'bg-emerald-500' : outcome === 'wrong' ? 'bg-rose-500' : 'bg-gray-700',
        )}
      >
        <div className="relative">
          <motion.div
            animate={
              outcome === 'correct'
                ? { y: [0, -24, 0, -12, 0], rotate: [0, -8, 8, 0] }
                : { x: [0, -10, 10, -6, 6, 0] }
            }
            transition={{ duration: 0.9 }}
          >
            {me && <HeroAvatar heroId={me.hero} fallbackKey={me.playerId} size="lg" className="ring-4 ring-white/40" />}
          </motion.div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            className="absolute -right-3 -bottom-2 flex size-10 items-center justify-center rounded-full bg-white shadow-lg"
          >
            {outcome === 'correct' ? (
              <CheckCircle2 className="size-8 text-emerald-500" strokeWidth={2.5} />
            ) : outcome === 'wrong' ? (
              <XCircle className="size-8 text-rose-500" strokeWidth={2.5} />
            ) : (
              <Timer className="size-8 text-gray-600" strokeWidth={2.5} />
            )}
          </motion.span>
        </div>
        <p className="text-4xl font-black">
          {outcome === 'correct' ? "To'g'ri!" : outcome === 'wrong' ? "Noto'g'ri" : 'Vaqt tugadi'}
        </p>
        {outcome === 'correct' && (
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-3xl font-black">
            +<AnimatedNumber value={answer.points} />
          </motion.p>
        )}
        {outcome === 'correct' && me.streak >= 2 && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-sm font-black"
          >
            <Flame className="size-4 fill-current" /> {me.streak} ta ketma-ket!
          </motion.p>
        )}
        {outcome !== 'correct' && (
          <p className="rounded-xl bg-black/15 px-4 py-2 text-sm font-semibold">
            To'g'ri javob: <b>{OPTION_STYLES[question.correctIndex]?.letter}</b> — {question.options[question.correctIndex]}
          </p>
        )}
        {outcome !== 'correct' && <p className="text-sm text-white/85">Keyingi savolda albatta topasiz — davom eting! 💪</p>}
        {me && <RankLine me={me} />}
      </div>
      <OptionTiles question={question} selectedIndex={answer?.selectedIndex ?? null} showCounts />
    </motion.div>
  )
}

function PlayerQuestion({ state, offset, onAnswer }) {
  const { me, question } = state
  const clock = useQuestionClock(state.questionStartedAt, state.durationSec, true, offset)

  // Optimistic pick, tagged with its question so it doesn't leak into the next one.
  const [pendingPick, setPendingPick] = useState(null)
  const pending = pendingPick?.questionIndex === state.currentIndex ? pendingPick.index : null
  const selected = me?.answer?.selectedIndex ?? pending
  const answered = selected !== null && selected !== undefined
  const timeUp = clock.phase === 'over'

  useSoundOnce(clock.phase === 'running' ? state.currentIndex : null, 'go')
  useSoundOnce(timeUp && !answered ? state.currentIndex : null, 'timeUp')

  const pick = async (index) => {
    if (answered || clock.phase !== 'running') return
    setPendingPick({ index, questionIndex: state.currentIndex })
    playSound('lock')
    try {
      await onAnswer(index)
    } catch (err) {
      setPendingPick(null)
      toast.error(err.data ?? 'Javob yuborilmadi')
    }
  }

  if (clock.phase === 'leadin') {
    return <LeadIn secondsLeft={clock.leadInLeft} index={state.currentIndex} total={state.totalQuestions} isFinal={state.isFinalQuestion} />
  }

  return (
    <motion.div key={`q-${state.currentIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {!answered && !timeUp && <TimerBar secondsLeft={clock.secondsLeft} fraction={clock.fraction} compact />}
      {state.isFinalQuestion && (
        <p className="flex w-fit items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">
          <Zap className="size-3.5 fill-current" /> OXIRGI SAVOL — 2× BALL
        </p>
      )}
      <QuestionCard question={question} />
      {answered ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 rounded-3xl bg-white/10 p-8 text-center ring-1 ring-white/20"
        >
          <span
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl text-3xl font-black shadow-lg',
              OPTION_STYLES[selected].bg,
            )}
          >
            {OPTION_STYLES[selected].letter}
          </span>
          <p className="text-2xl font-black">Javob qabul qilindi!</p>
          <p className="flex items-center gap-2 text-sm text-white/80">
            <Loader2 className="size-4 animate-spin" /> Boshqalarni kutyapmiz…
          </p>
        </motion.div>
      ) : timeUp ? (
        <div className="rounded-3xl bg-white/10 p-8 text-center text-2xl font-black ring-1 ring-white/20">Vaqt tugadi ⏰</div>
      ) : (
        <OptionTiles question={question} onSelect={pick} />
      )}
    </motion.div>
  )
}

function PlayerFinished({ state }) {
  const me = state.me
  return (
    <div className="space-y-6">
      {me && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl bg-white p-6 text-center text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100"
        >
          <motion.div
            className="mb-2 flex justify-center"
            animate={me.rank <= 3 ? { y: [0, -10, 0] } : undefined}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            <HeroAvatar heroId={me.hero} fallbackKey={me.playerId} size="lg" />
          </motion.div>
          <p className="text-sm font-semibold text-gray-500">Sizning natijangiz</p>
          <p className="text-5xl font-black text-blue-600">{me.rank}-o'rin</p>
          <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {me.score} ball • {me.correctCount}/{state.totalQuestions} to'g'ri javob
          </p>
          <p className="mt-3 text-sm">
            {me.rank <= 3 ? 'Ajoyib! Siz eng yaxshilar qatoridasiz 🏆' : "Zo'r harakat! Keyingi o'yinda yanada yuqoriga 🚀"}
          </p>
        </motion.div>
      )}
      <FinalResults state={state} highlightStudentId={me?.studentId} />
    </div>
  )
}

/** Hero selection → join. Shown before a student is in the game, and again in the lobby
 * when they want a different hero. */
function JoinWithHero({ state, onJoined }) {
  const actions = useGameActions()
  const takenBy = new Map(
    state.leaderboard
      .filter((p) => p.hero && p.studentId !== state.me?.studentId)
      .map((p) => [p.hero, p.fullName.split(' ')[0]]),
  )
  const preferred = [state.me?.hero, readLastHero()].find((id) => id && !takenBy.has(id)) ?? null
  const [picked, setPicked] = useState(null)
  const selected = picked && !takenBy.has(picked) ? picked : preferred

  const [join, joining] = useAction(async () => {
    await actions.join(state.id, selected)
    saveLastHero(selected)
    playSound('join')
    onJoined?.()
  })

  return (
    <HeroPicker
      selected={selected}
      onSelect={setPicked}
      takenBy={takenBy}
      onConfirm={join}
      busy={joining}
      confirmLabel={state.me ? 'Saqlash' : "O'yinga kirish"}
    />
  )
}

function PlayerView({ state, offset }) {
  const actions = useGameActions()
  const [changingHero, setChangingHero] = useState(false)

  const me = state.me
  const team = me && state.mode === 'team' ? teamOf(me.team) : null
  const picking = state.status !== 'finished' && (!me || (changingHero && state.status === 'lobby'))

  return (
    <GameStage className="mx-auto min-h-[calc(100vh-9rem)] max-w-3xl">
      <StageHeader
        state={state}
        right={
          me && (
            <span
              className="flex h-10 items-center gap-2 rounded-xl py-1 pr-3 pl-1 text-sm font-black tabular-nums shadow"
              style={{ background: team?.color ?? 'rgba(255,255,255,0.95)', color: team ? '#fff' : '#2563eb' }}
            >
              <HeroAvatar heroId={me.hero} fallbackKey={me.playerId} size="xs" />
              <AnimatedNumber value={me.score} />
            </span>
          )
        }
      />
      {picking ? (
        <JoinWithHero state={state} onJoined={() => setChangingHero(false)} />
      ) : (
        <>
          {state.status === 'lobby' && <PlayerLobby state={state} onChangeHero={() => setChangingHero(true)} />}
          {state.status === 'question' && state.question && (
            <PlayerQuestion state={state} offset={offset} onAnswer={(index) => actions.answer(state.id, state.currentIndex, index)} />
          )}
          {state.status === 'reveal' && state.question && <PlayerReveal state={state} />}
        </>
      )}
      {state.status === 'finished' && <PlayerFinished state={state} />}
    </GameStage>
  )
}

export function GamePage() {
  const { gameId } = useParams()
  const state = useGameState(gameId)
  const offset = useServerClockOffset()

  useEffect(() => {
    const unlock = unlockAudio()
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  if (state === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    )
  }
  if (!state) {
    return <EmptyState icon={Gamepad2} title="O'yin topilmadi" description="Bu o'yin o'chirilgan yoki mavjud emas." />
  }

  return state.viewerRole === 'host' ? <HostView state={state} offset={offset} /> : <PlayerView state={state} offset={offset} />
}
