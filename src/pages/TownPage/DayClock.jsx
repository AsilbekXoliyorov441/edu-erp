import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { clockLabel, useClockStore } from '@/pages/TownPage/scene/dayNight'
import { cn } from '@/shared/lib/utils'

function fmt(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

/** HUD clock: day or night and the time until it switches. Staff can force day or night on
 * their own screen to preview it. */
export function DayClock({ staff }) {
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  const forced = useClockStore((s) => s.forced)
  const noNight = useClockStore((s) => s.noNight)
  const force = useClockStore((s) => s.force)
  const reset = useClockStore((s) => s.reset)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // back to the real clock when leaving the town
  useEffect(() => () => useClockStore.getState().reset(), [])

  const { isDay, name, msLeft } = clockLabel(now)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => staff && setOpen((v) => !v)}
        title={staff ? "Kun / tunni almashtirib ko'rish (faqat sizning ekraningizda)" : undefined}
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold shadow-lg ring-1 ring-black/5 backdrop-blur-md',
          isDay ? 'bg-sky-100/90 text-sky-900' : 'bg-indigo-950/85 text-indigo-100',
          staff && 'cursor-pointer',
        )}
      >
        <span className="text-base">{isDay ? '☀️' : '🌙'}</span>
        <span>{name}</span>
        {noNight && !forced ? null : msLeft !== null ? (
          <span className="text-xs font-semibold opacity-75 tabular-nums">
            {isDay ? 'tunga' : 'kunga'} {fmt(msLeft)}
          </span>
        ) : (
          <span className="rounded bg-amber-400 px-1 text-[10px] font-black text-amber-950">QO'LDA</span>
        )}
      </button>

      <AnimatePresence>
        {staff && open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-12 right-0 z-30 w-60 space-y-3 rounded-2xl bg-white p-3 text-gray-900 shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:text-gray-100"
          >
            <div>
              <p className="text-sm font-black">⏱️ Kun / tun</p>
              <p className="text-[11px] text-gray-500">Faqat sizning ekraningizda — o'quvchilar odatdagi vaqtni ko'radi.</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['day', '☀️ Kun'],
                ['night', '🌙 Tun'],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => force(mode)}
                  className={cn(
                    'h-9 cursor-pointer rounded-lg text-sm font-black',
                    forced === mode ? 'bg-amber-400 text-amber-950' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={!forced}
              className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-black text-white disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" /> Haqiqiy vaqtga qaytish
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
