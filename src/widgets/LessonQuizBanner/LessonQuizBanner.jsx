import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ListChecks, Play } from 'lucide-react'
import { useActiveLessonQuizForMe } from '@/entities/lesson-quiz/model/store'
import { LESSON_QUIZ, ROUTES } from '@/shared/config/constants'

/** Student-only strip on every page while the lesson Q&A is open and they haven't finished
 * it. The sound + toast come from the notification bell (a `lesson_quiz` notification). */
export function LessonQuizBanner() {
  const quiz = useActiveLessonQuizForMe()
  const { pathname } = useLocation()
  const onQuizPage = pathname === ROUTES.LESSON_QUIZ
  const pending = quiz && quiz.myStatus !== 'done'

  return (
    <AnimatePresence>
      {pending && !onQuizPage && (
        <motion.div key="lesson-quiz" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4">
          <Link
            to={ROUTES.LESSON_QUIZ}
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white shadow-lg shadow-emerald-500/25"
          >
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <ListChecks className="size-6" />
              <span className="absolute -top-0.5 -right-0.5 size-3 animate-ping rounded-full bg-amber-300" />
              <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-amber-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">Darsdagi savol-javob</p>
              <p className="truncate text-xs text-white/80">
                {quiz.myStatus === 'active'
                  ? 'Testni davom ettiring — vaqt ketmoqda!'
                  : `${LESSON_QUIZ.QUESTION_COUNT} ta savol, har biriga ${LESSON_QUIZ.SECONDS_PER_QUESTION} soniya · ${quiz.title}`}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-700 transition-transform group-hover:scale-105">
              <Play className="size-4 fill-current" /> {quiz.myStatus === 'active' ? 'Davom etish' : 'Boshlash'}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
