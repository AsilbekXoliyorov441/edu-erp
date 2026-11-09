import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Car as CarIcon,
  Gift,
  Hammer,
  Home,
  Loader2,
  Maximize2,
  Minimize2,
  MousePointerClick,
  Users,
  X,
} from 'lucide-react'
import { AnimatedNumber } from '@/shared/ui/animated-number'
import { playSound, unlockAudio } from '@/shared/lib/sound/gameSounds'
import { useTown, useTownActions, useTownQuiz } from '@/entities/town/model/store'
import { ROUTES } from '@/shared/config/constants'
import {
  HOUSE_STYLES,
  PLAYER_COLORS,
  PLOT_BY_ID,
  STOP_BY_ID,
  LEARN,
  TOWN,
  TOWN_PLOTS,
  BUILDING_KINDS,
  UPGRADE_PATH,
  upgradeOf,
  DISTRICTS,
  PLOT_SIZES,
  INCOME_CAP_H,
  SHOP_ITEMS,
  nextStage,
  pendingIncome,
  stageCost,
  formatMoney,
} from '@/shared/config/town'
import { cn } from '@/shared/lib/utils'
import { SoundToggle } from '@/pages/GamePage/gameUi'
import { TownScene } from '@/pages/TownPage/scene/TownScene'
import { CarShop } from '@/pages/TownPage/CarShop'
import { QuizModal } from '@/pages/TownPage/QuizModal'
import { LibraryPanel } from '@/pages/TownPage/LibraryPanel'
import { BuildPlanner } from '@/pages/TownPage/BuildPlanner'
import { IslamicBank } from '@/pages/TownPage/IslamicBank'
import { DayClock } from '@/pages/TownPage/DayClock'
import { BuyListedPlot, MarketPanel, SellPlotBox } from '@/pages/TownPage/MarketPanel'
import { HornButton, MiniMap, Speedometer, TouchControls, TripCard, WalkTouchControls } from '@/pages/TownPage/drive/DriveHud'
import { useDriveKeys, useIsTouch } from '@/pages/TownPage/drive/useDriveKeys'
import { useDriveHud } from '@/pages/TownPage/drive/driveState'
import { useWalk } from '@/pages/TownPage/drive/walkState'
import { detectGpu } from '@/pages/TownPage/scene/gpu'
import { useClockStore } from '@/pages/TownPage/scene/dayNight'

const QUALITY_KEY = 'coin-system:town-quality'
const QUALITIES = [
  { id: 'low', label: 'Past' },
  { id: 'medium', label: "O'rta" },
  { id: 'high', label: 'Yuqori' },
]

const PUBLIC_INFO = {
  park: "Shaharning yuragi — favvora, skameykalar va gullar. Bu yerda hamma uchrashadi.",
  bank: 'Foizsiz, halol moliya: sherikchilik sarmoyasi, qarzi hasana va zakot.',
  choyxona: "Osh va choy — kuch to'plang: kutubxonada pul ×1.5 ko'proq!",
  supermarket: "Qurilish to'plami oling — keyingi qurilish bosqichi 25% arzon.",
  restaurant: "Oilaviy kechki ovqat — taksi daromadi +25%.",
  library: "Bilim — boylik! Bu yerda ustozingiz bergan mavzulardan savol yechib pul ishlaysiz.",
}

/** Quality to start with: always "low" without a graphics card; otherwise the player's last
 * choice, or "medium". */
function readQuality() {
  if (detectGpu().software) return 'low'
  try {
    const saved = localStorage.getItem(QUALITY_KEY)
    if (saved) return saved
  } catch {
    // no storage: fall through to the device check
  }
  // weak phones (little memory or few cores) start on low; the player can still raise it
  const mem = navigator.deviceMemory
  const cores = navigator.hardwareConcurrency
  const phone = window.matchMedia?.('(pointer: coarse)').matches
  if (phone && ((mem && mem <= 4) || (cores && cores <= 4))) return 'low'
  return 'medium'
}

function useAction(fn) {
  const [busy, setBusy] = useState(false)
  const run = async (...args) => {
    setBusy(true)
    try {
      return await fn(...args)
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik yuz berdi')
      playSound('wrong')
      return undefined
    } finally {
      setBusy(false)
    }
  }
  return [run, busy]
}

