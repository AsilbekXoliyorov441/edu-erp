import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { CheckCircle2, Coins, ListChecks, Play, Timer, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { CodeBlock } from '@/shared/ui/code-block'
import { cn } from '@/shared/lib/utils'
import { playSound, unlockAudio } from '@/shared/lib/sound/gameSounds'
import { useServerClockOffset } from '@/entities/game/model/store'
import {
  useActiveLessonQuizForMe,
  useLessonQuizActions,
  useMyLessonQuiz,
} from '@/entities/lesson-quiz/model/store'
import { LESSON_QUIZ, ROUTES } from '@/shared/config/constants'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const QUESTION_MS = LESSON_QUIZ.SECONDS_PER_QUESTION * 1000

/** Ticks every 100ms against the server-corrected clock. */
function useNow(offset, active) {
  const [now, setNow] = useState(() => Date.now() + offset)
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now() + offset), 100)
    return () => clearInterval(id)
  }, [offset, active])
  return now
}

function ProgressDots({ total, answers, index }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const a = answers[i]
        return (
          <span
            key={i}
            className={cn(
              'h-2.5 rounded-full transition-all',
              a ? (a.correct ? 'w-8 bg-success' : 'w-8 bg-destructive') : i === index ? 'w-8 bg-primary' : 'w-2.5 bg-muted',
            )}
          />
        )
      })}
    </div>
  )
}

function Intro({ data, onStart, starting }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-success/15 text-success">
          <ListChecks className="size-8" />
        </span>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-foreground">Darsdagi savol-javob</h2>
          <p className="text-sm text-muted-foreground">{data.title}</p>
        </div>
        <ul className="w-full max-w-sm space-y-2 text-left text-sm">
          <li className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
            <ListChecks className="size-4 text-primary" /> {data.total} ta savol, ketma-ket
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
            <Timer className="size-4 text-primary" /> Har bir savolga {LESSON_QUIZ.SECONDS_PER_QUESTION} soniya
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
            <Coins className="size-4 text-warning" /> Har bir to'g'ri javob — 1 coin
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">Boshlagandan keyin to'xtatib bo'lmaydi — sahifani yopsangiz ham vaqt ketaveradi.</p>
        <Button size="lg" className="gap-2 px-8" onClick={onStart} disabled={starting || !data.open}>
          <Play className="size-4 fill-current" /> Boshlash
        </Button>
        {!data.open && <p className="text-sm font-medium text-destructive">Ustoz savol-javobni yopgan.</p>}
      </CardContent>
    </Card>
  )
}

