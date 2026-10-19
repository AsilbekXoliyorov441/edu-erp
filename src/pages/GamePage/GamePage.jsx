import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, ChevronRight, Eye, Flag, Flame, Gamepad2, Hourglass, Loader2, Play, Users, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { useCountdown, useGameActions, useGameState } from '@/entities/game/model/store'
import { ROUTES } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'
import { teamOf } from '@/pages/GamePage/gameTheme'
import { Leaderboard, OptionTiles, Podium, QuestionBody, TeamStandings, TimerRing } from '@/pages/GamePage/gameUi'

const panel = 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'

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

function GameHeader({ state, right }) {
  const inQuestion = state.status === 'question' || state.status === 'reveal'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to={ROUTES.GAMES} aria-label="Orqaga">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            {state.status !== 'finished' && <span className="size-2.5 animate-pulse rounded-full bg-red-500" />}
            {state.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {state.groupName} • {state.mode === 'team' ? "Jamoaviy o'yin" : "Yakka o'yin"}
            {inQuestion && ` • ${state.currentIndex + 1}/${state.totalQuestions}-savol`}
          </p>
        </div>
      </div>
      {right}
    </div>
  )
}

function QuestionProgress({ state }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: state.totalQuestions }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            i < state.currentIndex || (i === state.currentIndex && state.status === 'reveal')
              ? 'bg-blue-500'
              : i === state.currentIndex
                ? 'bg-blue-300 dark:bg-blue-500/50'
                : 'bg-gray-200 dark:bg-gray-800',
          )}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ host ------------- */

