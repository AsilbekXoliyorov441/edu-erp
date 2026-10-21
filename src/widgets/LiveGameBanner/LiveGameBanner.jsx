import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Gamepad2, Play } from 'lucide-react'
import { useActiveGameForMe } from '@/entities/game/model/store'
import { playSound, unlockAudio } from '@/shared/lib/sound/gameSounds'
import { ROUTES } from '@/shared/config/constants'

/** Student-only strip shown on every page while their group has a live game, so nobody
 * misses the start — with a notification sound and toast the moment a new game opens.
 * Hidden on the game page itself. */
export function LiveGameBanner() {
  const game = useActiveGameForMe()
  const { pathname } = useLocation()
  const onGamePage = pathname.startsWith(`${ROUTES.GAMES}/`)
  const visible = game && !onGamePage
  const announcedId = useRef(null)

  useEffect(() => {
    const unlock = unlockAudio()
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (!game || game.id === announcedId.current) return
    announcedId.current = game.id
    if (onGamePage) return
    playSound('notify')
    toast("🎮 Jonli o'yin boshlandi!", { description: `${game.title} — hoziroq qo'shiling` })
  }, [game, onGamePage])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="game" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4">
          <Link
            to={ROUTES.game(game.id)}
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-lg shadow-blue-500/25"
          >
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Gamepad2 className="size-6" />
              <span className="absolute -top-0.5 -right-0.5 size-3 animate-ping rounded-full bg-rose-400" />
              <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-rose-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-extrabold">
                <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-black tracking-wider">LIVE</span>
                {game.title}
              </p>
              <p className="text-xs text-white/80">
                {game.status === 'lobby' ? "Ustoz o'yin xonasini ochdi — hoziroq qo'shiling!" : "O'yin davom etmoqda — qo'shiling!"}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-600 transition-transform group-hover:scale-105">
              <Play className="size-4 fill-current" /> Qo'shilish
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
