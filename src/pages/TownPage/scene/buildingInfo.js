/** Sizes shared by the building meshes, the construction site and name tags. */

export const OFFICE_FLOOR_H = 3.6
export const APT_FLOOR_H = 3
export const SHOP_FLOOR_H = 3.8
export const HOTEL_FLOOR_H = 3.2
export const HOTEL_PODIUM_H = 5
export const SCHOOL_FLOOR_H = 3.6
export const MALL_FLOOR_H = 5

/** Footprint (w × d) and total height of a building, in plot-local meters. */
export function buildingBox(kind, design, floors) {
  switch (kind) {
    case 'office': {
      const h = 5 + floors * OFFICE_FLOOR_H
      return { w: 12, d: 12, h: h + 4 }
    }
    case 'apartment':
      return { w: 12, d: 10, h: 0.6 + floors * APT_FLOOR_H + 2 }
    case 'hotel':
      return { w: 16, d: 11, h: HOTEL_PODIUM_H + floors * HOTEL_FLOOR_H + 3.5 }
    case 'school':
      return { w: 16, d: 12, h: 0.4 + floors * SCHOOL_FLOOR_H + (design === 'brick' ? 7 : 2) }
    case 'mall':
      return { w: 30, d: 16, h: 0.3 + floors * MALL_FLOOR_H + 3.5 }
    case 'stall':
      return { w: 6, d: 4.5, h: 4.4 }
    case 'shop':
      return { w: 12, d: 9, h: 0.3 + floors * SHOP_FLOOR_H + 1 }
    default:
      return { w: design === 'villa' ? 13.5 : 10, d: 9, h: 0.45 + floors * 3.2 + 3 }
  }
}

/** Where a building stands in its yard (plot-local): x/z of its centre, as the yard draws it.
 * Park lots put it at the back of their little square; other yards keep the front garden. */
export function yardLayout(plot, kind, design, floors) {
  const box = buildingBox(kind, design, Math.max(1, floors))
  const halfD = plot.d / 2
  if (plot.row === 'P') return { bx: 0, bz: Math.min(halfD - box.d / 2 - 3, -halfD + box.d / 2 + 1.5), box }
  const tight = plot.w < 16 || box.w > plot.w - 8
  return { bx: tight ? 0 : -2, bz: Math.max(halfD - 14.5, -halfD + box.d / 2 + 0.8), box }
}

/** The floors you can stand on inside a building: height of each floor's floor (from the
 * ground) and the room height. Stalls are open kiosks — nothing to go inside. */
export function floorLevels(kind, design, floors) {
  const n = Math.max(1, floors)
  const list = (base, h, count = n) => Array.from({ length: count }, (_, i) => ({ y: base + i * h, h }))
  switch (kind) {
    case 'office':
      return [{ y: 0, h: 5 }, ...list(5, OFFICE_FLOOR_H)]
    case 'hotel':
      return [{ y: 0, h: HOTEL_PODIUM_H }, ...list(HOTEL_PODIUM_H, HOTEL_FLOOR_H)]
    case 'apartment':
      return list(0.6, APT_FLOOR_H)
    case 'school':
      return list(0.4, SCHOOL_FLOOR_H)
    case 'mall':
      return list(0.3, MALL_FLOOR_H)
    case 'shop':
      return list(0.3, SHOP_FLOOR_H)
    case 'stall':
      return []
    default:
      return design === 'modern' || design === 'villa' ? list(0.3, 3.3) : list(0.45, 3.2)
  }
}