function HostLobby({ state, onStart, busy }) {
  const byTeam =
    state.mode === 'team'
      ? Array.from({ length: state.teamCount }, (_, team) => state.leaderboard.filter((p) => p.team === team))
      : [state.leaderboard]

  return (
    <Card className={panel}>
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
            <Gamepad2 className="size-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-foreground">O'quvchilar qo'shilmoqda…</h3>
          <p className="text-sm text-muted-foreground">
            O'quvchilar o'z akkauntidan <b>"O'yinlar"</b> bo'limiga kirib, <b>"O'yinga qo'shilish"</b> tugmasini bosadi.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-4xl font-extrabold tabular-nums text-blue-500">
          <Users className="size-8" /> {state.leaderboard.length}
        </div>

        <div className={cn('grid gap-4', state.mode === 'team' && 'sm:grid-cols-2')}>
          {byTeam.map((members, team) => (
            <div key={team} className="space-y-2 rounded-2xl bg-gray-100 p-4 dark:bg-gray-800/60">
              {state.mode === 'team' && (
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="size-3 rounded-full" style={{ background: teamOf(team).color }} />
                  {teamOf(team).name} ({members.length})
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {members.map((p) => (
                    <motion.span
                      key={p.playerId}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-foreground dark:border-gray-700 dark:bg-gray-900"
                    >
                      {p.fullName}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {members.length === 0 && <span className="text-sm text-muted-foreground">Hali hech kim yo'q</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onStart}
            disabled={busy || state.leaderboard.length === 0}
            className="h-14 gap-2 bg-blue-500 px-10 text-lg text-white hover:bg-blue-600"
          >
            <Play className="size-6" /> Boshlash
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function HostQuestion({ state, onReveal, onNext, busy }) {
  const revealed = state.status === 'reveal'
  const { secondsLeft, fraction } = useCountdown(state.questionStartedAt, state.durationSec, !revealed)
  const isLast = state.currentIndex + 1 >= state.totalQuestions

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Card className={panel}>
        <CardContent className="space-y-6 p-5 sm:p-8">
          <QuestionProgress state={state} />
          <div className="flex items-start justify-between gap-4">
            <QuestionBody question={state.question} large />
            {revealed ? (
              <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                Javob
              </span>
            ) : (
              <TimerRing secondsLeft={secondsLeft} fraction={fraction} size={84} />
            )}
          </div>
          <OptionTiles question={state.question} showDistribution />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <b className="text-lg text-foreground tabular-nums">{state.answeredCount}</b> / {state.leaderboard.length} javob
              berdi
            </p>
            {revealed ? (
              <Button size="lg" onClick={onNext} disabled={busy} className="gap-2 bg-blue-500 text-white hover:bg-blue-600">
                {isLast ? (
                  <>
                    <Flag className="size-5" /> Natijalar
                  </>
                ) : (
                  <>
                    Keyingi savol <ChevronRight className="size-5" />
                  </>
                )}
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={onReveal} disabled={busy} className="gap-2">
                <Eye className="size-5" /> Javobni ko'rsatish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {state.mode === 'team' && (
          <Card className={panel}>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Jamoalar</p>
              <TeamStandings teams={state.teams} />
            </CardContent>
          </Card>
        )}
        <Card className={panel}>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Reyting</p>
            <Leaderboard entries={state.leaderboard} limit={8} showTeams={state.mode === 'team'} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FinalResults({ state, highlightStudentId }) {
  const winnerTeam = state.mode === 'team' ? state.teams[0] : null
  return (
    <div className="space-y-4">
      <Card className={panel}>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">O'yin yakunlandi</p>
            <h3 className="text-2xl font-extrabold text-foreground">G'oliblar</h3>
          </div>
          {winnerTeam && winnerTeam.score > 0 && (
            <div
              className="mx-auto w-fit rounded-2xl px-5 py-2.5 text-center text-white shadow-lg"
              style={{ background: teamOf(winnerTeam.team).color }}
            >
              <p className="text-xs font-semibold uppercase opacity-90">G'olib jamoa</p>
              <p className="text-lg font-extrabold">
                {teamOf(winnerTeam.team).name} • {winnerTeam.score} ball
              </p>
            </div>
          )}
          <Podium entries={state.leaderboard} />
        </CardContent>
      </Card>
      <div className={cn('grid gap-4', state.mode === 'team' && 'lg:grid-cols-[1fr_340px]')}>
        <Card className={panel}>
          <CardContent className="p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">To'liq natijalar</p>
            <Leaderboard
              entries={state.leaderboard}
              limit={100}
              highlightStudentId={highlightStudentId}
              showTeams={state.mode === 'team'}
            />
          </CardContent>
        </Card>
        {state.mode === 'team' && (
          <Card className={panel}>
            <CardContent className="p-4 sm:p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">Jamoalar</p>
              <TeamStandings teams={state.teams} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function HostView({ state }) {
  const actions = useGameActions()
  const [start, starting] = useAction(() => actions.start(state.id))
  const [reveal, revealing] = useAction(() => actions.reveal(state.id))
  const [next, advancing] = useAction(() => actions.next(state.id))
  const [finish, finishing] = useAction(() => actions.finish(state.id))

  return (
    <div className="space-y-5">
      <GameHeader
        state={state}
        right={
          state.status !== 'finished' && (
            <Button variant="outline" onClick={finish} disabled={finishing} className="gap-1.5">
              <Flag className="size-4" /> O'yinni tugatish
            </Button>
          )
        }
      />
      {state.status === 'lobby' && <HostLobby state={state} onStart={start} busy={starting} />}
      {(state.status === 'question' || state.status === 'reveal') && state.question && (
        <HostQuestion state={state} onReveal={reveal} onNext={next} busy={revealing || advancing} />
      )}
      {state.status === 'finished' && <FinalResults state={state} />}
    </div>
  )
}

/* ---------------------------------------------------------------- player ------------- */

function PlayerQuestion({ state, onAnswer }) {
  const { me, question } = state
  const revealed = state.status === 'reveal'
  const { secondsLeft, fraction } = useCountdown(state.questionStartedAt, state.durationSec, !revealed)
  // Optimistic pick, tagged with its question so it doesn't leak into the next one.
  const [pendingPick, setPendingPick] = useState(null)
  const pending = pendingPick?.questionIndex === state.currentIndex ? pendingPick.index : null

  const selected = me?.answer?.selectedIndex ?? pending
  const answered = selected !== null && selected !== undefined
  const timeUp = !revealed && secondsLeft === 0

  const pick = async (index) => {
    if (answered || timeUp) return
    setPendingPick({ index, questionIndex: state.currentIndex })
    try {
      await onAnswer(index)
    } catch (err) {
      setPendingPick(null)
      toast.error(err.data ?? "Javob yuborilmadi")
    }
  }

  if (revealed) {
    const correct = me?.answer?.correct
    return (
      <motion.div key="reveal" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <Card
          className={cn(
            'border-0 text-white shadow-xl',
            correct ? 'bg-blue-500 shadow-blue-500/25' : 'bg-gray-700 shadow-gray-700/25 dark:bg-gray-800',
          )}
        >
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            {correct ? <CheckCircle2 className="size-14" /> : <XCircle className="size-14 text-red-300" />}
            <p className="text-3xl font-extrabold">
              {!me?.answer ? 'Vaqt tugadi' : correct ? "To'g'ri!" : "Noto'g'ri"}
            </p>
            {correct && <p className="text-xl font-bold">+{me.answer.points} ball</p>}
            {correct && me.streak >= 2 && (
              <p className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                <Flame className="size-4" /> {me.streak} ta ketma-ket!
              </p>
            )}
            {!correct && (
              <p className="text-sm text-white/80">To'g'ri javob: {question.options[question.correctIndex]}</p>
            )}
            {me && (
              <p className="mt-2 text-sm text-white/90">
                Siz hozir <b>{me.rank}-o'rin</b>dasiz • {me.score} ball
              </p>
            )}
          </CardContent>
        </Card>
        <OptionTiles question={question} selectedIndex={selected} showDistribution />
      </motion.div>
    )
  }

  return (
    <motion.div key={`q-${state.currentIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className={panel}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <QuestionProgress state={state} />
          <div className="flex items-start justify-between gap-4">
            <QuestionBody question={question} />
            <TimerRing secondsLeft={secondsLeft} fraction={fraction} />
          </div>
        </CardContent>
      </Card>
      {answered ? (
        <Card className={panel}>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Hourglass className="size-10 animate-pulse text-blue-500" />
            <p className="text-lg font-bold text-foreground">Javob qabul qilindi!</p>
            <p className="text-sm text-muted-foreground">Boshqalar javob berishini kutyapmiz…</p>
          </CardContent>
        </Card>
      ) : timeUp ? (
        <Card className={panel}>
          <CardContent className="p-8 text-center text-lg font-bold text-foreground">Vaqt tugadi ⏰</CardContent>
        </Card>
      ) : (
        <OptionTiles question={question} onSelect={pick} />
      )}
    </motion.div>
  )
}

function PlayerView({ state }) {
  const actions = useGameActions()
  const joinAttempted = useRef(false)

  // Opening the game page is joining it — no extra click needed.
  useEffect(() => {
    if (state.me || state.status === 'finished' || joinAttempted.current) return
    joinAttempted.current = true
    actions.join(state.id).catch((err) => toast.error(err.data ?? "O'yinga qo'shilib bo'lmadi"))
  }, [state.me, state.status, state.id, actions])

  const team = state.me && state.mode === 'team' ? teamOf(state.me.team) : null

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <GameHeader
        state={state}
        right={
          state.me && (
            <div className="flex items-center gap-2">
              {team && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: team.color }}>
                  {team.name}
                </span>
              )}
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold tabular-nums text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                {state.me.score} ball
              </span>
            </div>
          )
        }
      />

      {state.status === 'lobby' && (
        <Card className={panel}>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            {state.me ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="flex size-20 items-center justify-center rounded-3xl bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                >
                  <Gamepad2 className="size-10" />
                </motion.div>
                <p className="text-2xl font-extrabold text-foreground">Siz o'yindasiz! 🎉</p>
                {team && (
                  <p className="text-sm text-muted-foreground">
                    Jamoangiz: <b style={{ color: team.color }}>{team.name}</b>
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Ustoz o'yinni boshlashini kuting • {state.leaderboard.length} o'quvchi qo'shildi
                </p>
              </>
            ) : (
              <Loader2 className="size-8 animate-spin text-blue-500" />
            )}
          </CardContent>
        </Card>
      )}

      {(state.status === 'question' || state.status === 'reveal') && state.question && (
        <PlayerQuestion state={state} onAnswer={(index) => actions.answer(state.id, state.currentIndex, index)} />
      )}

      {state.status === 'finished' && (
        <>
          {state.me && (
            <Card className="border-0 bg-blue-500 text-white shadow-xl shadow-blue-500/25">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-white/80">Sizning natijangiz</p>
                <p className="text-4xl font-extrabold">{state.me.rank}-o'rin</p>
                <p className="mt-1 text-sm text-white/90">
                  {state.me.score} ball • {state.me.correctCount}/{state.totalQuestions} to'g'ri javob
                </p>
              </CardContent>
            </Card>
          )}
          <FinalResults state={state} highlightStudentId={state.me?.studentId} />
        </>
      )}
    </div>
  )
}

export function GamePage() {
  const { gameId } = useParams()
  const state = useGameState(gameId)

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

  return state.viewerRole === 'host' ? <HostView state={state} /> : <PlayerView state={state} />
}
