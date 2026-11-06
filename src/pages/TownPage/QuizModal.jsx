import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { BookOpen, Calculator, Check, Flame, Fuel, HardHat, Loader2, Sparkles, User, X } from 'lucide-react'
import { CodeBlock } from '@/shared/ui/code-block'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { useTownActions, useTownQuiz } from '@/entities/town/model/store'
import { LEARN, PLOT_BY_ID, formatMoney } from '@/shared/config/town'
import { OPTION_STYLES } from '@/pages/GamePage/gameTheme'
import { cn } from '@/shared/lib/utils'

const THEMES = {
  library: { title: 'Kutubxona', icon: BookOpen, bg: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700' },
  build: { title: 'Qurilish imtihoni', icon: HardHat, bg: 'bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700' },
  fuel: { title: "Yoqilg'i quyish", icon: Fuel, bg: 'bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700' },
  passenger: { title: "Yo'lovchi savoli", icon: User, bg: 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600' },
  collect: { title: 'Hisobchi savoli', icon: Calculator, bg: 'bg-gradient-to-br from-emerald-600 via-green-600 to-lime-700' },
}

const minutes = (ms) => Math.round(ms / 60_000)

function Progress({ total, index, results }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full transition-colors',
            results[i] === true ? 'bg-emerald-400' : results[i] === false ? 'bg-rose-400' : i === index ? 'bg-white' : 'bg-white/20',
          )}
        />
      ))}
    </div>
  )
}

function FinalScreen({ final, onClose, onAgain, onLibrary }) {
  const { kind, result, plotNumber } = final
  const passed = result.status === 'passed'
  const failed = result.status === 'failed'
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-5 py-4 text-center">
      <motion.div
        animate={passed || kind === 'library' ? { rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] } : { x: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 0.8 }}
        className="text-7xl"
      >
        {kind === 'library' ? '📚' : kind === 'fuel' ? '⛽' : passed ? '🏗️' : '😅'}
      </motion.div>
      {kind === 'fuel' && (
        <>
          <h3 className="text-3xl font-black">Bak to'ldi! ⛽</h3>
          <p className="text-white/80">
            {result.correctTotal} / {result.total} to'g'ri javob
          </p>
          <p className="text-4xl font-black text-sky-200">+{minutes(result.earned)} daqiqa haydash</p>
          <p className="text-sm text-white/70">Har bir to'g'ri javob — 1 daqiqa yo'l.</p>
        </>
      )}
      {kind === 'library' && (
        <>
          <h3 className="text-3xl font-black">Barakalla!</h3>
          <p className="text-white/80">
            {result.correctTotal} / {result.total} to'g'ri javob
          </p>
          <p className="text-4xl font-black text-emerald-400">+{formatMoney(result.earned)}</p>
        </>
      )}
      {passed && (
        <>
          <h3 className="text-3xl font-black">Imtihondan o'tdingiz! 🎉</h3>
          <p className="text-white/80">
            {result.correctTotal} / {result.total} to'g'ri •{' '}
            {result.built ? `Hovli №${plotNumber}: bino endi ${result.built} qavatli!` : 'Lekin qurilish uchun pul yetmadi'}
          </p>
        </>
      )}
      {failed && (
        <>
          <h3 className="text-3xl font-black">Bu safar o'tmadi</h3>
          <p className="text-white/80">
            {result.correctTotal} ta to'g'ri, kamida {result.need} ta kerak edi. Kutubxonada mashq qiling va{' '}
            {Math.round(LEARN.FAIL_COOLDOWN_MS / 1000)} soniyadan keyin qayta urinib ko'ring — pulingiz joyida!
          </p>
        </>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {kind === 'fuel' && (
          <button type="button" onClick={onAgain} className="h-12 cursor-pointer rounded-xl bg-sky-500 px-6 font-black text-white shadow-lg hover:bg-sky-600">
            ⛽ Yana quyish
          </button>
        )}
        {kind === 'library' && (
          <button type="button" onClick={onAgain} className="h-12 cursor-pointer rounded-xl bg-emerald-500 px-6 font-black text-white shadow-lg hover:bg-emerald-600">
            📚 Yana o'qish
          </button>
        )}
        {failed && (
          <button type="button" onClick={onLibrary} className="h-12 cursor-pointer rounded-xl bg-emerald-500 px-6 font-black text-white shadow-lg hover:bg-emerald-600">
            📚 Kutubxonada mashq qilish
          </button>
        )}
        <button type="button" onClick={onClose} className="h-12 cursor-pointer rounded-xl bg-white/15 px-6 font-bold hover:bg-white/25">
          {passed && result.built ? "Uyni ko'rish" : kind === 'fuel' ? '🚕 Haydashga' : 'Yopish'}
        </button>
      </div>
    </motion.div>
  )
}

