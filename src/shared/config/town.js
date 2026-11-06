/** "Shaharcha" — the shared town game. The map is fixed and generated here, so the server
 * (prices, which plot exists) and the 3D scene (where it stands) always agree.
 *
 * World units are meters. The central avenue runs along X (z = 0); cross streets run along Z;
 * a back street on each side (z = ±BACK_STREET_Z) serves the second row of plots. */

export const TOWN = {
  START_MONEY: 50_000,
  DAILY_BONUS: 5_000,
  BONUS_COOLDOWN_MS: 20 * 60 * 60 * 1000,
  MAX_HOUSE_FLOORS: 4,
  NICKNAME_RE: /^[a-zA-Z0-9_]{3,16}$/,
}

/** Learning: money comes from answering questions, and every floor needs an exam. */
export const LEARN = {
  LIBRARY_QUESTIONS: 5,
  NEW_REWARD: 1_000,
  REPEAT_REWARD: 200,
  STREAK_BONUS: 150,
  MAX_STREAK_BONUS: 600,
  /** Building stage N asks N + 2 questions (at most 7); one mistake is allowed. */
  examQuestions: (stage) => Math.min(7, stage + 2),
  examNeed: (stage) => Math.min(7, stage + 2) - 1,
  FAIL_COOLDOWN_MS: 45_000,
  /** Driving needs fuel; fuel comes from answering questions. */
  FUEL_QUESTIONS: 5,
  FUEL_PER_CORRECT_MS: 60_000,
  FUEL_MAX_MS: 20 * 60_000,
  /** The passenger asks one question; a right answer adds this share of the fare as a tip. */
  PASSENGER_TIP: 0.5,
}

export const AVENUE_WIDTH = 14
export const STREET_WIDTH = 10
/** The new city's streets are wider (two lanes each way), and so are the north district's. */
export const CITY_W = 16
export const NORTH_W = 14
export const RING_WIDTH = 12
export const SIDEWALK = 3
export const BACK_STREET_Z = 40
export const OUTER_STREET_Z = 85
/** The ring road around the whole town. */
export const RING_X = 300
export const RING_Z = 145
export const CROSS_STREETS_X = [-225, -75, 75, 225]
export const TOWN_HALF_X = RING_X
export const TOWN_HALF_Z = RING_Z + RING_WIDTH / 2

/** Elevated expressways ("estakada") running north–south at x = ±125, over the avenue and
 * the streets: flat at `height` for |z| ≤ `flat`, ramps down to the ring road at |z| = `end`.
 * Below |z| = `groundEnd` cars on the ground pass underneath. */
export const OVERPASS = { xs: [-125, 125], half: 5.5, height: 7.5, flat: 100, end: 146, groundEnd: 93.5 }

/** Deck height of an expressway at `z` (smooth ramps). */
export function deckHeight(z) {
  const a = Math.abs(z)
  if (a <= OVERPASS.flat) return OVERPASS.height
  if (a >= OVERPASS.end) return 0
  const t = (OVERPASS.end - a) / (OVERPASS.end - OVERPASS.flat)
  return OVERPASS.height * t * t * (3 - 2 * t)
}

/** The ring road's corners are wide curves; the inner loop (outer streets + the outermost
 * cross streets) has rounded corners too. In the very centre the avenue runs into a big
 * roundabout with a lighthouse on its island; short streets lead from it to the back streets. */
export const RING_CORNER_R = 55
export const INNER_LOOP = { x: 225, z: OUTER_STREET_Z, r: 24 }
/* ---- the "Yangi O'zbekiston" district north of the town ---------------------------------
 * A loop road around it (continuing the town's ring road), two streets running north from
 * the ring, a cross street on each side, and a boulevard from the ring up to the park's
 * entrance plaza. Inside: the park with the monument (centre), the stadium and the
 * recreation park (west), the children's park and the mosque (east). */
export const NORTH = { x: 430, top: 880, inner: 225, mid: 520, plaza: 300, street: 245 }
const NORTH_R = 55
/** Lanes that run into the park from the side streets; plots are scattered along them. */
export const PARK_LANES = [540]
/* ---- the big city all round: a grid of streets and blocks outside the "city ring" (the
 * rectangle x = ±CITY.ring, z = CITY.south…CITY.north that holds the old town and the
 * Yangi O'zbekiston district). Its roads continue the old ones: the avenue runs on east and
 * west, the cross streets run on south, the district's mid road and a lane north of the
 * park run out to it. */
export const CITY = { ring: 490, south: -170, north: 940, outerX: 820, outerS: -500, outerN: 1270 }
/** Streets along X: everywhere in the south and north bands, only in the side bands between. */
const CITY_Z_LINES = [-500, -390, -280, -170, -85, 0, 110, 220, 330, 430, 520, 620, 720, 830, 940, 1050, 1160, 1270]
/** Streets along Z in the side bands (full height) and extra ones in the south/north bands. */
const CITY_SIDE_X = [-820, -710, -600, -490, 490, 600, 710, 820]
const CITY_SOUTH_X = [-380, -225, -75, 75, 225, 380]
const CITY_NORTH_X = [-380, -270, -160, -55, 55, 160, 270, 380]

/** Arterials: the city ring and the avenue's line through the city are divided boulevards —
 * two carriageways with a planted median, so traffic in opposite directions never meets —
 * with roundabouts where they cross instead of traffic lights. */
export const ARTERIAL = { w: 30, median: 4 }
const isArterialZ = (z, x) => z === CITY.south || z === CITY.north || (z === 0 && Math.abs(x) >= CITY.ring)
const isArterialX = (x) => Math.abs(x) === CITY.ring
/** Half width of the city street along X at `z` (near `x`), or along Z at `x`. */
const halfAtZ = (z, x) => (isArterialZ(z, x) ? ARTERIAL.w / 2 : CITY_W / 2)
const halfAtX = (x) => (isArterialX(x) ? ARTERIAL.w / 2 : CITY_W / 2)
/** Pedestrian bridges over the arterials (x, z, and whether the road below runs along X). */
export const FOOTBRIDGES = [
  ...[1, -1].flatMap((s) => [
    { x: s * CITY.ring, z: 275, alongX: false },
    { x: s * CITY.ring, z: 675, alongX: false },
    { x: s * 300, z: CITY.south, alongX: true },
    { x: s * 655, z: CITY.south, alongX: true },
    { x: s * 105, z: CITY.north, alongX: true },
    { x: s * 655, z: CITY.north, alongX: true },
    { x: s * 655, z: 0, alongX: true },
  ]),
]

/** Each city block is either a house quarter ("mahalla", small lots round its own lane),
 * a mixed block (medium lots) or a tower block (big lots). Fixed per block, so everyone
 * sees the same city. */
const MAHALLA_LANE = 10
function blockKind(zi, xi, height) {
  let h = (zi * 73856093) ^ (xi * 19349663)
  h = ((h >>> 0) % 1000) / 1000
  if (height >= 100 && h < 0.42) return 'mahalla'
  return h < 0.72 ? 'mixed' : 'tower'
}
/** The lanes through the house quarters (one per mahalla block, from street to street). */
function mahallaLanes() {
  const lanes = []
  for (let zi = 0; zi < CITY_Z_LINES.length - 1; zi += 1) {
    const za = CITY_Z_LINES[zi]
    const zb = CITY_Z_LINES[zi + 1]
    const band = zb <= CITY.south ? 'S' : za >= CITY.north ? 'N' : 'M'
    const xs = band === 'S' ? [...CITY_SIDE_X, ...CITY_SOUTH_X] : band === 'N' ? [...CITY_SIDE_X, ...CITY_NORTH_X] : CITY_SIDE_X
    const lines = [...xs].sort((a, b) => a - b)
    for (let xi = 0; xi < lines.length - 1; xi += 1) {
      if (band === 'M' && lines[xi] >= -CITY.ring && lines[xi + 1] <= CITY.ring) continue
      const cx = (lines[xi] + lines[xi + 1]) / 2
      const zc = (za + halfAtZ(za, cx) + zb - halfAtZ(zb, cx)) / 2
      if (blockKind(zi, xi, zb - za) === 'mahalla') lanes.push({ z: zc, x1: lines[xi], x2: lines[xi + 1], w: MAHALLA_LANE, kind: 'street' })
    }
  }
  return lanes
}

