import { create } from 'zustand'

/** Town day / night.
 *
 * Day lasts 10 minutes, night 4 (from the wall clock, so everyone sees the same).
 * Day is one fixed bright look and night one fixed dark look — nothing moves in between;
 * a switch fades over `FADE_MS` (3 s). Staff can force day or night on their own screen to
 * preview it; that never changes anything for students. */

export const DAY_MS = 10 * 60 * 1000
export const NIGHT_MS = 4 * 60 * 1000
const CYCLE_MS = DAY_MS + NIGHT_MS
export const FADE_MS = 3000

/** Local override: null = follow the clock, 'day' / 'night' = forced (staff preview). */
export const useClockStore = create((set) => ({
  forced: null,
  /** true on devices without a graphics card: night is never shown there. */
  noNight: false,
  setNoNight(value) {
    set({ noNight: value })
  },
  force(mode) {
    set({ forced: mode })
  },
  reset() {
    set({ forced: null })
  },
}))

/** Is it night right now (for this screen)? */
export function isNightNow(now = Date.now()) {
  const { forced, noNight } = useClockStore.getState()
  if (forced) return forced === 'night'
  if (noNight) return false
  return now % CYCLE_MS >= DAY_MS
}

/** HUD clock: day or night, and ms until the next switch (null while forced). */
export function clockLabel(now = Date.now()) {
  const { forced, noNight } = useClockStore.getState()
  const night = isNightNow(now)
  const t = now % CYCLE_MS
  const msLeft = t < DAY_MS ? DAY_MS - t : CYCLE_MS - t
  return { isDay: !night, name: night ? 'Tun' : 'Kun', msLeft: forced || noNight ? null : msLeft }
}

/* ---- materials that react to the night ------------------------------------------- */

const registry = new Set()

/** Have `mat[prop]` follow the night: `dayValue` by day, `nightValue` at night. For
 * `opacity`, the material is also hidden by day. */
export function followNight(mat, prop, nightValue, dayValue = 0) {
  const entry = { mat, prop, nightValue, dayValue }
  registry.add(entry)
  // pick up the current state right away (e.g. a building built at night)
  const n = nightState.night
  mat[prop] = dayValue + (nightValue - dayValue) * n
  if (prop === 'opacity') mat.visible = n > 0.02
  return mat
}

/** Shared night amount (0 day … 1 night), read by components that need it. */
export const nightState = { night: 0 }

export function applyNight(night) {
  nightState.night = night
  for (const r of registry) {
    r.mat[r.prop] = r.dayValue + (r.nightValue - r.dayValue) * night
    if (r.prop === 'opacity') r.mat.visible = night > 0.02
  }
}
