import { create } from 'zustand'
import { PLOT_BY_ID } from '@/shared/config/town'
import { floorLevels, yardLayout } from '@/pages/TownPage/scene/buildingInfo'

/** What the walking player is near / inside, for the HUD — and the HUD's requests back
 * (enter, leave, ride the lift), which the walk controller carries out on its next frame. */
export const useWalk = create((set) => ({
  /** building the player stands at the door of (outside) or by the door (inside, ground floor) */
  door: null,
  /** inside: { id, floor, floors, kind } */
  inside: null,
  /** next to the lift (inside) */
  nearLift: false,
  request: null,
  ask(request) {
    set({ request })
  },
}))

/** Turn plot-local (lx, lz) into world coordinates. */
function toWorld(plot, lx, lz) {
  const c = Math.cos(plot.rotation)
  const s = Math.sin(plot.rotation)
  return { x: plot.x + lx * c + lz * s, z: plot.z - lx * s + lz * c }
}

/** Every built building as the walker sees it: footprint (centre, rotation, size), its floors,
 * and where its door, the spot just outside it, the spot just inside it and the lift are. */
export function walkBuildings(plots) {
  const list = []
  for (const owned of plots ?? []) {
    if (!owned.floors) continue
    const plot = PLOT_BY_ID[owned.plotId]
    if (!plot) continue
    const { bx, bz, box } = yardLayout(plot, owned.kind, owned.design, owned.floors)
    const c = toWorld(plot, bx, bz)
    list.push({
      id: owned.plotId,
      kind: owned.kind,
      design: owned.design,
      floors: owned.floors,
      x: c.x,
      z: c.z,
      rot: plot.rotation,
      w: box.w,
      d: box.d,
      levels: floorLevels(owned.kind, owned.design, owned.floors),
      door: toWorld(plot, bx, bz + box.d / 2),
      outside: toWorld(plot, bx, bz + box.d / 2 + 1.5),
      inside: toWorld(plot, bx, bz + box.d / 2 - 1.6),
      lift: toWorld(plot, bx, bz - box.d / 2 + 1.4),
    })
  }
  return list
}

/** (x, z) in a building's own frame (x across its front, z towards its front). */
export function toLocal(b, x, z) {
  const dx = x - b.x
  const dz = z - b.z
  const c = Math.cos(b.rot)
  const s = Math.sin(b.rot)
  return { lx: dx * c - dz * s, lz: dx * s + dz * c }
}