/** Everything there is to see and drive on. */
export const WORLD = { minX: -CITY.outerX - 10, maxX: CITY.outerX + 10, minZ: CITY.outerS - 10, maxZ: CITY.outerN + 10 }

export const ROUNDABOUTS = [
  { x: 0, z: 0, island: 13, outer: 23 },
  { x: 0, z: NORTH.plaza, island: 14, outer: 24 },
  ...[1, -1].flatMap((s) => [-170, 0, 940].map((z) => ({ x: s * 490, z, island: 15, outer: 31 }))),
]
const RING_STRAIGHT_X = RING_X - RING_CORNER_R
const RING_STRAIGHT_Z = RING_Z - RING_CORNER_R

/** Quarter-circle road pieces: centre, radius, width, and which quadrant (sx, sz). */
export const ARCS = [
  ...[1, -1].flatMap((sx) =>
    [1, -1].flatMap((sz) => [
      { cx: sx * RING_STRAIGHT_X, cz: sz * RING_STRAIGHT_Z, r: RING_CORNER_R, w: RING_WIDTH, sx, sz, kind: 'ring' },
      { cx: sx * (INNER_LOOP.x - INNER_LOOP.r), cz: sz * (INNER_LOOP.z - INNER_LOOP.r), r: INNER_LOOP.r, w: STREET_WIDTH, sx, sz, kind: 'street' },
    ]),
  ),
  // the north district's loop road: rounded where it leaves the ring and at the top
  ...[1, -1].flatMap((sx) => [
    { cx: sx * (NORTH.x - NORTH_R), cz: RING_Z + NORTH_R, r: NORTH_R, w: RING_WIDTH, sx, sz: -1, kind: 'ring' },
    { cx: sx * (NORTH.x - NORTH_R), cz: NORTH.top - NORTH_R, r: NORTH_R, w: RING_WIDTH, sx, sz: 1, kind: 'ring' },
  ]),
]

/** Straight roads of the north district (no sidewalks): along X from x1 to x2, along Z from
 * z1 to z2. */
export const NX_ROADS = [
  ...[1, -1].map((s) => ({ z: RING_Z, x1: s > 0 ? RING_X - RING_CORNER_R : -(NORTH.x - NORTH_R), x2: s > 0 ? NORTH.x - NORTH_R : -(RING_X - RING_CORNER_R), w: RING_WIDTH, kind: 'ring' })),
  { z: NORTH.top, x1: -(NORTH.x - NORTH_R), x2: NORTH.x - NORTH_R, w: RING_WIDTH, kind: 'ring' },
  ...[1, -1].map((s) => ({ z: NORTH.mid, x1: s > 0 ? NORTH.inner : -NORTH.x, x2: s > 0 ? NORTH.x : -NORTH.inner, w: NORTH_W, kind: 'street' })),
  // lanes into the park, from the side streets to the central alley
  ...PARK_LANES.flatMap((z) => [1, -1].map((s) => ({ z, x1: s > 0 ? 24 : -NORTH.inner, x2: s > 0 ? NORTH.inner : -24, w: 10, kind: 'street' }))),
  // the city grid along X
  ...CITY_Z_LINES.flatMap((z) => {
    const road = (x1, x2) =>
      isArterialZ(z, x2 > 0 ? x2 : x1) ? { z, x1, x2, w: ARTERIAL.w, median: ARTERIAL.median, kind: 'boulevard' } : { z, x1, x2, w: CITY_W, kind: 'street' }
    return z <= CITY.south || z >= CITY.north ? [road(-CITY.outerX, CITY.outerX)] : [road(-CITY.outerX, -CITY.ring), road(CITY.ring, CITY.outerX)]
  }),
  // the old town's back and outer streets run on through the strips beside it to the city ring
  ...[BACK_STREET_Z, -BACK_STREET_Z, OUTER_STREET_Z, -OUTER_STREET_Z].flatMap((z) =>
    [1, -1].map((s) => ({ z, x1: s > 0 ? RING_X : -CITY.ring, x2: s > 0 ? CITY.ring : -RING_X, w: STREET_WIDTH, kind: 'street' })),
  ),
  // lanes through the house quarters
  ...mahallaLanes(),
  // spokes from the old roads out to the city ring
  ...[1, -1].map((s) => ({ z: 0, x1: s > 0 ? RING_X : -CITY.ring, x2: s > 0 ? CITY.ring : -RING_X, w: AVENUE_WIDTH, kind: 'street' })),
  ...[1, -1].map((s) => ({ z: NORTH.mid, x1: s > 0 ? NORTH.x : -CITY.ring, x2: s > 0 ? CITY.ring : -NORTH.x, w: NORTH_W, kind: 'street' })),
  // the street through the new quarter either side of the boulevard
  ...[1, -1].map((s) => ({ z: NORTH.street, x1: s > 0 ? 11 : -NORTH.inner, x2: s > 0 ? NORTH.inner : -11, w: NORTH_W, kind: 'street' })),
]
export const NZ_ROADS = [
  ...[1, -1].map((s) => ({ x: s * NORTH.x, z1: RING_Z + NORTH_R, z2: NORTH.top - NORTH_R, w: RING_WIDTH, kind: 'ring' })),
  ...[1, -1].map((s) => ({ x: s * NORTH.inner, z1: RING_Z, z2: NORTH.top, w: NORTH_W, kind: 'street' })),
  // the city grid along Z
  ...CITY_SIDE_X.map((x) =>
    isArterialX(x) ? { x, z1: CITY.outerS, z2: CITY.outerN, w: ARTERIAL.w, median: ARTERIAL.median, kind: 'boulevard' } : { x, z1: CITY.outerS, z2: CITY.outerN, w: CITY_W, kind: 'street' },
  ),
  ...CITY_SOUTH_X.map((x) => ({ x, z1: CITY.outerS, z2: Math.abs(x) === 380 ? CITY.south : -RING_Z, w: CITY_W, kind: 'street' })),
  ...CITY_NORTH_X.map((x) => ({ x, z1: CITY.north, z2: CITY.outerN, w: CITY_W, kind: 'street' })),
  // a spoke from the district's top road out to the city ring (between two lots)
  { x: -6, z1: NORTH.top, z2: CITY.north, w: STREET_WIDTH, kind: 'street' },
  // the boulevard: two carriageways with a planted median between them
  ...[1, -1].map((s) => ({ x: s * 6.5, z1: RING_Z, z2: NORTH.plaza, w: 9, kind: 'boulevard' })),
]

/** Taxi stops at the north district's landmarks (on the road, by the kerb). `walkX`/`walkZ`
 * is where the passenger waits. */
const LANDMARK_STOPS = [
  { id: 'L-monument', name: "Yangi O'zbekiston bog'i", x: 9.4, z: 268, walkX: 12.6, walkZ: 268 },
  { id: 'L-stadium', name: 'Stadion', x: -(NORTH.inner + NORTH_W / 2 - 1.6), z: 335, walkX: -(NORTH.inner + NORTH_W / 2 + 1.5), walkZ: 335 },
  { id: 'L-recreation', name: "Istirohat bog'i", x: -(NORTH.inner + NORTH_W / 2 - 1.6), z: 700, walkX: -(NORTH.inner + NORTH_W / 2 + 1.5), walkZ: 700 },
  { id: 'L-kids', name: "Bolalar bog'i", x: NORTH.inner + NORTH_W / 2 - 1.6, z: 335, walkX: NORTH.inner + NORTH_W / 2 + 1.5, walkZ: 335 },
  { id: 'L-mosque', name: 'Masjid', x: NORTH.inner + NORTH_W / 2 - 1.6, z: 700, walkX: NORTH.inner + NORTH_W / 2 + 1.5, walkZ: 700 },
]