function Result({ data }) {
  const { correctCount, answers } = data.attempt
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="flex size-20 items-center justify-center rounded-full bg-warning/15 text-warning"
        >
          <Coins className="size-10" />
        </motion.span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">Bugungi dars uchun savol-javobdan</p>
          <p className="text-4xl font-black text-foreground">{correctCount} coin</p>
          <p className="text-sm text-muted-foreground">
            {data.total} ta savoldan {correctCount} tasiga to'g'ri javob berdingiz
          </p>
        </div>
        <ProgressDots total={data.total} answers={answers} index={-1} />
        <p className="text-xs text-muted-foreground">Coinlar ustoz darsni saqlaganda hisobingizga tushadi.</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.DASHBOARD}>Bosh sahifaga</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function Question({ data, now, onAnswer }) {
  const { attempt, question, total } = data
  const [picked, setPicked] = useState(null)
  const waiting = now < attempt.questionStartedAt
  const remainingMs = Math.max(0, attempt.questionStartedAt + QUESTION_MS - now)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const lastAnswer = attempt.index > 0 ? attempt.answers[attempt.index - 1] : null
  const timeoutSent = useRef(-1)
  const lastTick = useRef(null)

  // Time ran out without an answer → tell the server right away (it also does this itself).
  useEffect(() => {
    if (waiting || remainingMs > 0 || picked !== null || timeoutSent.current === attempt.index) return
    timeoutSent.current = attempt.index
    onAnswer(attempt.index, -1)
  }, [waiting, remainingMs, picked, attempt.index, onAnswer])

  useEffect(() => {
    if (waiting || picked !== null) return
    if (remainingSec <= 3 && remainingSec > 0 && lastTick.current !== `${attempt.index}:${remainingSec}`) {
      lastTick.current = `${attempt.index}:${remainingSec}`
      playSound('tick')
    }
  }, [remainingSec, waiting, picked, attempt.index])

  const choose = (i) => {
    if (picked !== null || waiting) return
    setPicked(i)
    onAnswer(attempt.index, i)
  }

  if (waiting) {
    const leadSec = Math.ceil((attempt.questionStartedAt - now) / 1000)
    return (
      <Card>
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
          {lastAnswer ? (
            <motion.div
              key={`fb-${attempt.index}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              {lastAnswer.correct ? (
                <CheckCircle2 className="size-20 text-success" />
              ) : (
                <XCircle className="size-20 text-destructive" />
              )}
              <p className="text-2xl font-black text-foreground">
                {lastAnswer.correct ? "To'g'ri! +1 coin" : lastAnswer.selectedIndex === -1 ? 'Vaqt tugadi' : "Noto'g'ri"}
              </p>
              <p className="text-sm text-muted-foreground">Keyingi savol…</p>
            </motion.div>
          ) : (
            <>
              <p className="text-sm font-semibold text-muted-foreground">Tayyorlaning!</p>
              <motion.p key={leadSec} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl font-black text-primary">
                {Math.max(1, leadSec)}
              </motion.p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!question) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div key={attempt.index} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-muted">
            <div
              className={cn('h-full transition-[width] duration-100 ease-linear', remainingSec <= 3 ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${(remainingMs / QUESTION_MS) * 100}%` }}
            />
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
              <span>
                {attempt.index + 1}/{total}-savol
              </span>
              <span className={cn('flex items-center gap-1 tabular-nums', remainingSec <= 3 && 'text-destructive')}>
                <Timer className="size-4" /> {remainingSec}s
              </span>
            </div>
            {question.isCode ? (
              <CodeBlock code={question.text} />
            ) : (
              <p className="text-lg font-semibold text-foreground">{question.text}</p>
            )}
            {question.imageUrl && (
              <img src={question.imageUrl} alt="Savol rasmi" className="max-h-64 w-full rounded-xl border border-border/60 object-contain" />
            )}
            <div className="space-y-2">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed',
                    picked === null && 'border-border hover:border-primary/40 hover:bg-accent',
                    picked === i && 'border-primary bg-primary/10',
                    picked !== null && picked !== i && 'border-border opacity-50',
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                    {OPTION_LETTERS[i]}
                  </span>
                  <span className="min-w-0 flex-1">{option}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

export function LessonQuizPage() {
  const active = useActiveLessonQuizForMe()
  const quizId = active?.id ?? null
  const data = useMyLessonQuiz(quizId)
  const actions = useLessonQuizActions()
  const offset = useServerClockOffset()
  const [starting, setStarting] = useState(false)
  const running = data?.attempt?.status === 'active'
  const now = useNow(offset, running)
  const announced = useRef(null)

  useEffect(() => {
    const unlock = unlockAudio()
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Right/wrong sound once per answered question.
  const answeredCount = data?.attempt?.answers.length ?? 0
  useEffect(() => {
    if (!data?.attempt) return
    if (announced.current !== null && answeredCount > announced.current) {
      playSound(data.attempt.answers[answeredCount - 1].correct ? 'correct' : 'wrong')
    }
    announced.current = answeredCount
  }, [answeredCount, data])

  const handleStart = async () => {
    setStarting(true)
    try {
      await actions.start(quizId)
      playSound('go')
    } catch (err) {
      toast.error(err?.data ?? "Boshlab bo'lmadi")
    } finally {
      setStarting(false)
    }
  }

  const attemptId = data?.attempt?.id
  const { answer } = actions
  const onAnswer = useCallback(
    (index, selectedIndex) => {
      if (!attemptId) return
      answer(attemptId, index, selectedIndex).catch((err) => toast.error(err?.data ?? 'Javob yuborilmadi'))
    },
    [attemptId, answer],
  )

  if (active === undefined || (quizId && data === undefined)) {
    return <div className="py-20 text-center text-muted-foreground">Yuklanmoqda…</div>
  }

  if (!quizId || !data) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Hozir savol-javob yo'q"
        description="Ustoz darsni boshlab savol-javob ochganda bu yerda paydo bo'ladi va sizga bildirishnoma keladi."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.DASHBOARD}>Bosh sahifaga</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {data.attempt && data.attempt.status === 'active' && (
        <ProgressDots total={data.total} answers={data.attempt.answers} index={data.attempt.index} />
      )}
      {!data.attempt && <Intro data={data} onStart={handleStart} starting={starting} />}
      {data.attempt?.status === 'active' && <Question key={data.attempt.index} data={data} now={now} onAnswer={onAnswer} />}
      {data.attempt?.status === 'done' && <Result data={data} />}
    </div>
  )
}
