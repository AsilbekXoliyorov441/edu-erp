import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Gamepad2, Play } from 'lucide-react'
import { useActiveGameForMe } from '@/entities/game/model/store'
import { ROUTES } from '@/shared/config/constants'

/** Student-only strip shown on every page while their group has a live game, so nobody
 * misses the start. Hidden on the game page itself. */
export function LiveGameBanner() {
  const game = useActiveGameForMe()
  const { pathname } = useLocation()
  const visible = game && !pathname.startsWith(`${ROUTES.GAMES}/`)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4">
          <Link
            to={ROUTES.game(game.id)}
            className="flex items-center gap-3 rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-600"
          >
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Gamepad2 className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 size-3 animate-ping rounded-full bg-red-400" />
              <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-red-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Jonli o'yin: {game.title}</p>
              <p className="text-xs text-white/80">
                {game.status === 'lobby' ? "Ustoz o'yin xonasini ochdi — hoziroq qo'shiling!" : "O'yin davom etmoqda — qo'shiling!"}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-600">
              <Play className="size-4" /> Qo'shilish
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