/** Roads along X (with a sidewalk on each side, |x| ≤ `xMax`) and along Z (no sidewalks). */
export const X_ROADS = [
  { z: 0, w: AVENUE_WIDTH, kind: 'avenue', xMax: RING_X + RING_WIDTH / 2 },
  ...[1, -1].flatMap((s) => [
    { z: s * BACK_STREET_Z, w: STREET_WIDTH, kind: 'street', xMax: RING_X + RING_WIDTH / 2 },
    { z: s * OUTER_STREET_Z, w: STREET_WIDTH, kind: 'street', xMax: RING_X + RING_WIDTH / 2 },
    { z: s * RING_Z, w: RING_WIDTH, kind: 'ring', xMax: RING_STRAIGHT_X + 0.5 },
  ]),
]
export const Z_ROADS = [
  ...CROSS_STREETS_X.map((x) => ({ x, w: STREET_WIDTH, z1: -RING_Z, z2: RING_Z, kind: 'street' })),
  ...[1, -1].flatMap((s) => [
    { x: s * RING_X, w: RING_WIDTH, z1: -RING_STRAIGHT_Z - 0.5, z2: RING_STRAIGHT_Z + 0.5, kind: 'ring' },
    // from the central roundabout to the back street
    { x: 0, w: STREET_WIDTH, z1: s > 0 ? 18 : -BACK_STREET_Z, z2: s > 0 ? BACK_STREET_Z : -18, kind: 'street' },
  ]),
]

/** Is (x, z) on the quarter-circle road `a` (within `extra` of its edges)? */
export function onArc(a, x, z, extra = 0) {
  if ((x - a.cx) * a.sx < -0.5 || (z - a.cz) * a.sz < -0.5) return false
  return Math.abs(Math.hypot(x - a.cx, z - a.cz) - a.r) <= a.w / 2 + extra
}

/** Lots in the middle block are the town's public places, not for sale (yet). */
export const PUBLIC_PLACES = {
  'N-C-0-0': { kind: 'park', name: 'Markaziy bog\'' },
  'S-C-0-0': { kind: 'bank', name: 'Islomiy bank' },
  'N-B-0-0': { kind: 'choyxona', name: 'Choyxona' },
  'N-B-0-1': { kind: 'supermarket', name: 'Supermarket' },
  'S-B-0-0': { kind: 'restaurant', name: 'Restoran' },
  'S-B-0-1': { kind: 'library', name: 'Kutubxona' },
}

/** Neighbourhoods ("mahalla") — one per block column, Monopoly-style colour groups. */
export const DISTRICTS = {
  '-5': { name: 'Bektemir', color: '#64748b' },
  '-4': { name: 'Olmazor', color: '#14b8a6' },
  '-3': { name: 'Uchtepa', color: '#a855f7' },
  '-2': { name: 'Chilonzor', color: '#8b5cf6' },
  '-1': { name: 'Yunusobod', color: '#0ea5e9' },
  0: { name: 'Markaz', color: '#f59e0b' },
  1: { name: 'Mirobod', color: '#ef4444' },
  2: { name: 'Sergeli', color: '#22c55e' },
  3: { name: 'Yashnobod', color: '#f97316' },
  4: { name: 'Shayxontohur', color: '#ec4899' },
  5: { name: 'Yakkasaroy', color: '#84cc16' },
  6: { name: "Yangi O'zbekiston", color: '#0d9488' },
  7: { name: 'Shimoliy shahar', color: '#0284c7' },
  8: { name: 'Janubiy shahar', color: '#c2410c' },
  9: { name: "G'arbiy shahar", color: '#7c3aed' },
  10: { name: 'Sharqiy shahar', color: '#15803d' },
}

/** Block columns between the cross streets: centre x and usable width. */
const BLOCKS = {
  '-5': { cx: -262, w: 60 },
  '-4': { cx: -200, w: 38 },
  '-3': { cx: -150, w: 38 },
  '-2': { cx: -100, w: 38 },
  '-1': { cx: -50, w: 38 },
  0: { cx: 0, w: 38 },
  1: { cx: 50, w: 38 },
  2: { cx: 100, w: 38 },
  3: { cx: 150, w: 38 },
  4: { cx: 200, w: 38 },
  5: { cx: 262, w: 60 },
}

/** Plot rows on each side of the avenue: which road they face and where their front is.
 * F faces the avenue, B the back street, C the outer street. */
const ROWS = {
  F: { roadZ: 0, roadW: AVENUE_WIDTH, front: AVENUE_WIDTH / 2 + SIDEWALK + 1 },
  B: { roadZ: BACK_STREET_Z, roadW: STREET_WIDTH, front: BACK_STREET_Z + STREET_WIDTH / 2 + SIDEWALK + 1 },
  C: { roadZ: OUTER_STREET_Z, roadW: STREET_WIDTH, front: OUTER_STREET_Z + STREET_WIDTH / 2 + SIDEWALK + 1 },
}

/** The original town (blocks −2…2, rows F and B) keeps its exact cuts, so plots players
 * already own stay where they are. */
const BLOCK_LAYOUT = {
  'N-F': { '-2': 'three', '-1': 'two', 1: 'big', 2: 'two' },
  'S-F': { '-2': 'two', '-1': 'big', 1: 'two', 2: 'three' },
  'N-B': { '-2': 'big', '-1': 'two', 1: 'three', 2: 'two' },
  'S-B': { '-2': 'two', '-1': 'three', 1: 'two', 2: 'big' },
}
const CUTS = {
  two: [
    { dx: -10, w: 18 },
    { dx: 10, w: 18 },
  ],
  big: [{ dx: 0, w: 38 }],
  three: [
    { dx: -13, w: 12 },
    { dx: 0, w: 12 },
    { dx: 13, w: 12 },
  ],
}

/** New districts: plot widths (and depths, for the deep outer row) laid out with even gaps. */
const NEW_LAYOUT = {
  'N-F': { '-5': [29, 29], '-4': [38], '-3': [18, 18], 3: [12, 12, 12], 4: [18, 18], 5: [18, 18, 22] },
  'S-F': { '-5': [18, 18, 22], '-4': [12, 12, 12], '-3': [38], 3: [18, 18], 4: [38], 5: [29, 29] },
  'N-B': { '-5': [60], '-4': [28], '-3': [12, 12, 12], 3: [38], 4: [28], 5: [24, 34] },
  'S-B': { '-5': [24, 34], '-4': [28], '-3': [18, 18], 3: [12, 12, 12], 4: [28], 5: [60] },
}
const C_LAYOUT = {
  N: {
    '-5': [[20, 24, -8], [26, 40, 17]],
    '-4': [[18, 30], [18, 30]],
    '-3': [[38, 40]],
    '-2': [[12, 26], [12, 26], [12, 26]],
    '-1': [[18, 40], [18, 40]],
    0: [[38, 40]],
    1: [[18, 30], [18, 30]],
    2: [[38, 30]],
    3: [[18, 40], [18, 40]],
    4: [[38, 40]],
    5: [[26, 40, -17], [20, 24, 8]],
  },
  S: {
    '-5': [[20, 24, -8], [26, 40, 17]],
    '-4': [[38, 40]],
    '-3': [[18, 30], [18, 30]],
    '-2': [[38, 30]],
    '-1': [[18, 30], [18, 30]],
    0: [[38, 40]],
    1: [[12, 26], [12, 26], [12, 26]],
    2: [[18, 40], [18, 40]],
    3: [[38, 40]],
    4: [[18, 30], [18, 30]],
    5: [[26, 40, -17], [20, 24, 8]],
  },
}

function spread(total, sizes) {
  const sum = sizes.reduce((a, b) => a + b, 0)
  const gap = sizes.length > 1 ? (total - sum) / (sizes.length - 1) : 0
  let x = -total / 2
  return sizes.map((w) => {
    const dx = x + w / 2
    x += w + gap
    return { dx, w }
  })
}

export const PLOT_SIZES = {
  small: { name: 'Kichik', kinds: ['house', 'shop', 'stall'] },
  medium: { name: "O'rta", kinds: ['house', 'shop', 'stall', 'apartment', 'office', 'hotel', 'school'] },
  large: { name: 'Katta', kinds: ['house', 'shop', 'stall', 'apartment', 'office', 'hotel', 'school', 'mall'] },
  huge: { name: 'Juda katta', kinds: ['house', 'shop', 'stall', 'apartment', 'office', 'hotel', 'school', 'mall'] },
}

function sizeOf(w, d) {
  if (w <= 12) return 'small'
  const area = w * d
  if (area < 700) return 'medium'
  if (area < 1300) return 'large'
  return 'huge'
}