/** 3:05 */
function fmtClock(ms) {
  const sec = Math.ceil(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function Glass({ className, children }) {
  return (
    <div className={cn('rounded-2xl bg-white/85 text-gray-900 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:bg-gray-900/85 dark:text-gray-100 dark:ring-white/10', className)}>
      {children}
    </div>
  )
}

function HudButton({ onClick, children, title, active, className, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        'flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-bold shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        active ? 'bg-blue-600 text-white' : 'bg-white/85 text-gray-900 hover:bg-white dark:bg-gray-900/85 dark:text-gray-100',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** A big thumb-sized button in the phone dock. */
function DockButton({ onClick, icon, label, tone = '', disabled = false, badge = null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-black tracking-tight tabular-nums transition-transform active:scale-95 disabled:opacity-60',
        tone || 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
      )}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="max-w-full truncate px-1">{label}</span>
      {badge && <span className="absolute -top-1 -right-1 rounded-full bg-yellow-400 px-1.5 text-[10px] font-black text-yellow-950">{badge}</span>}
    </button>
  )
}

/* ---------------------------------------------------------------- join ---------------- */

function JoinCard() {
  const actions = useTownActions()
  const [nickname, setNickname] = useState('')
  const [color, setColor] = useState(PLAYER_COLORS[5])
  const valid = TOWN.NICKNAME_RE.test(nickname.trim())
  const [join, joining] = useAction(async () => {
    await actions.join(nickname.trim(), color)
    playSound('fanfare')
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="w-full max-w-md"
    >
      <Glass className="space-y-5 p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg">
            <Building2 className="size-8" />
          </div>
          <h2 className="text-2xl font-black">Shaharchaga xush kelibsiz!</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Hovli sotib oling, uy quring, mashina oling. Boshlash uchun sizga <b>{formatMoney(TOWN.START_MONEY)}</b> beriladi.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) join()
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Username</span>
            <div className="flex h-12 items-center rounded-xl border-2 border-gray-200 bg-white px-3 focus-within:border-blue-500 dark:border-gray-700 dark:bg-gray-950">
              <span className="text-gray-400">@</span>
              <input
                autoFocus
                value={nickname}
                onChange={(e) => setNickname(e.target.value.replace(/\s/g, ''))}
                maxLength={16}
                placeholder="masalan: ali_2010"
                className="h-full flex-1 bg-transparent px-1 text-base font-semibold outline-none"
              />
            </div>
            <span className="text-xs text-gray-500">3–16 ta lotin harf, raqam yoki _</span>
          </label>
          <div className="space-y-1.5">
            <span className="text-sm font-semibold">Rangingiz</span>
            <div className="flex flex-wrap gap-2">
              {PLAYER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn('size-9 cursor-pointer rounded-full shadow transition-transform hover:scale-110', color === c && 'ring-4 ring-blue-500/50 ring-offset-2')}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={!valid || joining}
            whileTap={{ scale: 0.97 }}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {joining ? <Loader2 className="size-5 animate-spin" /> : <Home className="size-5" />} Shaharchaga kirish
          </motion.button>
        </form>
      </Glass>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- panels -------------- */

const BTN = 'flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl font-black text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50'

function fmtLeft(ms) {
  const min = Math.ceil(ms / 60_000)
  return min >= 60 ? `${Math.floor(min / 60)} soat ${min % 60} daq` : `${min} daq`
}

/** Choyxona / supermarket / restaurant: boosts for sale. */
function ShopItems({ place, me }) {
  const actions = useTownActions()
  const now = useNow(1000)
  const [buy, busy] = useAction(async (id) => {
    await actions.buyItem(id)
    playSound('cash')
    toast.success(`${SHOP_ITEMS[id].icon} ${SHOP_ITEMS[id].name} — ishtaha bilan!`)
  })
  const items = Object.entries(SHOP_ITEMS).filter(([, it]) => it.place === place)
  const active =
    place === 'supermarket'
      ? me.builderKits > 0 && `🧰 Sizda ${me.builderKits} ta qurilish to'plami`
      : place === 'restaurant'
        ? me.driverUntil > now && `🍽️ Taksi bonusi: yana ${fmtLeft(me.driverUntil - now)}`
        : me.scholarUntil > now && `🍛 Kutubxona ×1.5: yana ${fmtLeft(me.scholarUntil - now)}`
  return (
    <div className="space-y-2">
      {active && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{active}</p>}
      {items.map(([id, it]) => (
        <div key={id} className="flex items-center gap-3 rounded-xl bg-gray-100 p-2.5 dark:bg-gray-800">
          <span className="text-3xl">{it.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{it.name}</p>
            <p className="text-[11px] text-gray-500">{it.desc}</p>
          </div>
          <button type="button" disabled={busy || me.money < it.price} onClick={() => buy(id)} className="h-9 shrink-0 cursor-pointer rounded-lg bg-blue-600 px-3 text-xs font-black text-white disabled:opacity-40">
            {formatMoney(it.price)}
          </button>
        </div>
      ))}
    </div>
  )
}

/** The owner's view of their plot: plan → staged construction → income. */
function MyBuilding({ town, owned, plotId, onQuiz, onPlan }) {
  const actions = useTownActions()
  const now = useNow(1000)
  const me = town.me
  const kind = owned.kind ?? 'house'
  const k = BUILDING_KINDS[kind]
  const design = k.designs.find((d) => d.id === owned.design)
  const planned = owned.floors > 0 || !!owned.design
  const [build, building] = useAction(() => onQuiz('build', plotId))
  const [collect, collecting] = useAction(() => onQuiz('collect', plotId))
  const [restyle] = useAction((style) => actions.setStyle(plotId, style))
  const [upgrade, upgrading] = useAction(() => actions.upgradeKind(plotId))
  const cooldownLeft = Math.max(0, Math.ceil(((me.buildCooldownUntil ?? 0) - now) / 1000))

  if (!planned) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">Bu hovli bo'sh. Avval nima qurishni tanlang: uy, do'kon, turar-joy yoki biznes markaz.</p>
        <button type="button" onClick={onPlan} className={cn(BTN, 'h-12 bg-blue-600 hover:bg-blue-700')}>
          🏗️ Nima quramiz? — loyihani tanlash
        </button>
        <SellPlotBox plotId={plotId} owned={owned} />
      </div>
    )
  }

  const maxed = owned.floors >= k.maxFloors
  const upNext = maxed ? upgradeOf(PLOT_BY_ID[plotId], kind, owned.floors) : null
  const stage = nextStage(kind, owned.floors)
  const kit = me.builderKits > 0
  const cost = Math.round(stageCost(kind, owned.floors) * (kit ? 0.75 : 1))
  const pending = pendingIncome(kind, owned.floors, owned.lastCollectAt, now)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{k.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-black">
            {k.name} • {design?.name ?? 'Klassik'}
          </p>
          <p className="text-xs text-gray-500">
            {owned.floors} / {k.maxFloors} qavat
          </p>
        </div>
        <button type="button" onClick={onPlan} className="h-8 cursor-pointer rounded-lg bg-gray-100 px-2.5 text-xs font-bold hover:bg-gray-200 dark:bg-gray-800">
          🎨 Dizayn
        </button>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" animate={{ width: `${(owned.floors / k.maxFloors) * 100}%` }} />
      </div>

      {k.income > 0 && owned.floors > 0 && (
        <div className="space-y-1.5 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-200">💰 To'plangan daromad</span>
            <span className="text-emerald-700 dark:text-emerald-300">{formatMoney(k.income * owned.floors)}/soat</span>
          </div>
          <p className="text-xl font-black text-emerald-700 tabular-nums dark:text-emerald-300">{formatMoney(pending)}</p>
          <button type="button" onClick={collect} disabled={collecting || pending < 100} className={cn(BTN, 'h-10 bg-emerald-600 hover:bg-emerald-700')}>
            {collecting ? <Loader2 className="size-4 animate-spin" /> : '🧮'} Yig'ish — hisobchi savoli
          </button>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/70">To'g'ri javob — hammasi, xato — yarmi. {INCOME_CAP_H} soatdan ortig'i yig'ilmaydi.</p>
        </div>
      )}

      {maxed && upNext ? (
        <div className="space-y-2 rounded-xl bg-blue-50 p-3 dark:bg-blue-500/15">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
            🏆 {k.name} to'liq qurildi — {owned.floors} qavat! Endi uni {BUILDING_KINDS[upNext.kind].icon} {BUILDING_KINDS[upNext.kind].name.toLowerCase()}ga aylantirib, {BUILDING_KINDS[upNext.kind].maxFloors} qavatgacha davom ettirishingiz mumkin
            {BUILDING_KINDS[upNext.kind].income ? ` (har qavat ${formatMoney(BUILDING_KINDS[upNext.kind].income)}/soat daromad)` : ''}.
          </p>
          <button type="button" onClick={upgrade} disabled={upgrading} className={cn(BTN, 'h-11 bg-indigo-600 hover:bg-indigo-700')}>
            {upgrading ? <Loader2 className="size-4 animate-spin" /> : '⬆️'} {BUILDING_KINDS[upNext.kind].name}ga aylantirish
          </button>
        </div>
      ) : maxed ? (
        <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
          🏆 Bino eng baland darajaga yetdi — {k.maxFloors} qavat!
          {UPGRADE_PATH[kind] && " Kichik hovlida bundan baland qurib bo'lmaydi — o'rta yoki katta hovli oling."}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
            <p className="font-bold">
              🏗️ {stage}-bosqich: +{Math.min(k.step, k.maxFloors - owned.floors)} qavat
            </p>
            <p>
              {LEARN.examQuestions(stage)} ta savol, kamida {LEARN.examNeed(stage)} tasi to'g'ri bo'lsin. Yiqilsangiz pul ketmaydi.
              {kit && " 🧰 Qurilish to'plami: −25%"}
            </p>
          </div>
          <button type="button" onClick={build} disabled={me.money < cost || building || cooldownLeft > 0} className={cn(BTN, 'h-12 bg-blue-600 hover:bg-blue-700')}>
            {building ? <Loader2 className="size-5 animate-spin" /> : <Hammer className="size-5" />}
            {cooldownLeft > 0 ? `Qayta urinish: ${cooldownLeft} s` : `Imtihon • ${formatMoney(cost)}`}
          </button>
          {me.money < cost && (
            <button type="button" onClick={() => onQuiz('library')} className="w-full cursor-pointer text-center text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400">
              Yana {formatMoney(cost - me.money)} kerak — 📚 kutubxonada ishlang
            </button>
          )}
        </div>
      )}

      <SellPlotBox plotId={plotId} owned={owned} />
      {kind === 'house' && owned.floors > 0 && (owned.design ?? 'classic') !== 'modern' && owned.design !== 'villa' && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500">Rang</p>
          <div className="flex gap-2">
            {HOUSE_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                title={st.name}
                onClick={() => restyle(st.id)}
                className={cn('size-8 cursor-pointer overflow-hidden rounded-lg shadow ring-2 transition-transform hover:scale-110', owned.style === st.id ? 'ring-blue-500' : 'ring-transparent')}
                style={{ background: `linear-gradient(135deg, ${st.wall} 60%, ${st.roof} 60%)` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlotPanel({ town, plotId, onClose, onQuiz, onPlan }) {
  const actions = useTownActions()
  const plot = PLOT_BY_ID[plotId]
  const owned = town.plots.find((p) => p.plotId === plotId) ?? null
  const isMine = owned && owned.ownerId === town.me.id
  const money = town.me.money

  const [buy, buying] = useAction(async () => {
    await actions.buyPlot(plotId)
    playSound('cash')
    toast.success(`№${plot.number} hovli endi sizniki! Endi nima qurishni tanlang 🏗️`)
  })
  const [study, studying] = useAction(() => onQuiz('library'))

  if (!plot) return null

  let body
  if (plot.public) {
    const kind = plot.public.kind
    body = (
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">{PUBLIC_INFO[kind]}</p>
        {kind === 'library' && (
          <>
            <button type="button" onClick={study} disabled={studying} className={cn(BTN, 'h-12 bg-emerald-600 hover:bg-emerald-700')}>
              {studying ? <Loader2 className="size-5 animate-spin" /> : '📚'} Savol yechib pul ishlash
            </button>
            <p className="text-xs text-gray-500">
              Yangi savol — {formatMoney(LEARN.NEW_REWARD)}, takror — {formatMoney(LEARN.REPEAT_REWARD)}, ketma-ket to'g'ri javoblarga bonus.
            </p>
          </>
        )}
        {kind === 'bank' && <IslamicBank me={town.me} economy={town.economy} />}
        {(kind === 'choyxona' || kind === 'supermarket' || kind === 'restaurant') && <ShopItems place={kind} me={town.me} />}
      </div>
    )
  } else if (!owned) {
    const enough = money >= plot.price
    body = (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Joylashuv" value={plot.row === 'F' ? 'Asosiy ko\'cha' : "Orqa ko'cha"} />
          <Stat label="Maydon" value={`${plot.w}×${plot.d} m`} />
        </div>
        <p className="text-xs text-gray-500">Bu yerga uy, do'kon, turar-joy yoki 100 qavatli biznes markaz qurish mumkin.</p>
        <button type="button" onClick={buy} disabled={!enough || buying} className={cn(BTN, 'h-12 bg-emerald-600 hover:bg-emerald-700')}>
          {buying ? <Loader2 className="size-5 animate-spin" /> : '🏡'} Sotib olish • {formatMoney(plot.price)}
        </button>
        {!enough && <p className="text-center text-xs font-semibold text-rose-600">Yana {formatMoney(plot.price - money)} kerak</p>}
      </div>
    )
  } else if (!isMine) {
    const k = BUILDING_KINDS[owned.kind ?? 'house']
    body = (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Egasi" value={`@${owned.ownerName}`} />
          <Stat label={`${k.icon} ${k.name}`} value={owned.floors ? `${owned.floors} qavatli` : 'Poydevor'} />
        </div>
        {owned.salePrice && <BuyListedPlot plotId={plotId} owned={owned} money={money} />}
      </div>
    )
  } else {
    body = <MyBuilding town={town} owned={owned} plotId={plotId} onQuiz={onQuiz} onPlan={onPlan} />
  }

  const title = plot.public ? plot.public.name : `Hovli №${plot.number}`
  return (
    <motion.div
      key={plotId}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="pointer-events-auto max-h-[70vh] w-full overflow-y-auto rounded-2xl sm:w-80"
    >
      <Glass className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-black">{title}</p>
            {owned && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <span className="size-2 rounded-full" style={{ background: owned.ownerColor }} />
                {isMine ? 'Sizning hovlingiz' : `@${owned.ownerName}`}
              </p>
            )}
            {!owned && !plot.public && <p className="text-xs font-bold text-emerald-600">Sotuvda</p>}
            {!plot.public && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                <span className="h-2.5 w-4 rounded-sm" style={{ background: DISTRICTS[plot.district].color }} />
                {DISTRICTS[plot.district].name} • {PLOT_SIZES[plot.size].name} {plot.w}×{plot.d} m
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="size-4" />
          </button>
        </div>
        {body}
      </Glass>
    </motion.div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  )
}

function Residents({ town, onPick }) {
  const list = [...town.players].sort((a, b) => b.floors - a.floors || b.learnCorrect - a.learnCorrect || b.plots - a.plots)
  return (
    <Glass className="pointer-events-auto max-h-80 w-64 overflow-y-auto p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-black">
        <Users className="size-4" /> Aholi • {town.players.length}
      </p>
      <div className="space-y-1">
        {list.map((p, i) => {
          const firstPlot = town.plots
            .filter((x) => x.ownerId === p.id)
            .map((x) => PLOT_BY_ID[x.plotId])
            .sort((a, b) => a.number - b.number)[0]
          return (
            <button
              key={p.id}
              type="button"
              disabled={!firstPlot}
              onClick={() => firstPlot && onPick(firstPlot.id)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-100 disabled:cursor-default dark:hover:bg-gray-800"
            >
              <span className="w-4 text-xs font-bold text-gray-400">{i + 1}</span>
              <span className="size-3 rounded-full" style={{ background: p.color }} />
              <span className={cn('min-w-0 flex-1 truncate font-semibold', p.id === town.me.id && 'text-blue-600')}>@{p.nickname}</span>
              <span className="text-xs text-gray-500">
                🧠{p.learnCorrect} {p.plots}🏡 {p.floors}🧱 {p.car ? '🚗' : ''}
              </span>
            </button>
          )
        })}
      </div>
    </Glass>
  )
}

/* ---------------------------------------------------------------- page ---------------- */

export function TownPage() {
  const town = useTown()
  const actions = useTownActions()
  const sceneRef = useRef(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  // no graphics card: low quality (above) and day all the time
  useEffect(() => {
    if (!detectGpu().software) return
    useClockStore.getState().setNoNight(true)
    toast.info("Video karta topilmadi — o'yin past sifatda ishlaydi, tun rejimi o'chirildi", { id: 'town-gpu' })
  }, [])
  // the city is prepared behind a loading screen first, so it doesn't stutter afterwards
  const [sceneReady, setSceneReady] = useState(false)
  const markReady = useCallback(() => setSceneReady(true), [])
  useEffect(() => {
    // never keep anyone waiting longer than this
    const id = setTimeout(() => setSceneReady(true), 12000)
    return () => clearTimeout(id)
  }, [])
  const rootRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [quality, setQuality] = useState(readQuality)
  const [carShop, setCarShop] = useState(false)
  const [showResidents, setShowResidents] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [driving, setDriving] = useState(false)
  // walking around on foot (no fuel needed)
  const [walking, setWalking] = useState(null)
  const walkDoor = useWalk((st) => st.door)
  const walkInside = useWalk((st) => st.inside)
  const walkNearLift = useWalk((st) => st.nearLift)
  const [liftOpen, setLiftOpen] = useState(false)
  const walkAsk = useWalk((st) => st.ask)
  // E: go in / come out through a door, or call the lift
  useEffect(() => {
    if (!walking) return undefined
    const onKey = (e) => {
      if (e.code !== 'KeyE' || e.repeat) return
      const st = useWalk.getState()
      if (st.inside && st.nearLift) setLiftOpen(true)
      else if (st.door && st.inside) st.ask({ type: 'exit' })
      else if (st.door) st.ask({ type: 'enter', id: st.door })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [walking])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [planFor, setPlanFor] = useState(null)
  const [marketOpen, setMarketOpen] = useState(false)
  const [spawn, setSpawn] = useState(null)
  const [rideStartedAt, setRideStartedAt] = useState(null)
  const isTouch = useIsTouch()
  const now = useNow(1000)
  const quiz = useTownQuiz()
  const quizOpen = !!quiz
  const [fuelSync, setFuelSync] = useState({ ms: 0, at: 0 })
  useDriveKeys((driving || !!walking) && !quizOpen)

  useEffect(() => {
    const unlock = unlockAudio()
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      document.body.style.cursor = ''
    }
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const [claim, claiming] = useAction(async () => {
    await actions.claimBonus()
    playSound('cash')
    toast.success(`+${formatMoney(TOWN.DAILY_BONUS)} kunlik bonus!`)
  })

  const changeQuality = (q) => {
    setQuality(q)
    try {
      localStorage.setItem(QUALITY_KEY, q)
    } catch {
      /* noop */
    }
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else rootRef.current?.requestFullscreen?.()
  }

  const me = town?.me
  const myFirstPlot = me
    ? town.plots
        .filter((p) => p.ownerId === me.id)
        .map((p) => PLOT_BY_ID[p.plotId])
        .sort((a, b) => a.number - b.number)[0]
    : null
  const bonusReady = me && now >= me.nextBonusAt
  const bonusIn = me ? Math.max(0, me.nextBonusAt - now) : 0
  const freePlots = TOWN_PLOTS.filter((p) => !p.public).length - (town?.plots.length ?? 0)

  const pick = useCallback(
    (id) => {
      if (id) playSound('select')
      setSelectedId(id)
    },
    [setSelectedId],
  )

  const listingCount = me
    ? town.plots.filter((p) => p.salePrice && p.ownerId !== me.id).length +
      town.players.filter((p) => p.carSalePrice && p.id !== me.id).length
    : 0

  // "Your plot sold!" — announce sales that happen while the page is open.
  const seenSales = useRef(null)
  const sales = me?.sales
  useEffect(() => {
    if (!sales) return
    if (seenSales.current === null) {
      seenSales.current = new Set(sales.map((x) => x.id))
      return
    }
    for (const sale of sales) {
      if (seenSales.current.has(sale.id)) continue
      seenSales.current.add(sale.id)
      playSound('cash')
      toast.success(`🤝 @${sale.buyer} sizdan ${sale.label} ni ${formatMoney(sale.price)} ga sotib oldi!`)
    }
  }, [sales])

  /* ------------------------------------------------------------ taxi --------------- */
  const startQuiz = (kind, plotId, topicKey) =>
    actions.quizStart(kind, plotId, topicKey).catch((err) => {
      toast.error(err?.data ?? "Boshlab bo'lmadi")
    })

  const trip = me?.trip ?? null

  const requestRide = (near) =>
    actions.taxiRequest(near).catch((err) => toast.error(err?.data ?? 'Buyurtma olinmadi'))

  const startTaxi = () => {
    if (!me.car || !myFirstPlot) {
      toast.error('Taksi uchun avval hovli va mashina kerak')
      setCarShop(true)
      return
    }
    if (me.fuelMs <= 0) {
      toast("⛽ Mashina haydash uchun avval test ishlab yoqilg'i oling — har to'g'ri javob 1 daqiqa!")
      startQuiz('fuel')
      return
    }
    const stop = STOP_BY_ID[myFirstPlot.id]
    setSpawn({ x: stop.x, z: stop.z, heading: Math.PI / 2 })
    setSelectedId(null)
    setShowResidents(false)
    setDriving(true)
    toast('🚕 Taksi ishga tushdi! Sariq nurga boring — yo\'lovchi kutyapti.')
    if (!trip) requestRide({ x: stop.x, z: stop.z })
  }

  /** Get out and walk: from your own house, or from the centre of town. */
  const startWalk = () => {
    const stop = myFirstPlot ? STOP_BY_ID[myFirstPlot.id] : null
    const spawn = stop ? { x: stop.walkX ?? stop.x, z: stop.walkZ ?? stop.z, heading: stop.walkZ > stop.z ? 0 : Math.PI } : { x: 0, z: 30, heading: Math.PI }
    setSelectedId(null)
    setShowResidents(false)
    setMobileMenu(false)
    setWalking({ spawn, color: me.color })
    toast("🚶 Piyoda! Yurish: ↑ / W, burilish: ← → / A D, yugurish: Shift")
  }

  const onArrive = async (kind) => {
    if (!trip) return
    try {
      if (kind === 'pickup') {
        await actions.taxiPickup(trip.id)
        playSound('door')
        setRideStartedAt(null)
        toast(`🙋 Yo'lovchi o'tirdi! Manzil: ${STOP_BY_ID[trip.toStop].name}. U sizga savol beryapti…`)
        startQuiz('passenger')
      } else {
        const res = await actions.taxiDropoff(trip.id)
        playSound('door')
        setTimeout(() => playSound('cash'), 250)
        setRideStartedAt(null)
        toast.success(
          `+${formatMoney(res.fare)}${res.tip ? ' 🙋 choychaqa bilan!' : ''}${res.fast ? ' ⚡ Tez yetkazdingiz, +30%!' : ''}`,
        )
        setTimeout(() => {
          const { x, z } = useDriveHud.getState()
          requestRide({ x, z })
        }, 1800)
      }
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik yuz berdi')
    }
  }

  /* Fuel: the engine runs (and fuel burns, charged by the server) only while driving with no
     question on screen. Out of fuel → back to the town and straight into a fuel quiz. */
  useEffect(() => {
    if (!driving || quizOpen) return undefined
    let alive = true
    const sync = (ms) => {
      if (!alive) return
      setFuelSync({ ms, at: Date.now() })
      if (ms <= 0) {
        setDriving(false)
        toast.error("⛽ Benzin tugadi! Test ishlab yoqilg'i oling.")
        actions.quizStart('fuel').catch(() => {})
      }
    }
    actions
      .driveStart()
      .then(sync)
      .catch((err) => {
        toast.error(err?.data ?? 'Mashina yurmadi')
        setDriving(false)
      })
    const id = setInterval(() => actions.driveTick().then(sync).catch(() => {}), 10_000)
    return () => {
      alive = false
      clearInterval(id)
      actions.driveStop().catch(() => {})
    }
    // actions are recreated each render; the effect should follow driving / pause only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driving, quizOpen])

  const fuelShown = driving && !quizOpen && fuelSync.at ? Math.max(0, fuelSync.ms - (now - fuelSync.at)) : (me?.fuelMs ?? 0)

  const onRedLight = async () => {
    playSound('wrong')
    try {
      const fine = await actions.trafficFine()
      toast.error(`🚦 Qizil chiroqda o'tdingiz! Jarima −${formatMoney(fine)}`)
    } catch {
      /* noop */
    }
  }
  // The 3D scene gets stable callbacks that forward to the latest handlers, so the clock
  // ticking in the HUD never makes the whole scene re-render.
  const handlers = useRef({ onArrive, onRedLight })
  useEffect(() => {
    handlers.current = { onArrive, onRedLight }
  })
  const stableArrive = useCallback((...a) => handlers.current.onArrive(...a), [])
  const stableRedLight = useCallback(() => handlers.current.onRedLight(), [])

  const car = me?.car
  const drive = useMemo(() => {
    if (!driving || !car || !spawn) return null
    const stop = trip ? STOP_BY_ID[trip.status === 'pickup' ? trip.fromStop : trip.toStop] : null
    return {
      car,
      spawn,
      trip,
      target: stop ? { x: stop.x, z: stop.z, kind: trip.status, key: `${trip.id}:${trip.status}` } : null,
      onArrive: stableArrive,
      onRedLight: stableRedLight,
    }
  }, [driving, car, spawn, trip, stableArrive, stableRedLight])

  /** Select a plot and fly the camera to it. */
  const focus = (id) => {
    pick(id)
    sceneRef.current?.flyTo(id)
  }

  // the phone menu's buttons
  const runMenu = (key) => {
    setMobileMenu(false)
    if (key === 'walk') startWalk()
    else if (key === 'cars') setCarShop(true)
    else if (key === 'home') {
      if (myFirstPlot) focus(myFirstPlot.id)
      else sceneRef.current?.home()
    } else if (key === 'tour') sceneRef.current?.tour()
    else if (key === 'market') setMarketOpen(true)
    else if (key === 'people') setShowResidents((v) => !v)
    else if (key === 'full') toggleFullscreen()
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative isolate overflow-hidden bg-sky-200 shadow-2xl',
        fullscreen
          ? 'h-screen w-screen'
          : // phones: the game takes the whole screen like an app; desktop: a card in the page
            'max-sm:fixed max-sm:inset-0 max-sm:z-[60] max-sm:h-[100dvh] max-sm:w-screen sm:h-[calc(100dvh-8.5rem)] sm:min-h-[520px] sm:rounded-3xl',
      )}
    >
      <Suspense fallback={null}>
        {town !== undefined && (
          <TownScene
            ref={sceneRef}
            town={town}
            selectedId={selectedId}
            onSelect={pick}
            quality={quality}
            showcase={!me}
            drive={drive}
            walk={walking}
            key={me ? 'play' : 'showcase'}
            onReady={markReady}
          />
        )}
      </Suspense>

      {town === undefined && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sky-900">
          <Loader2 className="size-8 animate-spin" />
          <p className="font-semibold">Shaharcha yuklanmoqda…</p>
        </div>
      )}
      <AnimatePresence>
        {town !== undefined && !sceneReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky-200 to-emerald-100 text-sky-950"
          >
            <p className="text-4xl">🏙️</p>
            <p className="text-xl font-black">Shahar tayyorlanmoqda…</p>
            <div className="h-2.5 w-64 overflow-hidden rounded-full bg-white/70 shadow-inner">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" initial={{ width: '4%' }} animate={{ width: '96%' }} transition={{ duration: 6, ease: 'easeOut' }} />
            </div>
            <p className="max-w-xs text-center text-sm opacity-80">Binolar, yo'llar va chiroqlar oldindan yuklanmoqda — keyin o'yin silliq ishlaydi.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            to={ROUTES.GAMES}
            aria-label="Orqaga"
            className="flex size-10 items-center justify-center rounded-xl bg-white/85 text-gray-900 shadow-lg backdrop-blur-md hover:bg-white dark:bg-gray-900/85 dark:text-gray-100"
          >
            <ArrowLeft className="size-5" />
          </Link>
          {me && (
            <Glass className="flex h-10 items-center gap-2 px-3">
              <span className="size-3 rounded-full ring-2 ring-white" style={{ background: me.color }} />
              <span className="hidden text-sm font-bold sm:inline">@{me.nickname}</span>
              <span className="mx-1 hidden h-5 w-px bg-gray-300 sm:block dark:bg-gray-700" />
              <span className="text-base font-black text-emerald-600 tabular-nums">
                <AnimatedNumber value={me.money} formatter={formatMoney} />
              </span>
              {me.scholarUntil > now && <span title="Kutubxona ×1.5">🍛</span>}
              {me.driverUntil > now && <span title="Taksi +25%">🍽️</span>}
              {me.builderKits > 0 && <span title="Qurilish to'plami">🧰{me.builderKits}</span>}
            </Glass>
          )}
        </div>
        {me && driving && (
          <div className="pointer-events-auto flex items-center gap-2">
            <HornButton />
            <div className="hidden sm:block">
              <DayClock staff={!!town.viewer?.staff} />
            </div>
            <SoundToggle className="bg-white/85 text-gray-900 shadow-lg hover:bg-white" />
            <div className="hidden sm:block">
              <HudButton onClick={toggleFullscreen} title="To'liq ekran">
                {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </HudButton>
            </div>
            <HudButton onClick={() => setDriving(false)} title="Taksidan chiqish" className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600">
              <X className="size-4" /> Chiqish
            </HudButton>
          </div>
        )}
        {me && !driving && !walking && (
          <div className="pointer-events-auto flex items-center gap-2 sm:hidden">
            <DayClock staff={!!town.viewer?.staff} />
            <SoundToggle className="bg-white/85 text-gray-900 shadow-lg hover:bg-white dark:bg-gray-900/85 dark:text-gray-100" />
          </div>
        )}
        {me && !driving && !walking && (
          <div className="pointer-events-auto hidden flex-wrap items-center justify-end gap-2 sm:flex">
            <HudButton onClick={() => setLibraryOpen(true)} title="Kutubxona: savol yechib pul ishlash" className="bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-white">
              📚 <span className="hidden sm:inline">Kutubxona</span>
            </HudButton>
            <HudButton onClick={() => startQuiz('fuel')} title="Yoqilg'i: test ishlab haydash vaqti oling" className={fuelShown <= 0 ? 'bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-500' : ''}>
              ⛽ <span className="tabular-nums">{fmtClock(fuelShown)}</span>
            </HudButton>
            <HudButton onClick={startTaxi} title="Taksi bo'lib ishlash" className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300 dark:bg-yellow-400 dark:text-yellow-950">
              🚕 Taksi
            </HudButton>
            <HudButton onClick={startWalk} title="Piyoda shaharni aylanish">
              🚶 <span className="hidden sm:inline">Piyoda</span>
            </HudButton>
            <HudButton onClick={claim} disabled={!bonusReady || claiming} title="Kunlik bonus" className={bonusReady ? 'animate-pulse bg-amber-400 text-amber-950 hover:bg-amber-300 dark:bg-amber-400 dark:text-amber-950' : ''}>
              <Gift className="size-4" />
              {bonusReady ? `+${formatMoney(TOWN.DAILY_BONUS)}` : `${Math.ceil(bonusIn / 3_600_000)} soat`}
            </HudButton>
            <HudButton onClick={() => setCarShop(true)} title="Avtosalon">
              <CarIcon className="size-4" /> <span className="hidden sm:inline">Avtosalon</span>
            </HudButton>
            <HudButton
              onClick={() => {
                if (myFirstPlot) focus(myFirstPlot.id)
                else sceneRef.current?.home()
              }}
              title={myFirstPlot ? 'Mening uyim' : 'Shahar markazi'}
            >
              <Home className="size-4" /> <span className="hidden sm:inline">{myFirstPlot ? 'Uyim' : 'Markaz'}</span>
            </HudButton>
            <HudButton onClick={() => sceneRef.current?.tour()} title="Yangi O'zbekiston: bog', monument, stadion, bolalar bog'i, masjid">
              🏛️ <span className="hidden sm:inline">Yangi O'zbekiston</span>
            </HudButton>
            <HudButton onClick={() => setMarketOpen(true)} title="Bozor: o'yinchilar sotayotgan hovli va mashinalar">
              🏷️ <span className="hidden sm:inline">Bozor</span>
              {listingCount > 0 && <span className="rounded-full bg-yellow-400 px-1.5 text-[11px] font-black text-yellow-950">{listingCount}</span>}
            </HudButton>
            <HudButton onClick={() => setShowResidents((v) => !v)} active={showResidents} title="Aholi">
              <Users className="size-4" />
            </HudButton>
            <div className="flex h-10 items-center rounded-xl bg-white/85 p-1 shadow-lg backdrop-blur-md dark:bg-gray-900/85">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => changeQuality(q.id)}
                  title={`Grafika: ${q.label}`}
                  className={cn('h-8 cursor-pointer rounded-lg px-2 text-xs font-bold', quality === q.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300')}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <DayClock staff={!!town.viewer?.staff} />
            <SoundToggle className="bg-white/85 text-gray-900 shadow-lg hover:bg-white dark:bg-gray-900/85 dark:text-gray-100" />
            <HudButton onClick={toggleFullscreen} title="To'liq ekran">
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </HudButton>
          </div>
        )}
      </div>

      {/* taxi HUD */}
      {me && driving && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
            <TripCard trip={trip} rideStartedAt={rideStartedAt ?? trip?.pickedAt} stats={{ trips: me.taxiTrips }} />
          </div>
          <div className="pointer-events-none absolute top-16 right-3 z-20 hidden lg:block">
            <MiniMap trip={trip} />
          </div>
          <div className={cn('pointer-events-none absolute z-20', isTouch ? 'bottom-44 left-1/2 -translate-x-1/2 scale-75' : 'bottom-4 left-1/2 -translate-x-1/2')}>
            <div className="flex items-end gap-3">
              <Speedometer />
              <div
                className={cn(
                  'mb-2 rounded-2xl px-3 py-2 text-center text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md',
                  fuelShown < 60_000 ? 'animate-pulse bg-rose-600/90' : 'bg-gray-950/75',
                )}
              >
                <p className="text-[10px] font-bold tracking-widest text-white/60">⛽ YOQILG'I</p>
                <p className="text-xl font-black tabular-nums">{fmtClock(fuelShown)}</p>
              </div>
            </div>
          </div>
          {isTouch ? (
            <TouchControls />
          ) : (
            <Glass className="pointer-events-none absolute bottom-4 left-4 z-20 space-y-0.5 p-3 text-xs">
              <p className="font-bold">Boshqaruv</p>
              <p><b>W / ↑</b> gaz • <b>S / ↓</b> tormoz, orqaga</p>
              <p><b>A D / ← →</b> rul • <b>Space</b> qo'l tormozi</p>
              <p><b>H</b> signal • nurga kelib <b>to'xtang</b></p>
            </Glass>
          )}
        </>
      )}

      {/* walking HUD */}
      {me && walking && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="pointer-events-auto flex gap-2">
              <SoundToggle className="bg-white/85 text-gray-900 shadow-lg hover:bg-white" />
              <HudButton
                onClick={() => {
                  setLiftOpen(false)
                  setWalking(null)
                }}
                title="Piyoda rejimidan chiqish" className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600">
                <X className="size-4" /> Chiqish
              </HudButton>
            </div>
          </div>
          <div className="pointer-events-none absolute top-16 right-3 z-20 hidden sm:block">
            <MiniMap trip={null} />
          </div>
          {/* doors, floors and the lift */}
          <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-2 px-3">
            {walkInside && (
              <Glass className="px-4 py-2 text-sm font-black">
                🏢 {walkInside.floor === 0 ? 'Birinchi qavat' : `${walkInside.floor + 1}-qavat`} <span className="font-semibold text-gray-500">/ {walkInside.floors}</span>
              </Glass>
            )}
            <div className="pointer-events-auto flex gap-2">
              {walkDoor && !walkInside && (
                <button type="button" onClick={() => walkAsk({ type: 'enter', id: walkDoor })} className="h-12 cursor-pointer rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-xl active:scale-95">
                  🚪 Ichkariga kirish {!isTouch && <span className="opacity-70">(E)</span>}
                </button>
              )}
              {walkDoor && walkInside && (
                <button type="button" onClick={() => walkAsk({ type: 'exit' })} className="h-12 cursor-pointer rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-xl active:scale-95">
                  🚪 Tashqariga chiqish {!isTouch && <span className="opacity-70">(E)</span>}
                </button>
              )}
              {walkInside && walkNearLift && (
                <button type="button" onClick={() => setLiftOpen(true)} className="h-12 cursor-pointer rounded-2xl bg-slate-800 px-5 text-sm font-black text-white shadow-xl active:scale-95">
                  🛗 Lift {!isTouch && <span className="opacity-70">(E)</span>}
                </button>
              )}
            </div>
          </div>
          <AnimatePresence>
            {liftOpen && walkInside && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setLiftOpen(false)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-3xl bg-slate-900 p-4 text-white shadow-2xl">
                  <p className="text-lg font-black">🛗 Qaysi qavatga?</p>
                  <div className="grid max-h-[50vh] grid-cols-5 gap-2 overflow-y-auto">
                    {Array.from({ length: walkInside.floors }, (_, f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setLiftOpen(false)
                          walkAsk({ type: 'floor', floor: f })
                        }}
                        className={cn('h-12 cursor-pointer rounded-xl text-sm font-black tabular-nums active:scale-95', f === walkInside.floor ? 'bg-amber-400 text-amber-950' : 'bg-slate-700 hover:bg-slate-600')}
                      >
                        {f === 0 ? '1 🚪' : f + 1}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">Derazaga yaqin borib shaharga qarang 🏙️</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {isTouch ? (
            <WalkTouchControls />
          ) : (
            <Glass className="pointer-events-none absolute bottom-4 left-4 z-20 space-y-0.5 p-3 text-xs">
              <p className="font-bold">🚶 Piyoda</p>
              <p><b>W / ↑</b> yurish • <b>S / ↓</b> orqaga</p>
              <p><b>A D / ← →</b> burilish • <b>Shift</b> yugurish</p>
              <p><b>E</b> eshik / lift</p>
            </Glass>
          )}
        </>
      )}

      {/* phones: the main actions in a dock at the bottom, the rest in a menu */}
      {me && !driving && !walking && !selectedId && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden">
          <div className="pointer-events-auto grid grid-cols-5 gap-1.5 rounded-3xl bg-white/90 p-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:bg-gray-900/90">
            <DockButton onClick={() => setLibraryOpen(true)} icon="📚" label="Kutubxona" tone="bg-emerald-500 text-white" />
            <DockButton onClick={() => startQuiz('fuel')} icon="⛽" label={fmtClock(fuelShown)} tone={fuelShown <= 0 ? 'bg-rose-500 text-white' : ''} />
            <DockButton onClick={startTaxi} icon="🚕" label="Taksi" tone="bg-yellow-400 text-yellow-950" />
            <DockButton
              onClick={claim}
              disabled={!bonusReady || claiming}
              icon="🎁"
              label={bonusReady ? 'Bonus' : `${Math.ceil(bonusIn / 3_600_000)} soat`}
              tone={bonusReady ? 'animate-pulse bg-amber-400 text-amber-950' : ''}
            />
            <DockButton onClick={() => setMobileMenu(true)} icon="☰" label="Menyu" badge={listingCount > 0 ? listingCount : null} />
          </div>
        </div>
      )}
      <AnimatePresence>
        {me && mobileMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-end bg-black/40 sm:hidden" onClick={() => setMobileMenu(false)}>
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full space-y-3 rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-gray-900 shadow-2xl dark:bg-gray-950 dark:text-gray-100"
            >
              <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <p className="text-lg font-black">@{me.nickname}</p>
                <p className="text-lg font-black text-emerald-600 tabular-nums">{formatMoney(me.money)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['walk', '🚶', 'Piyoda'],
                  ['cars', '🚗', 'Avtosalon'],
                  ['home', '🏠', myFirstPlot ? 'Uyim' : 'Markaz'],
                  ['tour', '🏛️', "Yangi O'zbekiston"],
                  ['market', '🏷️', listingCount > 0 ? `Bozor (${listingCount})` : 'Bozor'],
                  ['people', '👥', 'Aholi'],
                  ['full', '⛶', fullscreen ? 'Kichraytirish' : "To'liq ekran"],
                ].map(([key, icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => runMenu(key)}
                    className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-gray-100 p-2 text-center text-xs font-bold active:scale-95 dark:bg-gray-800"
                  >
                    <span className="text-2xl">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold tracking-wider text-gray-500 uppercase">Grafika</p>
                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
                  {QUALITIES.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => changeQuality(q.id)}
                      className={cn('h-11 cursor-pointer rounded-xl text-sm font-bold', quality === q.id ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300')}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-center text-xs text-gray-500">Bir barmoq — xaritani surish • Ikki barmoq — yaqinlashtirish va burish</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* right side: residents + selected plot */}
      {me && !driving && !walking && (
        <div className="pointer-events-none absolute right-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-2 z-30 flex flex-col items-end gap-2 sm:right-3 sm:bottom-3 sm:left-auto">
          {showResidents && <Residents town={town} onPick={focus} />}
          <AnimatePresence mode="wait">
            {selectedId && <PlotPanel key={selectedId} town={town} plotId={selectedId} onClose={() => setSelectedId(null)} onQuiz={(kind, plotId) => (kind === 'library' ? setLibraryOpen(true) : startQuiz(kind, plotId))} onPlan={() => setPlanFor(selectedId)} />}
          </AnimatePresence>
        </div>
      )}

      {/* help */}
      {me && !selectedId && !driving && !walking && (
        <Glass className="pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-xs space-y-1 p-3 text-xs sm:block">
          <p className="flex items-center gap-1.5 font-bold">
            <MousePointerClick className="size-4 text-blue-600" /> Qanday o'ynaladi
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <b>📚 Kutubxona</b>da savol yechib pul ishlang → qizil <b>SOTILADI</b> taxtali hovlini oling → har qavat uchun <b>imtihon</b> topshirib uy quring.
          </p>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">Bo'sh hovlilar: {freePlots} ta</p>
        </Glass>
      )}

      {town && !me && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-sky-900/10 to-sky-900/40 p-4">
          <JoinCard />
        </div>
      )}

      <AnimatePresence>{carShop && me && <CarShop town={town} onClose={() => setCarShop(false)} />}</AnimatePresence>
      <AnimatePresence>
        {me && planFor && town.plots.some((p) => p.plotId === planFor) && (
          <BuildPlanner plotId={planFor} owned={town.plots.find((p) => p.plotId === planFor)} onClose={() => setPlanFor(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {me && marketOpen && (
          <MarketPanel
            town={town}
            onClose={() => setMarketOpen(false)}
            onShowPlot={(id) => {
              setMarketOpen(false)
              focus(id)
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {me && libraryOpen && (
          <LibraryPanel
            onClose={() => setLibraryOpen(false)}
            onStart={(topicKey) => {
              setLibraryOpen(false)
              startQuiz('library', undefined, topicKey)
            }}
          />
        )}
      </AnimatePresence>
      {me && <QuizModal onBuilt={(plotId) => focus(plotId)} onFuelDone={() => !driving && startTaxi()} />}
    </div>
  )
}

export default TownPage
