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