/** Monopoly-style land price: area × location. Central blocks, the avenue frontage and
 * being near the choyxona / supermarket / restaurant / library all push it up. */
function landPrice({ x, z, w, d, row }) {
  const centrality = 1 + 1.3 * Math.max(0, 1 - Math.abs(x) / 130)
  const front = row === 'F' ? 1.35 : row === 'B' ? 1 : 0.9
  const shops = [
    [-10, 60],
    [10, 60],
    [-10, -60],
    [10, -60],
  ]
  const near = shops.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < 45) ? 1.25 : 1
  return Math.round((w * d * 55 * centrality * front * near) / 500) * 500
}

function buildPlots() {
  const plots = []
  let number = 1
  const add = (side, row, blockIndex, half, cut, d) => {
    const id = `${side}-${row}-${blockIndex}-${half}`
    const isPublic = !!PUBLIC_PLACES[id]
    const r = ROWS[row]
    const sign = side === 'N' ? 1 : -1
    const plot = {
      id,
      number: isPublic ? null : number++,
      x: BLOCKS[blockIndex].cx + cut.dx,
      z: sign * (r.front + d / 2),
      w: cut.w,
      d,
      // Every plot's front faces the road nearer the town center (toward z = 0).
      rotation: side === 'N' ? Math.PI : 0,
      row,
      roadZ: sign * r.roadZ,
      roadW: r.roadW,
      size: sizeOf(cut.w, d),
      district: blockIndex,
      public: isPublic ? PUBLIC_PLACES[id] : null,
    }
    plot.price = landPrice(plot)
    plots.push(plot)
  }

  // 1) the original town — same order, so plot numbers don't change
  for (const side of ['N', 'S']) {
    for (const row of ['F', 'B']) {
      for (let b = -2; b <= 2; b += 1) {
        // the centre block's front row is the roundabout plaza (it used to hold the public
        // park and bank, which had no numbers, so nothing else gets renumbered)
        if (b === 0 && row === 'F') continue
        const cuts = b === 0 ? CUTS.two : CUTS[BLOCK_LAYOUT[`${side}-${row}`][b]]
        cuts.forEach((cut, half) => add(side, row, b, half, cut, 22))
      }
    }
  }
  // 2) the new districts east and west
  for (const side of ['N', 'S']) {
    for (const row of ['F', 'B']) {
      for (const b of [-5, -4, -3, 3, 4, 5]) {
        const sizes = NEW_LAYOUT[`${side}-${row}`][b]
        // the inner loop's curves cut the outer corner of the B rows in blocks ±4
        const span = Math.abs(b) === 4 && row === 'B' ? 28 : BLOCKS[b].w
        spread(span, sizes).forEach((cut, half) => add(side, row, b, half, cut, 22))
      }
    }
  }
  // 3) the deep outer row — big gardens and estates
  for (const side of ['N', 'S']) {
    for (let b = -5; b <= 5; b += 1) {
      const list = C_LAYOUT[side][b]
      const cuts = list[0].length > 2 ? list.map(([w, , dx]) => ({ dx, w })) : spread(BLOCKS[b].w, list.map(([w]) => w))
      cuts.forEach((cut, half) => add(side, 'C', b, half, cut, list[half][1]))
    }
  }
  // 4) the "Yangi O'zbekiston" quarter: three rows either side of the boulevard, mostly big
  // and very big lots (towers, hotels, malls — and houses)
  const Y_ROWS = [
    // facing the ring road
    { key: 1, roadZ: RING_Z, roadW: RING_WIDTH, front: RING_Z + RING_WIDTH / 2 + SIDEWALK + 1, d: 38, dir: 1, x0: 16, sizes: [38, 18, 18, 60, 38] },
    // both sides of the quarter's street
    { key: 2, roadZ: NORTH.street, roadW: NORTH_W, front: NORTH.street - NORTH_W / 2 - 1, d: 38, dir: -1, x0: 16, sizes: [24, 24, 38, 18, 18, 38] },
    { key: 3, roadZ: NORTH.street, roadW: NORTH_W, front: NORTH.street + NORTH_W / 2 + 1, d: 40, dir: 1, x0: 34, sizes: [38, 60, 18, 18, 38] },
  ]
  const x1 = NORTH.inner - NORTH_W / 2 - 3
  for (const row of Y_ROWS) {
    for (const s of [1, -1]) {
      const span = x1 - row.x0
      spread(span, row.sizes).forEach((cut, i) => {
        const id = `Y-${row.key}-${s > 0 ? 'E' : 'W'}-${i}`
        const plot = {
          id,
          number: number++,
          x: s * (row.x0 + span / 2 + cut.dx),
          z: row.front + (row.dir * row.d) / 2,
          w: cut.w,
          d: row.d,
          // front faces the road: toward −z (π) when the lot lies north of it
          rotation: row.dir > 0 ? Math.PI : 0,
          row: 'Y',
          roadZ: row.roadZ,
          roadW: row.roadW,
          size: sizeOf(cut.w, row.d),
          district: 6,
          public: null,
        }
        // a prestige address next to the park
        plot.price = Math.round((landPrice({ ...plot, row: 'F' }) * 1.25) / 500) * 500
        plots.push(plot)
      })
    }
  }
  // 5) eight small lots in the park for shops and stalls, along its lane
  for (const [i, side, sx, x] of [
    [0, 1, 1, 46],
    [1, 1, 1, 124],
    [2, -1, 1, 70],
    [3, -1, 1, 160],
    [4, 1, -1, 46],
    [5, 1, -1, 124],
    [6, -1, -1, 70],
    [7, -1, -1, 160],
  ]) {
    const laneZ = PARK_LANES[0]
    const w = 16
    const d = 14
    const plot = {
      id: `P-${i}`,
      number: number++,
      x: sx * x,
      z: laneZ + side * (6 + d / 2),
      w,
      d,
      rotation: side > 0 ? Math.PI : 0,
      row: 'P',
      roadZ: laneZ,
      roadW: 10,
      size: 'small',
      district: 6,
      public: null,
      // only shops and stalls may be built in the park
      only: ['shop', 'stall'],
      note: "bog'dagi joyga faqat do'kon yoki rasta quriladi",
    }
    plot.price = Math.round((landPrice({ ...plot, row: 'F' }) * 1.6) / 500) * 500
    plots.push(plot)
  }
  // 6) a ring of big lots OUTSIDE the whole district, beyond its loop road (west, east and
  // north) — for tall buildings: apartment blocks, office towers and hotels
  const OD = 36 // depth
  const TOWERS = ['apartment', 'office', 'hotel']
  const outerPlot = (id, x, z, w, rotation, road) => {
    const plot = { id, number: number++, x, z, w, d: OD, rotation, row: 'O', size: sizeOf(w, OD), district: 6, public: null, only: TOWERS, note: 'faqat baland binolar: turar-joy, biznes markaz, mehmonxona', ...road }
    plot.price = Math.round((landPrice({ ...plot, row: 'F' }) * 1.3) / 500) * 500
    plots.push(plot)
  }
  // along the loop's west and east sides (straight from z = 200 to 825)
  const sideLots = [
    [206, 50],
    [262, 60],
    [328, 50],
    [384, 60],
    [450, 56],
    [534, 50],
    [590, 60],
    [656, 50],
    [712, 50],
    [768, 46],
  ]
  for (const s of [-1, 1]) {
    sideLots.forEach(([z0, w], i) => {
      const front = s * (NORTH.x + RING_WIDTH / 2 + 1)
      // front toward the road: +x on the west side, −x on the east side
      outerPlot(`O-${s > 0 ? 'E' : 'W'}-${i}`, front + (s * OD) / 2, z0 + w / 2, w, (-s * Math.PI) / 2, { roadX: s * NORTH.x, roadW: RING_WIDTH })
    })
  }
  // along the loop's north side (straight from x = −375 to 375)
  for (let i = 0; i < 12; i += 1) {
    const w = i % 3 === 1 ? 60 : 50
    const x0 = -372 + i * 62
    const front = NORTH.top + RING_WIDTH / 2 + 1
    outerPlot(`O-N-${i}`, x0 + w / 2, front + OD / 2, w, Math.PI, { roadZ: NORTH.top, roadW: RING_WIDTH })
  }
  // 7) the big city: every block of the grid outside the city ring, cut into lots that face
  // the streets to their south and north
  const CITY_DISTRICT = (x, z) => (z < CITY.south ? 8 : z > CITY.north ? 7 : x < 0 ? 9 : 10)
  for (let zi = 0; zi < CITY_Z_LINES.length - 1; zi += 1) {
    const za = CITY_Z_LINES[zi]
    const zb = CITY_Z_LINES[zi + 1]
    const band = zb <= CITY.south ? 'S' : za >= CITY.north ? 'N' : 'M'
    const xs = band === 'S' ? [...CITY_SIDE_X, ...CITY_SOUTH_X] : band === 'N' ? [...CITY_SIDE_X, ...CITY_NORTH_X] : CITY_SIDE_X
    const lines = [...xs].sort((a, b) => a - b)
    for (let xi = 0; xi < lines.length - 1; xi += 1) {
      const xa = lines[xi]
      const xb = lines[xi + 1]
      if (band === 'M' && xa >= -CITY.ring && xb <= CITY.ring) continue // the old world
      const cx = (xa + xb) / 2
      const ux0 = xa + halfAtX(xa) + 2
      const ux1 = xb - halfAtX(xb) - 2
      const uz0 = za + halfAtZ(za, cx) + 2
      const uz1 = zb - halfAtZ(zb, cx) - 2
      const width = ux1 - ux0
      const height = zb - za
      const kind = blockKind(zi, xi, height)
      // rows of the block: [row key, road z, road width, front z, +1 = lot north of road, depth, lot width]
      let rows
      const wa = halfAtZ(za, cx) * 2
      const wb = halfAtZ(zb, cx) * 2
      if (kind === 'mahalla') {
        const zc = (uz0 + uz1) / 2
        const dd = Math.floor(((uz1 - uz0 - MAHALLA_LANE - 2 - 6) / 4) * 2) / 2
        rows = [
          ['a', za, wa, uz0, 1, dd, 16],
          ['b', zc, MAHALLA_LANE, zc - MAHALLA_LANE / 2 - 1, -1, dd, 16],
          ['c', zc, MAHALLA_LANE, zc + MAHALLA_LANE / 2 + 1, 1, dd, 16],
          ['d', zb, wb, uz1, -1, dd, 16],
        ]
      } else {
        const dd = Math.floor(((uz1 - uz0) / 2 - 1.5) * 2) / 2
        const lw = kind === 'mixed' ? 26 : 46
        rows = [
          ['a', za, wa, uz0, 1, dd, lw],
          ['b', zb, wb, uz1, -1, dd, lw],
        ]
      }
      for (const [row, roadZ, roadW, front, dir, depth, lw] of rows) {
        const n = Math.max(1, Math.round((width + 2) / (lw + 2)))
        const w = (width - (n - 1) * 2) / n
        for (let k = 0; k < n; k += 1) {
          const x = ux0 + w / 2 + k * (w + 2)
          const z = front + (dir * depth) / 2
          const plot = {
            id: `C-${zi}-${xi}-${row}${k}`,
            number: number++,
            x: Math.round(x * 10) / 10,
            z,
            w: Math.round(w * 10) / 10,
            d: depth,
            // lots north of their road face −z (π), lots south of it face +z (0)
            rotation: dir > 0 ? Math.PI : 0,
            row: 'X',
            roadZ,
            roadW,
            size: sizeOf(w, depth),
            district: CITY_DISTRICT(x, z),
            public: null,
          }
          plot.price = Math.round((landPrice({ ...plot, row: 'C' }) * 0.8) / 500) * 500
          plots.push(plot)
        }
      }
    }
  }
  // 8) the strips beside the old town, between its ring road and the city ring: rows of lots
  // facing the avenue and the streets that now run through — small lots for houses among them
  const GAP = { x0: RING_X + RING_WIDTH / 2 + 6, x1: CITY.ring - ARTERIAL.w / 2 - 2 }
  const gapRows = [
    // [key, road z, road width, front z, +1 = lot lies north of the road, depth, lot width]
    ['a', 0, AVENUE_WIDTH, AVENUE_WIDTH / 2 + 1, 1, 24, 20],
    ['b', BACK_STREET_Z, STREET_WIDTH, BACK_STREET_Z + 6, 1, 16, 14],
    ['c', OUTER_STREET_Z, STREET_WIDTH, OUTER_STREET_Z - 6, -1, 16, 14],
    ['d', OUTER_STREET_Z, STREET_WIDTH, OUTER_STREET_Z + 6, 1, 34, 40],
  ]
  const gapAll = [
    ...gapRows,
    ...gapRows.map(([key, z, w, front, dir, d, lw]) => [key.toUpperCase(), -z, w, -front, -dir, d, lw]),
    // and along the city ring at the south end
    ['E', CITY.south, ARTERIAL.w, CITY.south + ARTERIAL.w / 2 + 2, 1, 24, 30],
  ]
  for (const s of [-1, 1]) {
    for (const [key, roadZ, roadW, front, dir, d, lw] of gapAll) {
      const span = GAP.x1 - GAP.x0
      const n = Math.floor((span + 2) / (lw + 2))
      const gap = n > 1 ? (span - n * lw) / (n - 1) : 0
      for (let k = 0; k < n; k += 1) {
        const x = s * (GAP.x0 + lw / 2 + k * (lw + gap))
        const plot = {
          id: `G-${s > 0 ? 'E' : 'W'}-${key}${k}`,
          number: number++,
          x: Math.round(x * 10) / 10,
          z: front + (dir * d) / 2,
          w: lw,
          d,
          rotation: dir > 0 ? Math.PI : 0,
          row: 'X',
          roadZ,
          roadW,
          size: sizeOf(lw, d),
          district: s > 0 ? 10 : 9,
          public: null,
        }
        plot.price = Math.round((landPrice({ ...plot, row: 'B' }) * 0.9) / 500) * 500
        plots.push(plot)
      }
    }
  }
  // lots of the new city that a roundabout or a footbridge needs are left out
  return plots.filter((p) => {
    if (p.row !== 'X') return true
    const turned = Math.abs(Math.sin(p.rotation)) > 0.5
    const hx = (turned ? p.d : p.w) / 2
    const hz = (turned ? p.w : p.d) / 2
    const clear = (cx, cz, rad) => Math.max(Math.abs(p.x - cx) - hx, 0) ** 2 + Math.max(Math.abs(p.z - cz) - hz, 0) ** 2 > rad * rad
    return ROUNDABOUTS.every((o) => clear(o.x, o.z, o.outer + 4)) && FOOTBRIDGES.every((b) => clear(b.x, b.z, ARTERIAL.w / 2 + 6))
  })
}

