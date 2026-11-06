import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Check, Loader2, X } from 'lucide-react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { useTownActions } from '@/entities/town/model/store'
import { BUILDING_KINDS, PLOT_BY_ID, PLOT_SIZES, formatMoney, plotAllows, stageCost } from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'
import { Building } from '@/pages/TownPage/scene/Buildings'
import { buildingBox } from '@/pages/TownPage/scene/buildingInfo'

/** How tall the preview model is for each kind. */
const PREVIEW_FLOORS = { house: 2, shop: 2, apartment: 8, office: 25, hotel: 12, school: 3, mall: 3, stall: 1 }

function Spin({ children }) {
  const ref = useRef(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25
  })
  return <group ref={ref}>{children}</group>
}

function Preview({ kind, design }) {
  const floors = Math.min(PREVIEW_FLOORS[kind], BUILDING_KINDS[kind].maxFloors)
  const box = buildingBox(kind, design, floors)
  const dist = Math.max(22, box.h * 1.25, box.w * 1.4)
  return (
    <Canvas key={kind} dpr={[1, 2]} camera={{ position: [dist * 0.75, Math.max(8, box.h * 0.55), dist], fov: 35 }}>
      <color attach="background" args={['#cfe3f1']} />
      <hemisphereLight args={['#e0f2fe', '#65a30d', 0.7]} />
      <directionalLight position={[20, 30, 15]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 30, -30]} scale={[80, 30, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ffe2b8" position={[40, 15, 20]} rotation-y={-Math.PI / 3} scale={[40, 20, 1]} />
        <mesh scale={200}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshBasicMaterial color="#9cc3e6" side={1} />
        </mesh>
      </Environment>
      <Suspense fallback={null}>
        <Spin>
          <Building kind={kind} design={design} floors={floors} styleId="cream" />
        </Spin>
      </Suspense>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[Math.max(18, box.w * 0.8), 48]} />
        <meshStandardMaterial color="#8fbf6a" roughness={1} />
      </mesh>
      <OrbitControls enablePan={false} target={[0, box.h * 0.35, 0]} maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={dist * 2.2} />
    </Canvas>
  )
}

/** Step 1: what to build (house / shop / apartment / office). Step 2: its design.
 * Once something is built the kind is locked and only the design can change. */
export function BuildPlanner({ plotId, owned, onClose }) {
  const actions = useTownActions()
  const locked = owned.floors > 0
  const plot = PLOT_BY_ID[plotId]
  const firstOk = (id) => BUILDING_KINDS[id].designs.find((x) => plotAllows(plot, id, x.id))?.id
  const [kind, setKind] = useState(locked || owned.design ? owned.kind : (Object.keys(BUILDING_KINDS).find((id) => firstOk(id)) ?? 'house'))
  const k = BUILDING_KINDS[kind]
  const [design, setDesign] = useState(owned.kind === kind && owned.design ? owned.design : firstOk(kind))
  const [busy, setBusy] = useState(false)
  const d = k.designs.find((x) => x.id === design) ?? k.designs[0]

  const pickKind = (id) => {
    if (locked) return
    playSound('select')
    setKind(id)
    setDesign(firstOk(id))
  }

  const save = async () => {
    setBusy(true)
    try {
      await actions.setPlan(plotId, kind, d.id)
      playSound('powerUp')
      toast.success(locked ? 'Dizayn yangilandi! 🎨' : `${k.icon} ${k.name} • ${d.name} — endi 1-bosqich imtihonini topshiring!`)
      onClose()
    } catch (err) {
      toast.error(err?.data ?? 'Saqlanmadi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-full w-full max-w-5xl overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl md:grid-cols-[1.3fr_1fr] dark:bg-gray-950 dark:text-gray-100"
      >
        <div className="relative h-64 sm:h-80 md:h-[540px]">
          <Preview kind={kind} design={d.id} />
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-5 text-white">
            <AnimatePresence mode="wait">
              <motion.div key={`${kind}-${d.id}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p className="text-sm font-bold opacity-80">
                  {k.icon} {k.name}
                </p>
                <h3 className="text-3xl font-black">{d.name}</h3>
                <p className="text-sm opacity-85">{d.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-4 md:max-h-[540px] md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-black">{locked ? 'Dizaynni almashtirish' : 'Nima quramiz?'}</p>
              <p className="text-xs text-gray-500">
                Hovli №{plot.number} • {PLOT_SIZES[plot.size].name} ({plot.w}×{plot.d} m)
                {plot.only ? ` — ${plot.note ?? "bog'dagi joyga faqat do'kon yoki rasta quriladi"}` : plot.size === 'small' ? " — kichik hovliga faqat uy, do'kon va rasta sig'adi" : ''}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(BUILDING_KINDS).map(([id, b]) => (
              <button
                key={id}
                type="button"
                onClick={() => pickKind(id)}
                disabled={(locked && id !== kind) || !firstOk(id)}
                title={!firstOk(id) ? (b.minW && plot.w < b.minW ? `Kamida ${b.minW} m keng hovli kerak` : `${PLOT_SIZES[plot.size].name} hovliga sig'maydi`) : undefined}
                className={cn(
                  'cursor-pointer rounded-2xl border-2 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-35',
                  kind === id ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15' : 'border-gray-200 hover:border-blue-300 dark:border-gray-800',
                )}
              >
                <p className="text-2xl">{b.icon}</p>
                <p className="font-black">{b.name}</p>
                <p className="text-[11px] leading-tight text-gray-500">{b.desc}</p>
                <p className="mt-1 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  {b.maxFloors} qavatgacha{b.income ? ` • ${formatMoney(b.income)}/soat har qavat` : ''}
                </p>
                {!firstOk(id) && b.minW && plot.w < b.minW && <p className="text-[10px] font-bold text-rose-500">Kamida {b.minW} m keng hovli kerak</p>}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Dizayn</p>
            <div className="grid grid-cols-2 gap-2">
              {k.designs.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  disabled={!plotAllows(plot, kind, x.id)}
                  onClick={() => {
                    playSound('select')
                    setDesign(x.id)
                  }}
                  className={cn(
                    'relative cursor-pointer rounded-xl border-2 px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-35',
                    d.id === x.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15' : 'border-gray-200 hover:border-emerald-300 dark:border-gray-800',
                  )}
                >
                  <p className="text-sm font-black">{x.name}</p>
                  <p className="text-[11px] text-gray-500">{x.desc}</p>
                  {d.id === x.id && <Check className="absolute top-2 right-2 size-4 text-emerald-600" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-2 rounded-2xl bg-gray-50 p-3 text-xs dark:bg-gray-900">
            <p>
              <b>Qanday quriladi:</b> har bosqichda imtihon topshirasiz, har bosqich +{k.step} qavat.
            </p>
            <p>
              1-bosqich narxi: <b>{formatMoney(stageCost(kind, 0))}</b>
              {k.income ? ` • Qurilgach har soatda daromad keltiradi` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 font-black text-white shadow-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : k.icon} {locked ? 'Dizaynni saqlash' : 'Shu loyihani tanlash'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
