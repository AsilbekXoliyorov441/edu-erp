import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Megaphone, Square } from 'lucide-react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { ARCS, NX_ROADS, NZ_ROADS, OVERPASS, ROUNDABOUTS, SIDEWALK, STOP_BY_ID, X_ROADS, Z_ROADS, formatMoney } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'
import { driveInput, useDriveHud } from '@/pages/TownPage/drive/driveState'

function useNowTick(ms = 250) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function Speedometer() {
  const speed = useDriveHud((s) => s.speed)
  const maxKmh = useDriveHud((s) => s.maxKmh) || 100
  const frac = Math.min(1, speed / maxKmh)
  const r = 44
  const arc = Math.PI * r * 1.5
  return (
    <div className="relative flex size-32 items-center justify-center rounded-full bg-gray-950/75 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-[225deg]">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" strokeDasharray={`${arc} 999`} strokeLinecap="round" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={frac > 0.8 ? '#ef4444' : frac > 0.5 ? '#f59e0b' : '#22c55e'}
          strokeWidth="8"
          strokeDasharray={`${arc * frac} 999`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.1s linear' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-4xl leading-none font-black tabular-nums">{Math.round(speed)}</p>
        <p className="text-[10px] font-bold tracking-widest text-white/60">KM/SOAT</p>
      </div>
    </div>
  )
}

/** "Pick up at …" / "Drop off at …" card with a direction arrow and distance. */
export function TripCard({ trip, rideStartedAt, stats }) {
  const { x, z, heading, dist } = useDriveHud()
  const now = useNowTick()
  if (!trip) {
    return (
      <div className="rounded-2xl bg-gray-950/75 px-4 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-md">
        Yangi buyurtma qidirilmoqda…
      </div>
    )
  }
  const stop = STOP_BY_ID[trip.status === 'pickup' ? trip.fromStop : trip.toStop]
  const toTarget = Math.atan2(stop.x - x, stop.z - z)
  // Arrow angle relative to where the car is pointing (screen-up = forward).
  const rel = -(toTarget - heading)
  const elapsed = trip.status === 'ride' && rideStartedAt ? (now - rideStartedAt) / 1000 : 0
  const parLeft = Math.max(0, Math.ceil(trip.parSeconds - elapsed))
  const picking = trip.status === 'pickup'

  return (
    <motion.div
      key={`${trip.id}-${trip.status}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center gap-3 rounded-2xl bg-gray-950/80 py-2.5 pr-4 pl-2.5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md"
    >
      <div className={cn('flex size-14 shrink-0 items-center justify-center rounded-xl', picking ? 'bg-yellow-400 text-yellow-950' : 'bg-emerald-500 text-white')}>
        <ArrowUp className="size-9 transition-transform duration-150" strokeWidth={3} style={{ transform: `rotate(${rel}rad)` }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-wider text-white/60 uppercase">
          {picking ? "🙋 Yo'lovchini oling" : '📍 Manzilga eltib qo\'ying'}
        </p>
        <p className="truncate text-lg leading-tight font-black">{stop.name}</p>
        <p className="text-xs font-semibold text-white/75">
          {dist !== null ? `${Math.round(dist)} m` : '—'} • {formatMoney(trip.fare)}
          {!picking && (
            <span className={cn('ml-1.5 rounded px-1.5 py-0.5 font-black', parLeft > 0 ? 'bg-amber-400 text-amber-950' : 'bg-white/15 text-white/70')}>
              {parLeft > 0 ? `⚡ +30% bonus: ${parLeft}s` : 'bonus vaqti tugadi'}
            </span>
          )}
        </p>
      </div>
      <div className="ml-2 hidden border-l border-white/15 pl-3 text-right sm:block">
        <p className="text-[10px] font-bold text-white/60 uppercase">Safarlar</p>
        <p className="text-lg font-black tabular-nums">{stats.trips}</p>
      </div>
    </motion.div>
  )
}

const MAP_W = 220
const MAP_H = 120
/** Metres shown across the map: it follows the car, so the whole (big) world doesn't have to
 * fit in it. */
const S = MAP_W / 620
const w = (v) => Math.max(1.8, v * S)

/** The roads, drawn once in world coordinates × S. */
function MapRoads() {
  return (
    <g fill="#4b5563">
      {X_ROADS.map((r) => (
        <rect key={`x${r.z}`} x={-r.xMax * S} y={(r.z - r.w / 2 - SIDEWALK / 2) * S} width={r.xMax * 2 * S} height={w(r.w + SIDEWALK)} />
      ))}
      {Z_ROADS.map((r) => (
        <rect key={`z${r.x}:${r.z1}`} x={(r.x - r.w / 2) * S} y={r.z1 * S} width={w(r.w)} height={(r.z2 - r.z1) * S} />
      ))}
      {NX_ROADS.map((r) => (
        <rect key={`nx${r.z}:${r.x1}`} x={r.x1 * S} y={(r.z - r.w / 2) * S} width={(r.x2 - r.x1) * S} height={w(r.w)} />
      ))}
      {NZ_ROADS.map((r) => (
        <rect key={`nz${r.x}:${r.z1}`} x={(r.x - r.w / 2) * S} y={r.z1 * S} width={w(r.w)} height={(r.z2 - r.z1) * S} />
      ))}
      {ARCS.map((a) => (
        <path
          key={`a${a.cx}:${a.cz}`}
          d={`M ${(a.cx + a.sx * a.r) * S} ${a.cz * S} A ${a.r * S} ${a.r * S} 0 0 ${a.sx * a.sz > 0 ? 1 : 0} ${a.cx * S} ${(a.cz + a.sz * a.r) * S}`}
          fill="none"
          stroke="#4b5563"
          strokeWidth={w(a.w)}
        />
      ))}
      {ROUNDABOUTS.map((o) => (
        <circle key={`r${o.x}:${o.z}`} cx={o.x * S} cy={o.z * S} r={((o.outer + o.island) / 2) * S} fill="none" stroke="#4b5563" strokeWidth={w(o.outer - o.island)} />
      ))}
      {OVERPASS.xs.map((ox) => (
        <rect key={`o${ox}`} x={(ox - OVERPASS.half) * S} y={-OVERPASS.end * S} width={w(OVERPASS.half * 2)} height={OVERPASS.end * 2 * S} fill="#cbd5e1" rx="1" />
      ))}
    </g>
  )
}

export function MiniMap({ trip }) {
  const { x, z, heading } = useDriveHud()
  const stop = trip ? STOP_BY_ID[trip.status === 'pickup' ? trip.fromStop : trip.toStop] : null
  const deg = (-heading * 180) / Math.PI + 180
  const color = trip?.status === 'pickup' ? '#facc15' : '#22c55e'
  // the destination, relative to the car (map pixels); pinned to the edge when off the map
  let target = null
  if (stop) {
    const dx = (stop.x - x) * S
    const dz = (stop.z - z) * S
    const k = Math.min(1, (MAP_W / 2 - 8) / Math.max(Math.abs(dx), 0.001), (MAP_H / 2 - 8) / Math.max(Math.abs(dz), 0.001))
    target = { x: MAP_W / 2 + dx * k, y: MAP_H / 2 + dz * k, edge: k < 1 }
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-emerald-900/80 p-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
      <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <rect width={MAP_W} height={MAP_H} fill="#3f6b33" rx="8" />
        <g transform={`translate(${MAP_W / 2 - x * S} ${MAP_H / 2 - z * S})`}>
          <MapRoads />
        </g>
        {target && (
          <g>
            <circle cx={target.x} cy={target.y} r="7" fill={color} opacity="0.35">
              <animate attributeName="r" values="4;9;4" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={target.x} cy={target.y} r={target.edge ? 3 : 3.5} fill={color} stroke="#fff" strokeWidth="1" />
          </g>
        )}
        <g transform={`translate(${MAP_W / 2} ${MAP_H / 2}) rotate(${deg})`}>
          <path d="M0 -6 L4 4 L0 2 L-4 4 Z" fill="#ffffff" stroke="#111827" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}

function HoldButton({ control, children, className, label }) {
  const set = (v) => () => {
    driveInput[control] = v
  }
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        driveInput[control] = true
      }}
      onPointerUp={set(false)}
      onPointerCancel={set(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'flex touch-none items-center justify-center rounded-2xl bg-white/20 text-white shadow-xl ring-1 ring-white/25 backdrop-blur-md select-none active:bg-white/40',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** On-screen pedals and steering for phones/tablets. */
export function TouchControls() {
  return (
    <>
      <div className="pointer-events-auto absolute bottom-4 left-4 z-30 flex gap-3">
        <HoldButton control="left" label="Chapga" className="size-20">
          <ChevronLeft className="size-10" />
        </HoldButton>
        <HoldButton control="right" label="O'ngga" className="size-20">
          <ChevronRight className="size-10" />
        </HoldButton>
      </div>
      <div className="pointer-events-auto absolute right-4 bottom-4 z-30 flex items-end gap-3">
        <div className="flex flex-col gap-3">
          <HoldButton control="brake" label="Qo'l tormozi" className="h-14 w-20 bg-rose-500/40">
            <Square className="size-6 fill-current" />
          </HoldButton>
          <HoldButton control="down" label="Tormoz / orqaga" className="h-16 w-20">
            <ChevronDown className="size-10" />
          </HoldButton>
        </div>
        <HoldButton control="up" label="Gaz" className="h-36 w-20 bg-emerald-500/40">
          <ChevronUp className="size-12" />
        </HoldButton>
      </div>
    </>
  )
}

export function HornButton() {
  return (
    <button
      type="button"
      onClick={() => playSound('horn')}
      title="Signal (H)"
      aria-label="Signal"
      className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white/85 px-3 text-sm font-bold text-gray-900 shadow-lg backdrop-blur-md hover:bg-white"
    >
      <Megaphone className="size-4" /> <span className="hidden sm:inline">Signal</span>
    </button>
  )
}