export function plotAllows(plot, kind, design) {
  if (plot.only && !plot.only.includes(kind)) return false
  if (!PLOT_SIZES[plot.size].kinds.includes(kind)) return false
  if (plot.w < (BUILDING_KINDS[kind]?.minW ?? 0)) return false
  if (kind === 'house' && design === 'villa' && plot.size === 'small') return false
  return true
}

/** A rough fair value of a plot with what's built on it — the suggested resale price. */
export function estimateValue(plot, owned) {
  let built = 0
  const kind = BUILDING_KINDS[owned?.kind] ? owned.kind : 'house'
  for (let f = 0; f < (owned?.floors ?? 0); f += BUILDING_KINDS[kind].step) built += stageCost(kind, f)
  return Math.round((plot.price + built * 0.85) / 500) * 500
}

export const MARKET = { MIN_PRICE: 1_000, MAX_PRICE: 10_000_000_000 }

export const TOWN_PLOTS = buildPlots()
export const PLOT_BY_ID = Object.fromEntries(TOWN_PLOTS.map((p) => [p.id, p]))

/** What can be built on a plot. A plot's kind is picked before the first stage and stays;
 * its design can change any time. Each exam-passed stage adds `step` floors. `income` is per
 * floor per hour (collected from the plot, capped at `INCOME_CAP_H` hours). */
