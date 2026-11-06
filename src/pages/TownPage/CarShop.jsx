import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Check, Gauge, Loader2, Sparkles, Timer, TrendingUp, X } from 'lucide-react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { useTownActions } from '@/entities/town/model/store'
import { CAR_COLORS, CAR_COLOR_NAMES, CAR_MODELS, CAR_TIERS, formatMoney } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'
import { Car } from '@/pages/TownPage/scene/Car'

const TOP_SPEED = Math.max(...CAR_MODELS.map((c) => c.maxSpeed))

/** Slowly spinning turntable; the car "drops in" with a little bounce when the model changes. */
function Turntable({ model, color }) {
  const spin = useRef(null)
  const pop = useRef(null)
  const born = useRef({ model: null, at: 0 })
  useFrame((state, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.35
    if (pop.current) {
      if (born.current.model !== model) born.current = { model, at: state.clock.elapsedTime }
      const t = Math.min(1, (state.clock.elapsedTime - born.current.at) / 0.6)
      const e = 1 - Math.pow(1 - t, 3)
      pop.current.position.y = (1 - e) * 0.8
      pop.current.scale.setScalar(0.85 + e * 0.15)
    }
  })
  return (
    <group ref={spin}>
      <mesh position-y={0.04} receiveShadow>
        <cylinderGeometry args={[3.4, 3.5, 0.08, 64]} />
        <meshStandardMaterial color="#1a1f29" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position-y={0.085} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3.3, 3.4, 64]} />
        <meshBasicMaterial color="#60a5fa" toneMapped={false} />
      </mesh>
      <group ref={pop} position-y={0.09}>
        <Car model={model} color={color} />
      </group>
    </group>
  )
}

function Showroom({ model, color }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [6, 2.4, 6.5], fov: 34 }} gl={{ antialias: true }}>
      <color attach="background" args={['#0a0d14']} />
      <fog attach="fog" args={['#0a0d14', 13, 28]} />
      <ambientLight intensity={0.15} />
      <spotLight position={[0, 9, 0]} angle={0.55} penumbra={0.9} intensity={160} castShadow shadow-mapSize={[2048, 2048]} />
      <spotLight position={[7, 4, 5]} angle={0.5} penumbra={1} intensity={70} color="#ffe4c4" />
      <spotLight position={[-7, 3, -5]} angle={0.5} penumbra={1} intensity={60} color="#93c5fd" />
      {/* studio softboxes: these are what the paint and glass reflect */}
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 1.2, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#bfdbfe" position={[0, 2, -8]} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={3} color="#fde68a" position={[0, 3, 8]} scale={3} />
      </Environment>

      <Suspense fallback={null}>
        <Turntable model={model} color={color} />
      </Suspense>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={1024}
          mixBlur={1}
          mixStrength={28}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0e1117"
          metalness={0.6}
        />
      </mesh>
      <OrbitControls enablePan={false} minDistance={5.5} maxDistance={12} minPolarAngle={0.5} maxPolarAngle={Math.PI / 2.08} target={[0, 0.7, 0]} />
    </Canvas>
  )
}

function SpecBar({ icon: Icon, label, value, frac, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-white/70">
          <Icon className="size-3.5" /> {label}
        </span>
        <span className="font-black text-white tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${Math.max(4, frac * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
    </div>
  )
}