/** Library sessions and building exams. Lives over the town; opens whenever a session is
 * active (or its result is still being shown). */
export function QuizModal({ onBuilt, onFuelDone }) {
  const quiz = useTownQuiz()
  const actions = useTownActions()
  const [feedback, setFeedback] = useState(null) // { snapshot, selected, result }
  const [final, setFinal] = useState(null)
  const [results, setResults] = useState({ id: null, list: [] })
  const [busy, setBusy] = useState(false)

  const view = feedback?.snapshot ?? quiz
  const open = !!(quiz || feedback || final)
  const list = results.id === view?.id ? results.list : []

  const answer = async (i) => {
    if (busy || feedback || !quiz?.question) return
    setBusy(true)
    playSound('lock')
    try {
      const result = await actions.quizAnswer(quiz.id, quiz.index, i)
      const nextList = [...list]
      nextList[quiz.index] = result.correct
      setResults({ id: quiz.id, list: nextList })
      setFeedback({ snapshot: quiz, selected: i, result })
      playSound(result.correct ? 'correct' : 'wrong')
      if (result.correct && result.reward) setTimeout(() => playSound('cash'), 350)
    } catch (err) {
      toast.error(err?.data ?? 'Javob yuborilmadi')
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    const r = feedback.result
    if (r.status !== 'active' && feedback.snapshot.kind === 'collect') {
      playSound('cash')
      toast.success(r.correct ? `💰 +${formatMoney(r.collected)} daromad yig'ildi!` : `💰 +${formatMoney(r.collected)} (xato javob — yarmi)`)
      setFeedback(null)
      return
    }
    if (r.status !== 'active' && feedback.snapshot.kind === 'passenger') {
      toast(r.correct ? "🙋 Yo'lovchi xursand: manzilda +50% choychaqa!" : "🙋 Yo'lovchi: «Mayli, keyingi safar bilib olasiz»")
      setFeedback(null)
      return
    }
    if (r.status !== 'active') {
      const plotId = feedback.snapshot.plotId
      setFinal({ kind: feedback.snapshot.kind, result: r, plotId, plotNumber: plotId ? PLOT_BY_ID[plotId]?.number : null })
      if (feedback.snapshot.kind === 'fuel' && r.earned > 0) playSound('engine')
      if (r.status === 'passed') {
        playSound('build')
        setTimeout(() => playSound('fanfare'), 900)
      }
    }
    setFeedback(null)
  }

  const start = async (kind, plotId) => {
    try {
      setFinal(null)
      await actions.quizStart(kind, plotId)
    } catch (err) {
      toast.error(err?.data ?? 'Boshlab bo\'lmadi')
    }
  }

  const close = async () => {
    if (final?.result.built && final.plotId) onBuilt?.(final.plotId)
    if (final?.kind === 'fuel' && final.result.earned > 0) onFuelDone?.()
    setFinal(null)
    setFeedback(null)
    if (quiz) await actions.quizCancel().catch(() => {})
  }

  if (!open) return null
  const kind = final?.kind ?? view?.kind ?? 'library'
  const isBuild = kind === 'build'
  const theme = THEMES[kind]
  const q = view?.question

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4">
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className={cn(
          'relative max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl p-4 text-white shadow-2xl ring-1 ring-white/15 sm:p-6',
          theme.bg,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-lg font-black">
            <theme.icon className="size-6" />
            {theme.title}
          </p>
          <div className="flex items-center gap-2">
            {view && !final && (
              <span className="rounded-xl bg-black/20 px-3 py-1.5 text-sm font-bold tabular-nums">
                {isBuild
                  ? `${view.correct + (feedback?.result.correct ? 1 : 0)} / ${view.need} kerak`
                  : kind === 'fuel'
                    ? `⛽ +${minutes(feedback?.result.earned ?? view.earned)} daq`
                    : kind === 'passenger'
                      ? `+${Math.round(LEARN.PASSENGER_TIP * 100)}% choychaqa`
                      : kind === 'collect'
                        ? 'Daromad yig\'ish'
                      : `+${formatMoney(feedback?.result.earned ?? view.earned)}`}
              </span>
            )}
            <button type="button" onClick={close} aria-label="Yopish" className="cursor-pointer rounded-xl bg-black/20 p-2 hover:bg-black/30">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {final ? (
          <FinalScreen final={final} onClose={close} onAgain={() => start(final.kind)} onLibrary={() => start('library')} />
        ) : !view ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <Progress total={view.total} index={view.index} results={list} />
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="rounded-full bg-black/20 px-2.5 py-1">
                {view.index + 1}-savol / {view.total}
              </span>
              {q?.topic && <span className="rounded-full bg-black/20 px-2.5 py-1">📘 {q.topic}</span>}
              {kind === 'library' && (
                <span className={cn('rounded-full px-2.5 py-1', view.isNew ? 'bg-amber-300 text-amber-950' : 'bg-black/20')}>
                  {view.isNew ? `✨ Yangi savol • ${formatMoney(LEARN.NEW_REWARD)}` : `Takror • ${formatMoney(LEARN.REPEAT_REWARD)}`}
                </span>
              )}
              {view.streak >= 2 && !feedback && (
                <span className="flex items-center gap-1 rounded-full bg-orange-400 px-2.5 py-1 text-orange-950">
                  <Flame className="size-3.5 fill-current" /> {view.streak} ketma-ket
                </span>
              )}
            </div>

            {q && (
              <div className="rounded-2xl bg-white p-4 text-center text-gray-900 shadow-xl sm:p-6">
                {q.isCode ? (
                  <div className="text-left">
                    <CodeBlock code={q.text} />
                  </div>
                ) : (
                  <p className="text-xl leading-snug font-extrabold sm:text-2xl">{q.text}</p>
                )}
                {q.imageUrl && <img src={q.imageUrl} alt="" className="mx-auto mt-3 max-h-48 rounded-xl" />}
              </div>
            )}

            <div className="grid gap-2.5 sm:grid-cols-2">
              {q?.options.map((opt, i) => {
                const st = OPTION_STYLES[i]
                const isCorrect = feedback && i === feedback.result.correctIndex
                const isPicked = feedback && i === feedback.selected
                const dim = feedback && !isCorrect && !isPicked
                return (
                  <motion.button
                    key={`${view.index}-${i}`}
                    type="button"
                    disabled={!!feedback || busy}
                    onClick={() => answer(i)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: dim ? 0.35 : 1, y: 0, scale: isCorrect ? 1.02 : 1 }}
                    transition={{ delay: feedback ? 0 : i * 0.05 }}
                    whileHover={!feedback ? { y: -3 } : undefined}
                    whileTap={!feedback ? { scale: 0.96 } : undefined}
                    className={cn(
                      'relative flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold text-white shadow-lg',
                      st.bg,
                      !feedback && cn('cursor-pointer', st.hover),
                      isCorrect && 'ring-4 ring-white',
                      isPicked && !isCorrect && 'ring-4 ring-black/40',
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 font-black">{st.letter}</span>
                    <span className="min-w-0 flex-1 break-words">{opt}</span>
                    {isCorrect && (
                      <span className="flex size-8 items-center justify-center rounded-full bg-white text-emerald-600">
                        <Check className="size-5" strokeWidth={3} />
                      </span>
                    )}
                    {isPicked && !isCorrect && (
                      <span className="flex size-8 items-center justify-center rounded-full bg-white/25">
                        <X className="size-5" strokeWidth={3} />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-xl',
                    feedback.result.correct ? 'bg-emerald-500' : 'bg-rose-500',
                  )}
                >
                  <div>
                    <p className="text-2xl font-black">{feedback.result.correct ? "To'g'ri! 🎉" : "Noto'g'ri 😕"}</p>
                    <p className="text-sm font-semibold text-white/90">
                      {feedback.result.correct && kind === 'fuel'
                        ? feedback.result.fuelAdded > 0
                          ? '+1 daqiqa haydash vaqti ⛽'
                          : "Bak to'la!"
                        : feedback.result.correct && kind === 'collect'
                          ? `+${formatMoney(feedback.result.collected)} hisobingizga`
                        : feedback.result.correct && kind === 'passenger'
                          ? "Yo'lovchi xursand — manzilda choychaqa beradi!"
                          : feedback.result.correct
                        ? feedback.result.reward
                          ? `+${formatMoney(feedback.result.reward)}${feedback.result.streak >= 2 ? ` • ${feedback.result.streak} ketma-ket bonus!` : ''}`
                          : 'Imtihon davom etmoqda'
                        : `To'g'ri javob: ${OPTION_STYLES[feedback.result.correctIndex]?.letter} — eslab qoling!`}
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={next}
                    whileTap={{ scale: 0.96 }}
                    autoFocus
                    className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-6 font-black text-gray-900 shadow-lg"
                  >
                    {feedback.result.status === 'active' ? 'Keyingi savol →' : (
                      <>
                        <Sparkles className="size-4" /> Natija
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