export const BUILDING_KINDS = {
  house: {
    name: 'Uy',
    icon: '🏡',
    desc: "O'zingiz va oilangiz uchun uy",
    maxFloors: 4,
    step: 1,
    base: 15_000,
    income: 0,
    designs: [
      { id: 'classic', name: 'Klassik', desc: "To'rt qiyali tom, ayvon" },
      { id: 'cottage', name: 'Kottej', desc: "G'isht devor, ikki qiyali tom" },
      { id: 'modern', name: 'Zamonaviy', desc: 'Tekis tom, katta oynalar, yog\'och panel' },
      { id: 'villa', name: 'Villa', desc: 'Keng, terrasa va basseyn bilan' },
    ],
  },
  shop: {
    name: "Do'kon",
    icon: '🏪',
    desc: 'Shohobcha — har soatda savdodan daromad',
    maxFloors: 2,
    step: 1,
    base: 20_000,
    income: 450,
    designs: [
      { id: 'market', name: 'Mini market', desc: 'Yashil soyabon, meva-sabzavot' },
      { id: 'cafe', name: 'Kafe', desc: "Yo'l-yo'l soyabon, ko'cha stollari" },
      { id: 'flowers', name: "Gul do'koni", desc: 'Pushti vitrina, gullar' },
      { id: 'tech', name: 'Gadjetlar', desc: 'Qora oyna, neon yozuv' },
    ],
  },
  apartment: {
    name: 'Turar-joy',
    icon: '🏢',
    desc: "Ko'p qavatli uy — kvartiralar ijarasidan daromad",
    maxFloors: 16,
    step: 2,
    base: 30_000,
    income: 160,
    designs: [
      { id: 'white', name: 'Oq zamonaviy', desc: 'Oq fasad, shisha balkonlar' },
      { id: 'brick', name: "G'ishtli", desc: 'Qizil g\'isht, klassik derazalar' },
      { id: 'color', name: 'Rangli', desc: 'Har qavatda rangli balkonlar' },
    ],
  },
  office: {
    name: 'Biznes markaz',
    icon: '🏙️',
    desc: "Shisha osmono'par — 100 qavatgacha, ofis ijarasi",
    maxFloors: 100,
    step: 5,
    base: 60_000,
    income: 220,
    designs: [
      { id: 'glass', name: 'Moviy shisha', desc: 'Klassik moviy oyna fasad' },
      { id: 'dark', name: 'Qora shisha', desc: "Qora oyna, po'lat qovurg'alar" },
      { id: 'gold', name: 'Oltin minora', desc: 'Oltin rang oyna, shpil' },
      { id: 'stepped', name: "Pog'onali", desc: "Yuqoriga torayib boruvchi pog'onalar" },
    ],
  },
  stall: {
    name: 'Rasta',
    icon: '🍦',
    desc: "Kichkina savdo rastasi — bog'da sayr qilganlarga sotadi",
    maxFloors: 1,
    step: 1,
    base: 8_000,
    income: 260,
    designs: [
      { id: 'icecream', name: 'Muzqaymoq', desc: "Pushti-oq soyabon, rangli muzqaymoqlar" },
      { id: 'somsa', name: 'Somsa va non', desc: 'Tandir, issiq somsa' },
      { id: 'juice', name: 'Sharbatlar', desc: "Yashil soyabon, meva sharbatlari" },
      { id: 'souvenir', name: 'Suvenirlar', desc: "Ko'k soyabon, sovg'alar va do'ppilar" },
    ],
  },
  hotel: {
    name: 'Mehmonxona',
    icon: '🏨',
    desc: 'Sayyohlar uchun mehmonxona — 30 qavatgacha, xonalar ijarasidan daromad',
    maxFloors: 30,
    step: 3,
    base: 45_000,
    income: 200,
    minW: 17,
    designs: [
      { id: 'resort', name: 'Kurort', desc: 'Oq fasad, moviy shisha balkonlar' },
      { id: 'grand', name: 'Grand', desc: "Qizil g'isht, oltin yozuv, ustunli kirish" },
      { id: 'sky', name: 'Shisha minora', desc: 'Qora shisha, tomida neon yozuv' },
    ],
  },
  school: {
    name: "O'quv markazi",
    icon: '🎓',
    desc: "Bolalar o'qiydigan markaz — o'quvchilar to'lovidan daromad",
    maxFloors: 5,
    step: 1,
    base: 25_000,
    income: 380,
    minW: 17,
    designs: [
      { id: 'brick', name: "G'isht maktab", desc: "Qizil g'isht, soat minorasi, bayroq" },
      { id: 'modern', name: 'Zamonaviy', desc: 'Rangli panellar, katta oynalar' },
      { id: 'campus', name: 'Kampus', desc: "Shisha atrium, tomida bog'" },
    ],
  },
  mall: {
    name: 'Savdo markazi',
    icon: '🛍️',
    desc: "Ulkan savdo markazi — eng katta daromad, keng hovli kerak",
    maxFloors: 4,
    step: 1,
    base: 80_000,
    income: 1_500,
    minW: 32,
    designs: [
      { id: 'glass', name: 'Shisha atrium', desc: 'Moviy shisha, keng kirish' },
      { id: 'stone', name: 'Oq tosh', desc: 'Tosh fasad, baland ustunlar' },
      { id: 'neon', name: 'Neon', desc: "Qora fasad, rangli neon chiziqlar" },
    ],
  },
}

export const INCOME_CAP_H = 24

export function kindOf(plot) {
  return BUILDING_KINDS[plot?.kind] ? plot.kind : 'house'
}

/** A fully built house can grow into an apartment block, and that into an office tower. */
export const UPGRADE_PATH = { house: 'apartment', apartment: 'office' }

/** What a maxed building can turn into on this plot (null if nothing / plot too small). */
export function upgradeOf(plot, kind, floors) {
  const next = UPGRADE_PATH[kind]
  if (!next || floors < BUILDING_KINDS[kind].maxFloors) return null
  const design = BUILDING_KINDS[next].designs.find((d) => plotAllows(plot, next, d.id))
  return design ? { kind: next, design: design.id } : null
}

/** Stage index (1-based) the next build would be. */
export function nextStage(kind, floors) {
  return Math.floor(floors / BUILDING_KINDS[kind].step) + 1
}

/** Cost of the next stage of building. */
export function stageCost(kind, floors) {
  const k = BUILDING_KINDS[kind]
  return Math.round((k.base * (1 + 0.3 * (nextStage(kind, floors) - 1))) / 100) * 100
}

/** Income piled up since `since` (ms) for a built plot, capped. */
export function pendingIncome(kind, floors, since, now) {
  const perHour = BUILDING_KINDS[kind].income * floors
  if (!perHour || !since) return 0
  const hours = Math.min(INCOME_CAP_H, Math.max(0, now - since) / 3_600_000)
  return Math.floor(perHour * hours)
}

/** Kept for older callers: cost of building house floor `floor`. */
export function floorPrice(floor) {
  return stageCost('house', floor - 1)
}

/** Shop items sold by public places — each gives a temporary boost. */
export const SHOP_ITEMS = {
  palov: { place: 'choyxona', name: 'Osh (palov)', icon: '🍛', price: 2_000, buff: 'scholar', minutes: 20, desc: 'Kutubxona puli ×1.5 — 20 daqiqa' },
  choy: { place: 'choyxona', name: "Ko'k choy", icon: '🫖', price: 400, buff: 'scholar', minutes: 5, desc: 'Kutubxona puli ×1.5 — 5 daqiqa' },
  kit: { place: 'supermarket', name: "Qurilish to'plami", icon: '🧰', price: 3_000, buff: 'builder', uses: 1, desc: 'Keyingi qurilish bosqichi 25% arzon' },
  dinner: { place: 'restaurant', name: 'Oilaviy kechki ovqat', icon: '🍽️', price: 5_000, buff: 'driver', minutes: 20, desc: 'Taksi daromadi +25% — 20 daqiqa' },
}

/** Islamic bank — no interest (riba). Three services:
 *  - Mudaraba: savings are invested as a partner in the town's businesses. The bank's share
 *    is `POOL_SHARE` of every shop / apartment / office's hourly income; investors get
 *    `INVESTOR_SHARE` of it, split by how much each invested. No businesses → no profit.
 *  - Qard al-hasan: an interest-free loan — you pay back exactly what you took.
 *  - Zakat & sadaqa: 2.5% of savings to the town's charity fund, which helps players in need. */
