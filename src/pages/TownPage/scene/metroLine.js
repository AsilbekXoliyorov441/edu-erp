import { CITY } from '@/shared/config/town'

/** The elevated metro's line and timetable (pure maths, no rendering). The line is a rounded
 * rectangle over the city ring; positions along it are metres from the middle of its south
 * side, going east. Trains follow a fixed timetable taken from the wall clock, so every
 * player sees them in the same place, and stop DWELL seconds at each station. */

export const DECK = 9.5 // top of the deck
const CORNER_R = 40
const SPEED = 22 // cruising speed, m/s
const DWELL = 5 // seconds at each station
export const CARS = 4
export const CAR_LEN = 17
export const CAR_GAP = 1.2

const STATIONS = [
  { name: 'Chilonzor', x: -150, z: CITY.south },
  { name: 'Mirobod', x: 150, z: CITY.south },
  { name: 'Sharqiy', x: CITY.ring, z: 110 },
  { name: "Bolalar bog'i", x: CITY.ring, z: 430 },
  { name: 'Masjid', x: 150, z: CITY.north },
  { name: 'Istirohat', x: -150, z: CITY.north },
  { name: 'Stadion', x: -CITY.ring, z: 430 },
  { name: "G'arbiy", x: -CITY.ring, z: 110 },
]

/* ---------------------------------------------------------------- the line's path ---- */

function buildLine() {
  const X = CITY.ring
  const Z0 = CITY.south
  const Z1 = CITY.north
  const R = CORNER_R
  const pts = []
  const line = (ax, az, bx, bz) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2))
    for (let k = 0; k < n; k += 1) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n])
  }
  const arc = (cx, cz, a0, a1) => {
    const n = 24
    for (let k = 0; k < n; k += 1) {
      const a = a0 + ((a1 - a0) * k) / n
      pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R])
    }
  }
  // counter-clockwise seen from above (+x east, +z north): south side going east first
  line(0, Z0, X - R, Z0)
  arc(X - R, Z0 + R, -Math.PI / 2, 0)
  line(X, Z0 + R, X, Z1 - R)
  arc(X - R, Z1 - R, 0, Math.PI / 2)
  line(X - R, Z1, -X + R, Z1)
  arc(-X + R, Z1 - R, Math.PI / 2, Math.PI)
  line(-X, Z1 - R, -X, Z0 + R)
  arc(-X + R, Z0 + R, Math.PI, (Math.PI * 3) / 2)
  line(-X + R, Z0, 0, Z0)
  const cum = [0]
  for (let k = 1; k <= pts.length; k += 1) {
    const a = pts[k - 1]
    const b = pts[k % pts.length]
    cum.push(cum[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  return { pts, cum, length: cum[cum.length - 1] }
}

export const LINE = buildLine()

/** Point and heading at distance `s` along the loop. */
export function at(s, out = {}) {
  const L = LINE.length
  const d = ((s % L) + L) % L
  let lo = 0
  let hi = LINE.cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (LINE.cum[mid] <= d) lo = mid
    else hi = mid
  }
  const a = LINE.pts[lo]
  const b = LINE.pts[(lo + 1) % LINE.pts.length]
  const f = (d - LINE.cum[lo]) / Math.max(1e-6, LINE.cum[lo + 1] - LINE.cum[lo])
  out.x = a[0] + (b[0] - a[0]) * f
  out.z = a[1] + (b[1] - a[1]) * f
  out.heading = Math.atan2(b[0] - a[0], b[1] - a[1])
  return out
}

/** Where each station sits along the loop. */
function stationS(st) {
  let best = 0
  let bestD = Infinity
  LINE.pts.forEach((p, k) => {
    const d = Math.hypot(p[0] - st.x, p[1] - st.z)
    if (d < bestD) {
      bestD = d
      best = LINE.cum[k]
    }
  })
  return best
}
export const STOPS = STATIONS.map((st) => ({ ...st, s: stationS(st) })).sort((a, b) => a.s - b.s)

/** The timetable: dwell at a station, then run to the next one, smoothly speeding up and
 * slowing down (peak speed = SPEED). */
const LEGS = STOPS.map((st, i) => {
  const next = STOPS[(i + 1) % STOPS.length]
  const len = (next.s - st.s + LINE.length) % LINE.length
  return { from: st.s, len, time: (1.5 * len) / SPEED }
})
export const CYCLE = LEGS.reduce((t, l) => t + DWELL + l.time, 0)

/** Distance along the loop of a train's front at time `t` (seconds). */
export function trainS(t) {
  let r = ((t % CYCLE) + CYCLE) % CYCLE
  for (const leg of LEGS) {
    if (r < DWELL) return leg.from
    r -= DWELL
    if (r < leg.time) {
      const u = r / leg.time
      return leg.from + leg.len * u * u * (3 - 2 * u)
    }
    r -= leg.time
  }
  return 0
}