export function CarShop({ town, onClose }) {
  const actions = useTownActions()
  const current = town.me.car
  const [model, setModel] = useState(current?.model ?? 'sedan')
  const [color, setColor] = useState(current?.color ?? CAR_COLORS[6])
  const [busy, setBusy] = useState(false)
  const hasPlot = town.plots.some((p) => p.ownerId === town.me.id)
  const car = CAR_MODELS.find((c) => c.id === model)
  const tier = CAR_TIERS[car.tier]
  const tradeIn = current ? Math.round((CAR_MODELS.find((c) => c.id === current.model)?.price ?? 0) / 2) : 0
  const same = current?.model === model
  const unchanged = same && current?.color === color
  const cost = same ? 500 : car.price - tradeIn // negative = downgrade refund
  const zeroTo100 = 27.8 / car.accel

  const buy = async () => {
    setBusy(true)
    try {
      await actions.buyCar(model, color)
      playSound('engine')
      toast.success(same ? "Mashina yangi rangda! 🎨" : `${car.name} hovlingizda! 🔑`)
      onClose()
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-full w-full max-w-5xl overflow-hidden rounded-3xl bg-[#0a0d14] text-white shadow-2xl ring-1 ring-white/10 md:grid-cols-[1.45fr_1fr]"
      >
        {/* showroom */}
        <div className="relative h-64 sm:h-80 md:h-[540px]">
          <Showroom model={model} color={color} />
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-5">
            <AnimatePresence mode="wait">
              <motion.div key={model} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-widest uppercase" style={{ background: tier.color }}>
                  {car.tier}
                </span>
                <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{car.name}</h3>
                <p className="text-sm text-white/70">{car.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="pointer-events-none absolute bottom-3 left-5 text-xs font-semibold text-white/50">
            {CAR_COLOR_NAMES[color] ?? ''} • aylantirish uchun suring
          </p>
        </div>

        {/* configurator */}
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto border-t border-white/10 p-4 md:max-h-[540px] md:border-t-0 md:border-l md:p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-black tracking-wider text-white/80 uppercase">
              <Sparkles className="size-4 text-amber-400" /> Avtosalon
            </p>
            <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CAR_MODELS.map((c) => {
              const owned = current?.model === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    playSound('select')
                    setModel(c.id)
                  }}
                  className={cn(
                    'relative cursor-pointer overflow-hidden rounded-xl p-3 text-left ring-1 transition-all',
                    model === c.id ? 'bg-white/12 ring-2 ring-white' : 'bg-white/5 ring-white/10 hover:bg-white/10',
                  )}
                >
                  <span className="absolute inset-y-0 left-0 w-1" style={{ background: CAR_TIERS[c.tier].color }} />
                  <p className="text-sm font-black">{c.name}</p>
                  <p className="text-[11px] font-semibold text-white/50">{c.tier}</p>
                  <p className="mt-1 text-sm font-black text-emerald-400">{formatMoney(c.price)}</p>
                  {owned && (
                    <span className="absolute top-2 right-2 rounded bg-emerald-500 px-1.5 text-[10px] font-black">SIZDA</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-2.5 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
            <SpecBar icon={Gauge} label="Maks. tezlik" value={`${Math.round(car.maxSpeed * 3.6)} km/soat`} frac={car.maxSpeed / TOP_SPEED} color="#60a5fa" />
            <SpecBar icon={Timer} label="0–100 km/soat" value={`${zeroTo100.toFixed(1)} s`} frac={(1 / zeroTo100) / (19 / 27.8)} color="#f59e0b" />
            <SpecBar icon={TrendingUp} label="Taksi daromadi" value={car.fareBonus ? `+${Math.round(car.fareBonus * 100)}%` : 'oddiy'} frac={car.fareBonus / 0.6} color="#22c55e" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-white/60 uppercase">Rang • {CAR_COLOR_NAMES[color]}</p>
            <div className="flex flex-wrap gap-2">
              {CAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={CAR_COLOR_NAMES[c]}
                  aria-label={CAR_COLOR_NAMES[c]}
                  onClick={() => setColor(c)}
                  className={cn(
                    'relative size-8 cursor-pointer rounded-full shadow-inner ring-2 transition-transform hover:scale-110',
                    color === c ? 'ring-white' : 'ring-white/15',
                  )}
                  style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), ${c} 45%, ${c})` }}
                >
                  {color === c && <Check className="absolute inset-0 m-auto size-4 text-white mix-blend-difference" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-2 pt-1">
            {current && !same && (
              <p className="text-xs text-white/55">
                Eski mashinangiz {formatMoney(tradeIn)} ga hisobga olinadi.
              </p>
            )}
            <motion.button
              type="button"
              onClick={buy}
              disabled={!hasPlot || busy || unchanged || town.me.money < cost}
              whileTap={{ scale: 0.97 }}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-base font-black text-gray-950 shadow-lg shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : '🔑'}
              {unchanged ? 'Bu mashina sizda bor' : same ? `Rangini o'zgartirish • ${formatMoney(cost)}` : cost >= 0 ? `Sotib olish • ${formatMoney(cost)}` : `Almashtirish • +${formatMoney(-cost)} qaytadi`}
            </motion.button>
            {!hasPlot && <p className="text-center text-xs font-semibold text-rose-400">Mashina qo'yish uchun avval hovli sotib oling</p>}
            {hasPlot && !unchanged && town.me.money < cost && (
              <p className="text-center text-xs font-semibold text-rose-400">Yana {formatMoney(cost - town.me.money)} kerak — taksida ishlang!</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