export const BANK = {
  POOL_SHARE: 0.05,
  INVESTOR_SHARE: 0.7,
  /** Cap on the profit rate per hour, so a lone investor in a busy town doesn't get rich. */
  MAX_RATE_H: 0.0015,
  LOAN_MIN_LIMIT: 10_000,
  LOAN_MAX: 100_000,
  ZAKAT_RATE: 0.025,
  /** Nisab — zakat is due only on wealth above this. */
  NISAB: 20_000,
  HELP_AMOUNT: 5_000,
  /** Who may ask the fund for help: less money than this and no plot. */
  HELP_POOR: 3_000,
  HELP_COOLDOWN_MS: 24 * 60 * 60 * 1000,
}

/** Hourly profit rate of the mudaraba pool, from the town's business income. */
export function mudarabaRate(townIncomePerHour, totalInvested) {
  if (!townIncomePerHour || !totalInvested) return 0
  return Math.min(BANK.MAX_RATE_H, (townIncomePerHour * BANK.POOL_SHARE * BANK.INVESTOR_SHARE) / totalInvested)
}

/* ------------------------------------------------------------------ traffic --------- */

/** Traffic light cycle (seconds). Avenue/back streets (along X) and cross streets (along Z)
 * take turns. */
export const LIGHT_CYCLE = { green: 9, yellow: 2 }
const PERIOD = (LIGHT_CYCLE.green + LIGHT_CYCLE.yellow) * 2

/** 'green' | 'yellow' | 'red' for traffic moving along `axis` ('x' or 'z') at time `t` s. */
export function lightState(axis, t) {
  const p = ((t % PERIOD) + PERIOD) % PERIOD
  const phase = axis === 'x' ? p : (p + PERIOD / 2) % PERIOD
  if (phase < LIGHT_CYCLE.green) return 'green'
  if (phase < LIGHT_CYCLE.green + LIGHT_CYCLE.yellow) return 'yellow'
  return 'red'
}

export const TRAFFIC_FINE = 200

/** Traffic-light junctions: where cross streets meet the central avenue. (Back-street
 * crossings are quiet and have no lights.) `hx`/`hz` are the junction box half-sizes. */
export const INTERSECTIONS = CROSS_STREETS_X.map((x) => ({ x, z: 0, hx: STREET_WIDTH / 2, hz: AVENUE_WIDTH / 2 }))

export const HOUSE_STYLES = [
  { id: 'cream', name: 'Krem', wall: '#efe4cf', trim: '#8a6b4a', roof: '#7b3b2a' },
  { id: 'white', name: 'Oq', wall: '#f4f4f1', trim: '#3b4652', roof: '#39424d' },
  { id: 'brick', name: "G'isht", wall: '#a65a3f', trim: '#efe7da', roof: '#4a3b35' },
  { id: 'sky', name: 'Havorang', wall: '#b9d3e3', trim: '#ffffff', roof: '#2f4a63' },
  { id: 'sage', name: 'Zaytun', wall: '#b7c4a5', trim: '#f2efe6', roof: '#5a4636' },
]

/** Car lineup. `maxSpeed` (m/s) and `accel` drive the taxi physics; `fareBonus` is the extra
 * share of every taxi fare a nicer car earns. */
export const CAR_MODELS = [
  { id: 'sedan', name: 'Sport sedan', tier: 'Standart', price: 12_000, maxSpeed: 25, accel: 8.5, fareBonus: 0, desc: "Qo'sh panjarali, chaqqon shahar sedani" },
  { id: 'offroad', name: 'Offroad 4x4', tier: 'Standart', price: 28_000, maxSpeed: 23, accel: 8, fareBonus: 0.08, desc: "Katta g'ildiraklar, qora tom — har qanday yo'lga" },
  { id: 'suv', name: 'Katta jip', tier: 'Premium', price: 45_000, maxSpeed: 26, accel: 9, fareBonus: 0.15, desc: 'Xrom panjara, baland va hashamatli' },
  { id: 'sport', name: 'Muscle kupe', tier: 'Premium', price: 55_000, maxSpeed: 33, accel: 12.5, fareBonus: 0.15, desc: "Uzun kapot, kuchli motor, bo'kirgan ovoz" },
  { id: 'executive', name: 'Biznes sedan', tier: 'Premium', price: 85_000, maxSpeed: 30, accel: 10, fareBonus: 0.3, desc: 'Xrom, charm salon, VIP mijozlar uchun' },
  { id: 'electric', name: 'Elektromobil', tier: 'Lyuks', price: 140_000, maxSpeed: 34, accel: 15, fareBonus: 0.4, desc: 'Jim-jit, bir zumda tezlanish, LED chiziqlar' },
  { id: 'supercar', name: 'Superkar', tier: 'Eksklyuziv', price: 320_000, maxSpeed: 44, accel: 19, fareBonus: 0.6, desc: 'Qanotli afsona — shaharning eng tezi' },
]

export const CAR_TIERS = {
  Standart: { color: '#64748b' },
  Premium: { color: '#2563eb' },
  Lyuks: { color: '#7c3aed' },
  Eksklyuziv: { color: '#d97706' },
}

export const CAR_COLORS = [
  '#f8fafc',
  '#111827',
  '#27272a',
  '#9ca3af',
  '#b91c1c',
  '#7f1d1d',
  '#1d4ed8',
  '#0ea5e9',
  '#0b3d2e',
  '#047857',
  '#f59e0b',
  '#c9a227',
  '#7c3aed',
  '#db2777',
]

export const CAR_COLOR_NAMES = {
  '#f8fafc': 'Marvarid oq',
  '#111827': 'Qora metallik',
  '#27272a': 'Mat qora',
  '#9ca3af': 'Kumush',
  '#b91c1c': 'Qizil',
  '#7f1d1d': 'Vishnya',
  '#1d4ed8': "Ko'k",
  '#0ea5e9': 'Osmon',
  '#0b3d2e': 'Britan yashil',
  '#047857': 'Zumrad',
  '#f59e0b': 'Sariq',
  '#c9a227': 'Oltin',
  '#7c3aed': 'Binafsha',
  '#db2777': 'Pushti',
}

/** Paint finishes that aren't plain gloss metallic. */
export const MATTE_COLORS = ['#27272a']

export const PLAYER_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

