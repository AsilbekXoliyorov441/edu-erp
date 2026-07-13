import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, ListChecks, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { Meter } from '@/shared/ui/meter'
import { CodeBlock } from '@/shared/ui/code-block'
import { cn } from '@/shared/lib/utils'
import { useQuizForTest, useCheckAnswer, useSubmitAttempt } from '@/entities/quiz/model/store'
import { ROUTES } from '@/shared/config/constants'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']
const ANSWER_REVEAL_MS = 1200

function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function scoreBadgeVariant(percent) {
  if (percent >= 80) return 'success'
  if (percent >= 50) return 'warning'
  return 'destructive'
}

export function TakeTestPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const quiz = useQuizForTest(testId)
  const checkAnswer = useCheckAnswer()
  const submitAttempt = useSubmitAttempt()

  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  // Re-shuffled only when the quiz identity or `shuffleSeed` changes (restart), never on
  // every render — `quiz` itself is a fresh object per Convex refresh, so memoizing on
  // it directly would reshuffle mid-quiz.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => (quiz ? shuffle(quiz.questions) : null), [quiz?.testId, shuffleSeed])

  const restart = () => {
    setShuffleSeed((seed) => seed + 1)
    setCurrentIndex(0)
    setAnswers([])
    setSelected(null)
    setResult(null)
  }

  if (quiz === undefined || questions === null) return null

  if (questions.length === 0) {
    return (
      <EmptyState icon={ListChecks} title="Savollar yo'q" description="Bu mavzuga hali savol qo'shilmagan." />
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  const handleSelect = async (index) => {
    if (selected || busy) return
    setBusy(true)
    const check = await checkAnswer(currentQuestion.id, index)
    const nextAnswers = [...answers, { questionId: currentQuestion.id, selectedIndex: index }]
    setSelected({ index, ...check })
    setAnswers(nextAnswers)

    setTimeout(async () => {
      if (isLast) {
        const finalResult = await submitAttempt(testId, nextAnswers)
        setResult(finalResult)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelected(null)
        setBusy(false)
      }
    }, ANSWER_REVEAL_MS)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Meter tone="progress" percent={(currentIndex / questions.length) * 100} label={`${currentIndex + 1}/${questions.length}-savol`} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="space-y-4 p-6">
              {currentQuestion.isCode ? (
                <CodeBlock code={currentQuestion.text} />
              ) : (
                <p className="text-lg font-semibold text-foreground">{currentQuestion.text}</p>
              )}
              {currentQuestion.imageUrl && (
                <img
                  src={currentQuestion.imageUrl}
                  alt="Savol rasmi"
                  className="max-h-64 w-full rounded-xl border border-border/60 object-contain"
                />
              )}

              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selected?.index === index
                  const isCorrectOption = selected && selected.correctIndex === index
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(index)}
                      disabled={Boolean(selected) || busy}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed',
                        !selected && 'border-border hover:border-primary/40 hover:bg-accent',
                        isSelected && selected.correct && 'border-success bg-success/15 text-success',
                        isSelected && !selected.correct && 'border-destructive bg-destructive/15 text-destructive',
                        !isSelected && isCorrectOption && 'border-success bg-success/10 text-success',
                        selected && !isSelected && !isCorrectOption && 'border-border opacity-50',
                      )}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                        {OPTION_LETTERS[index]}
                      </span>
                      <span className="min-w-0 flex-1">{option}</span>
                      {isSelected && (selected.correct ? <CheckCircle2 className="size-5 shrink-0" /> : <XCircle className="size-5 shrink-0" />)}
                      {!isSelected && isCorrectOption && <CheckCircle2 className="size-5 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </CardContent>

            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={cn(
                    'pointer-events-none absolute right-4 top-4 flex size-12 items-center justify-center rounded-full shadow-lg',
                    selected.correct ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground',
                  )}
                >
                  {selected.correct ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Dialog open={Boolean(result)} onOpenChange={(open) => !open && navigate(ROUTES.TESTS)}>
        <DialogContent className="text-center">
          {result && (
            <>
              <DialogHeader className="items-center text-center">
                <div
                  className={cn(
                    'mb-2 flex size-16 items-center justify-center rounded-full',
                    result.percent >= 50 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                  )}
                >
                  {result.percent >= 50 ? <CheckCircle2 className="size-8" /> : <XCircle className="size-8" />}
                </div>
                <DialogTitle className="text-2xl">Test yakunlandi!</DialogTitle>
                <DialogDescription>
                  {result.score} / {result.totalQuestions} ta savolga to'g'ri javob berdingiz
                </DialogDescription>
              </DialogHeader>
              <Badge variant={scoreBadgeVariant(result.percent)} className="mx-auto px-4 py-1.5 text-base">
                {result.percent}%
              </Badge>
              <DialogFooter className="sm:justify-center">
                <Button variant="outline" onClick={restart} className="gap-1.5">
                  <RotateCcw className="size-4" /> Qayta urinish
                </Button>
                <Button onClick={() => navigate(ROUTES.TESTS)}>Yopish</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
