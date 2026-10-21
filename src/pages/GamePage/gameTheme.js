import { Circle, Diamond, Square, Triangle } from 'lucide-react'
import { GAME_HEROES, GAME_TEAMS } from '@/shared/config/constants'

/** One color + shape + letter per answer slot, so options are recognisable at a glance (and
 * without relying on color alone). */
export const OPTION_STYLES = [
  { letter: 'A', icon: Triangle, bg: 'bg-blue-500', hover: 'hover:bg-blue-600', shadow: 'shadow-blue-700/40', ring: 'ring-blue-300' },
  { letter: 'B', icon: Diamond, bg: 'bg-rose-500', hover: 'hover:bg-rose-600', shadow: 'shadow-rose-700/40', ring: 'ring-rose-300' },
  { letter: 'C', icon: Circle, bg: 'bg-amber-500', hover: 'hover:bg-amber-600', shadow: 'shadow-amber-700/40', ring: 'ring-amber-200' },
  { letter: 'D', icon: Square, bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', shadow: 'shadow-emerald-700/40', ring: 'ring-emerald-200' },
]

export function teamOf(index) {
  return GAME_TEAMS[index] ?? GAME_TEAMS[0]
}

/** The player's hero; players who joined before heroes existed get a stable fallback. */
export function heroOf(heroId, fallbackKey = '') {
  const found = GAME_HEROES.find((h) => h.id === heroId)
  if (found) return found
  let hash = 0
  for (const ch of fallbackKey) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return GAME_HEROES[Math.abs(hash) % GAME_HEROES.length]
}

const LAST_HERO_KEY = 'coin-system:last-hero'

export function readLastHero() {
  try {
    return localStorage.getItem(LAST_HERO_KEY)
  } catch {
    return null
  }
}

export function saveLastHero(heroId) {
  try {
    localStorage.setItem(LAST_HERO_KEY, heroId)
  } catch {
    /* noop */
  }
}

const CONFETTI_COLORS = ['#3b82f6', '#f43f5e', '#f59e0b', '#10b981', '#a855f7', '#ffffff']

/** Deterministic pseudo-random in [0, 1) — confetti layout stays stable across renders. */
function seeded(n) {
  const x = Math.sin(n * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export const CONFETTI_PIECES = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  left: seeded(i + 1) * 100,
  delay: seeded(i + 101) * 0.6,
  duration: 2.2 + seeded(i + 201) * 1.8,
  rotate: (seeded(i + 301) - 0.5) * 720,
  drift: (seeded(i + 401) - 0.5) * 160,
  size: 6 + seeded(i + 501) * 8,
  round: seeded(i + 601) > 0.6,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}))
