import { ARCS, DECK_LAMP_Z, LAMP_COLS, LAMP_ROWS, LAMP_SPACING, OVERPASS, RING_SIDE_LAMP_Z, RING_WIDTH, RING_X, ROUNDABOUTS } from '@/shared/config/town'

export const LAMP_HEAD_Y = 9.6
export const LAMP_ARM = 1.7

/** Every street lamp in town. `x, z` = pole, `y` = ground under it (deck lamps stand on the
 * expressway), `dx, dz` = unit direction of the arm (toward the road), `hx, hy, hz` = the
 * lamp head (where the light comes from). `row` marks lamps on the regular rows/columns. */
export function streetLamps() {
  const list = []
  const push = (x, z, y, dx, dz, row = false) => {
    // (the island lamps of a roundabout are added below, after this check)
    if (row && ROUNDABOUTS.some((o) => Math.hypot(x - o.x, z - o.z) < o.outer + 1.5)) return
    list.push({ x, z, y, dx, dz, row, hx: x + dx * LAMP_ARM, hy: y + LAMP_HEAD_Y, hz: z + dz * LAMP_ARM })
  }
  for (const r of LAMP_ROWS) {
    for (let k = 0; k < r.count; k += 1) push(r.start + k * LAMP_SPACING, r.z, 0, 0, r.dir, true)
  }
  for (const c of LAMP_COLS) {
    for (let k = 0; k < c.count; k += 1) push(c.x, c.start + k * LAMP_SPACING, 0, c.dir, 0, true)
  }
  for (const s of [1, -1]) {
    for (const z of RING_SIDE_LAMP_Z) push(s * (RING_X - RING_WIDTH / 2 - 0.6), z, 0, s, 0)
  }
  // along the curves: on the inner side, arm reaching out over the road
  for (const a of ARCS) {
    const steps = a.kind === 'ring' ? [0.2, 0.5, 0.8] : [0.5]
    const rr = a.kind === 'ring' ? a.r - a.w / 2 - 0.6 : a.r + a.w / 2 + 0.6
    const out = a.kind === 'ring' ? 1 : -1
    for (const f of steps) {
      const t = (f * Math.PI) / 2
      const ux = Math.cos(t) * a.sx
      const uz = Math.sin(t) * a.sz
      push(a.cx + ux * rr, a.cz + uz * rr, 0, ux * out, uz * out)
    }
  }
  // roundabouts: four lamps on the island
  for (const o of ROUNDABOUTS) {
    for (let k = 0; k < 4; k += 1) {
      const t = Math.PI / 4 + (k * Math.PI) / 2
      push(o.x + Math.cos(t) * (o.island - 0.8), o.z + Math.sin(t) * (o.island - 0.8), 0, Math.cos(t), Math.sin(t))
    }
  }
  for (const ox of OVERPASS.xs) {
    DECK_LAMP_Z.forEach((z, k) => {
      const s = k % 2 ? 1 : -1
      push(ox + s * (OVERPASS.half - 0.35), z, OVERPASS.height, -s, 0)
    })
  }
  return list
}