export function formatMoney(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/* ------------------------------------------------------------------ taxi ------------- */

export const TAXI = {
  BASE_FARE: 300,
  PER_METER: 6,
  /** Fastest believable average speed (m/s) — trips quicker than this are rejected. */
  MAX_AVG_SPEED: 46,
  /** Arrive within par time → +30%. */
  FAST_BONUS: 0.3,
  MIN_TRIP_METERS: 60,
}

/** Taxi stops: one at the curb in front of every plot / public place. `x, z` is where the car
 * stops (on the road, next to the curb); `walkZ` is where the passenger waits on the sidewalk. */
function buildStops() {
  const stops = []
  const seenPublic = new Set()
  for (const p of TOWN_PLOTS) {
    const kind = p.public?.kind
    if (kind && seenPublic.has(kind)) continue
    if (kind) seenPublic.add(kind)
    // lots on a road running north–south: stop by the kerb, passenger beside the lot
    if (p.roadX !== undefined) {
      const side = Math.sign(p.x - p.roadX) || 1
      stops.push({
        id: p.id,
        name: `Hovli №${p.number}`,
        x: p.roadX + side * (p.roadW / 2 - 1.6),
        z: p.z,
        walkX: p.roadX + side * (p.roadW / 2 + 1.5),
        walkZ: p.z,
        public: false,
      })
      continue
    }
    // the kerb of the plot's road on the plot's side
    const toward = Math.sign(p.z - p.roadZ) || 1
    stops.push({
      id: p.id,
      name: p.public ? p.public.name : `Hovli №${p.number}`,
      x: p.x,
      z: p.roadZ + toward * (p.roadW / 2 - 1.6),
      walkZ: p.roadZ + toward * (p.roadW / 2 + 1.5),
      public: !!kind,
    })
  }
  return stops
}

export const TAXI_STOPS = [...buildStops(), ...LANDMARK_STOPS.map((st) => ({ ...st, public: true }))]
export const STOP_BY_ID = Object.fromEntries(TAXI_STOPS.map((s) => [s.id, s]))

export function stopDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

/** Fare for a trip, before the speed bonus. */
export function taxiFare(from, to) {
  return Math.round(TAXI.BASE_FARE + stopDistance(from, to) * TAXI.PER_METER)
}

/** Seconds that count as a "fast" delivery. */
export function taxiParSeconds(from, to) {
  return Math.round(stopDistance(from, to) / 11 + 12)
}

/** True if the point (a car center) is on a ground-level road or sidewalk. */
export function isDrivable(x, z, margin = 1.1) {
  if (x < WORLD.minX + margin || x > WORLD.maxX - margin || z < WORLD.minZ + margin || z > WORLD.maxZ - margin) return false
  for (const o of ROUNDABOUTS) {
    const d = Math.hypot(x - o.x, z - o.z)
    if (d < o.island + margin) return false // the island in the middle
    if (d <= o.outer + 1 - margin) return true
  }
  for (const r of X_ROADS) {
    if (Math.abs(x) <= r.xMax && Math.abs(z - r.z) <= r.w / 2 + SIDEWALK - margin) return true
  }
  for (const r of Z_ROADS) {
    if (Math.abs(x - r.x) <= r.w / 2 - margin + 1 && z >= r.z1 && z <= r.z2) return true
  }
  for (const r of NX_ROADS) {
    if (x >= r.x1 - 0.5 && x <= r.x2 + 0.5 && Math.abs(z - r.z) <= r.w / 2 - margin + 1) {
      if (!(r.median && Math.abs(z - r.z) < r.median / 2 + margin * 0.6)) return true
    }
  }
  for (const r of NZ_ROADS) {
    if (z >= r.z1 - 0.5 && z <= r.z2 + 0.5 && Math.abs(x - r.x) <= r.w / 2 - margin + 1) {
      if (!(r.median && Math.abs(x - r.x) < r.median / 2 + margin * 0.6)) return true
    }
  }
  for (const a of ARCS) if (onArc(a, x, z, 1 - margin)) return true
  return false
}

/** One step of a car between ground and the expressways. Returns the layer the car is on
 * after moving to (nx, nz) — 'ground' or 'bridge' — or null if it can't go there. */
export function driveLayer(layer, z, nx, nz, margin = 1.1) {
  const strip = OVERPASS.xs.some((ox) => Math.abs(nx - ox) <= OVERPASS.half - margin)
  const az = Math.abs(nz)
  if (layer === 'bridge') {
    if (strip && az <= OVERPASS.end + 2) return 'bridge'
    // only at the bottom of a ramp can you turn off onto the ground roads
    if (deckHeight(z) < 0.6 && isDrivable(nx, nz, margin)) return 'ground'
    return null
  }
  if (strip && az > OVERPASS.groundEnd && az <= OVERPASS.end + 2) return deckHeight(nz) < 0.6 ? 'bridge' : null
  return isDrivable(nx, nz, margin) ? 'ground' : null
}

/* ------------------------------------------------------------------ street lamps ------ */

/** Lamps stand every `LAMP_SPACING` m along every road along X, offset so none lands in a
 * junction. Each row: `z` of the pole, `dir` toward the road (±z). */
export const LAMP_SPACING = 25
const FULL = { start: -RING_X + 12.5, count: 24 }
const AVENUE_W = { start: -287.5, count: 11 }
const AVENUE_E = { start: 37.5, count: 11 }
const RING_LAMPS = { start: -237.5, count: 20 }
export const LAMP_ROWS = [
  ...[AVENUE_W, AVENUE_E].flatMap((part) => [
    { z: AVENUE_WIDTH / 2 + 0.6, dir: -1, ...part },
    { z: -(AVENUE_WIDTH / 2 + 0.6), dir: 1, ...part },
  ]),
  ...[1, -1].flatMap((s) => [
    { z: s * (BACK_STREET_Z - STREET_WIDTH / 2 - 0.6), dir: s, ...FULL },
    { z: s * (OUTER_STREET_Z + STREET_WIDTH / 2 + 0.6), dir: -s, ...FULL },
    { z: s * (RING_Z - RING_WIDTH / 2 - 0.6), dir: s, ...RING_LAMPS },
  ]),
]
/** Lamp rows of the north district's roads along X. */
LAMP_ROWS.push(
  { z: RING_Z + RING_WIDTH / 2 + 0.6, dir: -1, start: -362.5, count: 30 },
  { z: NORTH.top - RING_WIDTH / 2 - 0.6, dir: 1, start: -362.5, count: 30 },
  { z: NORTH.mid + NORTH_W / 2 + 0.6, dir: -1, start: 237.5, count: 8 },
  { z: NORTH.mid + NORTH_W / 2 + 0.6, dir: -1, start: -412.5, count: 8 },
  { z: NORTH.street + NORTH_W / 2 + 0.6, dir: -1, start: 37.5, count: 7 },
  { z: NORTH.street + NORTH_W / 2 + 0.6, dir: -1, start: -187.5, count: 7 },
  ...PARK_LANES.flatMap((z) => [
    { z: z - 5.6, dir: 1, start: 37.5, count: 7 },
    { z: z - 5.6, dir: 1, start: -187.5, count: 7 },
  ]),
)
/** Lamps along the city's streets: one side of every street, every 25 m. */
{
  const rowFor = (z, x1, x2, side) => {
    const start = Math.ceil((x1 + 6) / LAMP_SPACING) * LAMP_SPACING + 12.5
    const count = Math.max(0, Math.floor((x2 - 6 - start) / LAMP_SPACING) + 1)
    if (count > 0) LAMP_ROWS.push({ z: z + side * (halfAtZ(z, x2 > 0 ? x2 : x1) + 0.6), dir: -side, start, count })
  }
  for (const z of CITY_Z_LINES) {
    if (z <= CITY.south || z >= CITY.north) rowFor(z, -CITY.outerX, CITY.outerX, z <= CITY.south ? -1 : 1)
    else {
      rowFor(z, -CITY.outerX, -CITY.ring, 1)
      rowFor(z, CITY.ring, CITY.outerX, 1)
    }
  }
}
/** Lamp columns along roads running north–south: `x` of the pole, `dir` toward the road
 * (±x), lamps every LAMP_SPACING from `start`. */
export const LAMP_COLS = [
  ...[1, -1].flatMap((s) => [
    { x: s * (NORTH.x - RING_WIDTH / 2 - 0.6), dir: s, start: 212.5, count: 25 },
    { x: s * (NORTH.inner + NORTH_W / 2 + 0.6), dir: -s, start: 162.5, count: 29 },
    // boulevard, on the outer kerbs
    { x: s * 11.6, dir: -s, start: 162.5, count: 6 },
    // along the park's central canal
    { x: s * 17, dir: -s, start: 337.5, count: 21 },
  ]),
  // the city's streets running north–south
  ...CITY_SIDE_X.map((x) => ({ x: x + (x < 0 ? -1 : 1) * (halfAtX(x) + 0.6), dir: x < 0 ? 1 : -1, start: CITY.outerS + 12.5, count: Math.floor((CITY.outerN - CITY.outerS - 25) / LAMP_SPACING) + 1 })),
  ...CITY_SOUTH_X.map((x) => ({ x: x + CITY_W / 2 + 0.6, dir: -1, start: CITY.outerS + 12.5, count: Math.floor((CITY.south - CITY.outerS - 25) / LAMP_SPACING) + 1 })),
  ...CITY_NORTH_X.map((x) => ({ x: x + CITY_W / 2 + 0.6, dir: -1, start: CITY.north + 12.5, count: Math.floor((CITY.outerN - CITY.north - 25) / LAMP_SPACING) + 1 })),
]
/** Lamps along the ring road's east/west sides (between the junctions). */
export const RING_SIDE_LAMP_Z = [-62, -21, 21, 62]
/** Lamps on the expressway decks. */
export const DECK_LAMP_Z = [-87.5, -62.5, -37.5, -12.5, 12.5, 37.5, 62.5, 87.5]
