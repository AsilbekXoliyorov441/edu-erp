import { Circle, Diamond, Square, Triangle } from 'lucide-react'
import { GAME_TEAMS } from '@/shared/config/constants'

/** One color + shape per answer slot, so options are recognisable at a glance (and without
 * relying on color alone). */
export const OPTION_STYLES = [
  { icon: Triangle, bg: 'bg-blue-500', ring: 'ring-blue-500', soft: 'bg-blue-500/15' },
  { icon: Diamond, bg: 'bg-red-500', ring: 'ring-red-500', soft: 'bg-red-500/15' },
  { icon: Circle, bg: 'bg-amber-500', ring: 'ring-amber-500', soft: 'bg-amber-500/15' },
  { icon: Square, bg: 'bg-emerald-500', ring: 'ring-emerald-500', soft: 'bg-emerald-500/15' },
]

export function teamOf(index) {
  return GAME_TEAMS[index] ?? GAME_TEAMS[0]
}
