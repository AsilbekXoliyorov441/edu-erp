import * as THREE from 'three'

/** Lofted car bodies.
 *
 * A body is swept along its length (z, front = +z) through ~70 cross-sections. Each section
 * is a superellipse ("rounded box") whose height, width and squareness come from keyframe
 * curves over t ∈ [0, 1] (0 = rear bumper, 1 = front bumper). Wheel arches are cut by lifting
 * the body's underside in a half-circle over each axle. The glass house is lofted the same way
 * on top, and every quad of it is painted or glazed by where it sits — so the roof and the
 * A/B/C pillars are paint and the windows are glass, all one smooth shape.
 *
 * Heights are absolute meters above the ground. */

const SPECS = {
  /** Compact sport sedan. */
  sedan: {
    L: 4.7, W: 1.84, r: 0.35, axle: [-1.42, 1.38], n: 4.2,
    top: [[0, 0.93], [0.04, 0.99], [0.13, 1.02], [0.24, 1.0], [0.6, 0.98], [0.66, 0.97], [0.8, 0.92], [0.92, 0.86], [0.97, 0.79], [1, 0.66]],
    bot: [[0, 0.44], [0.07, 0.3], [0.93, 0.28], [1, 0.36]],
    plan: [[0, 0.84], [0.06, 0.95], [0.2, 1], [0.78, 1], [0.93, 0.95], [1, 0.8]],
    cabin: { t0: 0.2, t1: 0.665, roof: [[0.2, 1.0], [0.28, 1.25], [0.35, 1.4], [0.45, 1.44], [0.53, 1.41], [0.6, 1.24], [0.665, 0.98]], roofBand: [0.33, 0.55], pillars: [[0.2, 0.3], [0.445, 0.465]], tumble: 0.76, n: 3.2 },
    style: 'sedan',
  },
  /** Long luxury sedan. */
  executive: {
    L: 5.2, W: 1.92, r: 0.37, axle: [-1.62, 1.55], n: 4.5,
    top: [[0, 0.95], [0.04, 1.02], [0.12, 1.05], [0.22, 1.04], [0.62, 1.02], [0.68, 1.01], [0.82, 0.98], [0.93, 0.92], [0.98, 0.84], [1, 0.72]],
    bot: [[0, 0.45], [0.06, 0.3], [0.94, 0.3], [1, 0.38]],
    plan: [[0, 0.86], [0.05, 0.96], [0.18, 1], [0.8, 1], [0.94, 0.96], [1, 0.84]],
    cabin: { t0: 0.18, t1: 0.68, roof: [[0.18, 1.03], [0.26, 1.3], [0.33, 1.47], [0.5, 1.5], [0.57, 1.47], [0.63, 1.3], [0.68, 1.02]], roofBand: [0.31, 0.59], pillars: [[0.18, 0.29], [0.46, 0.48]], tumble: 0.78, n: 3.4 },
    style: 'executive',
  },
  /** Muscle coupe: long hood, short deck, fastback roof. */
  sport: {
    L: 4.8, W: 1.94, r: 0.37, axle: [-1.42, 1.42], n: 5,
    top: [[0, 0.9], [0.04, 0.97], [0.14, 0.99], [0.26, 0.97], [0.6, 0.98], [0.66, 0.99], [0.8, 0.97], [0.92, 0.9], [0.98, 0.8], [1, 0.62]],
    bot: [[0, 0.4], [0.06, 0.22], [0.94, 0.22], [1, 0.28]],
    plan: [[0, 0.9], [0.05, 0.97], [0.18, 1], [0.82, 1], [0.95, 0.96], [1, 0.88]],
    cabin: { t0: 0.17, t1: 0.62, roof: [[0.17, 0.98], [0.3, 1.18], [0.4, 1.3], [0.49, 1.3], [0.55, 1.2], [0.62, 0.99]], roofBand: [0.37, 0.51], pillars: [[0.17, 0.37]], tumble: 0.7, n: 3 },
    crown: [[0, 0], [0.62, 0], [0.72, 0.05], [0.95, 0.05], [1, 0.02]],
    style: 'muscle',
  },
  /** Big body-on-frame SUV. */
  suv: {
    L: 4.95, W: 1.98, r: 0.42, axle: [-1.45, 1.4], n: 6,
    top: [[0, 1.3], [0.03, 1.35], [0.1, 1.36], [0.74, 1.35], [0.8, 1.31], [0.92, 1.27], [0.98, 1.2], [1, 1.06]],
    bot: [[0, 0.58], [0.06, 0.46], [0.94, 0.46], [1, 0.56]],
    plan: [[0, 0.93], [0.04, 0.99], [0.96, 0.99], [1, 0.93]],
    cabin: { t0: 0.025, t1: 0.75, roof: [[0.025, 1.33], [0.04, 1.86], [0.09, 1.93], [0.6, 1.93], [0.66, 1.86], [0.75, 1.33]], roofBand: [0.07, 0.63], pillars: [[0.025, 0.09], [0.33, 0.35], [0.54, 0.565]], tumble: 0.9, n: 5 },
    style: 'suv',
  },
  /** Boxy off-roader with a black hard top. */
  offroad: {
    L: 4.45, W: 1.9, r: 0.45, axle: [-1.42, 1.33], n: 10,
    top: [[0, 1.22], [0.025, 1.27], [0.7, 1.27], [0.96, 1.25], [0.99, 1.2], [1, 1.12]],
    bot: [[0, 0.66], [0.05, 0.56], [0.95, 0.56], [1, 0.64]],
    plan: [[0, 0.9], [0.03, 0.96], [0.96, 0.95], [1, 0.9]],
    cabin: { t0: 0.02, t1: 0.66, roof: [[0.02, 1.28], [0.03, 1.95], [0.6, 1.95], [0.63, 1.9], [0.66, 1.29]], roofBand: [0.03, 0.61], pillars: [[0.02, 0.07], [0.3, 0.33]], tumble: 0.97, n: 10, roofColor: '#111111' },
    style: 'offroad',
  },
  /** Smooth electric fastback. */
  electric: {
    L: 4.75, W: 1.93, r: 0.36, axle: [-1.45, 1.42], n: 3.6,
    top: [[0, 0.95], [0.04, 1.0], [0.12, 1.0], [0.6, 0.94], [0.66, 0.92], [0.8, 0.86], [0.93, 0.78], [0.98, 0.7], [1, 0.58]],
    bot: [[0, 0.4], [0.06, 0.24], [0.94, 0.24], [1, 0.32]],
    plan: [[0, 0.86], [0.06, 0.96], [0.2, 1], [0.8, 1], [0.94, 0.94], [1, 0.82]],
    cabin: { t0: 0.1, t1: 0.66, roof: [[0.1, 1.0], [0.2, 1.22], [0.32, 1.4], [0.44, 1.45], [0.52, 1.42], [0.6, 1.2], [0.66, 0.93]], roofBand: [0.36, 0.5], pillars: [[0.1, 0.2], [0.43, 0.45]], tumble: 0.74, n: 3, roofGlass: true },
    style: 'electric',
  },
  /** Wedge supercar: cab-forward, engine behind the seats. */
  supercar: {
    L: 4.8, W: 2.04, r: 0.35, axle: [-1.38, 1.33], n: 3.2,
    top: [[0, 0.88], [0.04, 0.94], [0.15, 0.97], [0.3, 0.96], [0.5, 0.86], [0.6, 0.82], [0.76, 0.81], [0.86, 0.76], [0.94, 0.62], [1, 0.42]],
    /** The hood dips between the raised front fenders. */
    crown: [[0, 0], [0.56, 0], [0.66, 0.1], [0.84, 0.2], [1, 0.12]],
    bot: [[0, 0.3], [0.04, 0.13], [0.96, 0.13], [1, 0.16]],
    plan: [[0, 0.9], [0.05, 0.98], [0.25, 1], [0.45, 0.97], [0.75, 0.97], [0.92, 0.9], [1, 0.74]],
    cabin: { t0: 0.26, t1: 0.62, roof: [[0.26, 0.97], [0.34, 1.06], [0.41, 1.12], [0.47, 1.12], [0.54, 1.03], [0.62, 0.81]], roofBand: [0.38, 0.48], pillars: [[0.26, 0.37]], tumble: 0.62, n: 3.2 },
    style: 'supercar',
  },
}

/** Monotone cubic interpolation through [t, v] keyframes (no overshoot). */
function curve(keys) {
  const n = keys.length
  const xs = keys.map((k) => k[0])
  const ys = keys.map((k) => k[1])
  const d = []
  const m = []
  for (let i = 0; i < n - 1; i += 1) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i += 1) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < n - 1; i += 1) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      m[i] = tau * a * d[i]
      m[i + 1] = tau * b * d[i]
    }
  }
  return (t) => {
    if (t <= xs[0]) return ys[0]
    if (t >= xs[n - 1]) return ys[n - 1]
    let i = 0
    while (t > xs[i + 1]) i += 1
    const h = xs[i + 1] - xs[i]
    const u = (t - xs[i]) / h
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1
    const h10 = u ** 3 - 2 * u ** 2 + u
    const h01 = -2 * u ** 3 + 3 * u ** 2
    const h11 = u ** 3 - u ** 2
    return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1]
  }
}

/** Point on a superellipse of half-sizes a×b and exponent n at angle th. */
function superPoint(th, a, b, n) {
  const c = Math.cos(th)
  const s = Math.sin(th)
  return [a * Math.sign(c) * Math.abs(c) ** (2 / n), b * Math.sign(s) * Math.abs(s) ** (2 / n)]
}

/** Samplers for a model — also used to place lights, mirrors, wheels. */
export function carShape(model) {
  const spec = SPECS[model] ?? SPECS.sedan
  const top = curve(spec.top)
  const bot = curve(spec.bot)
  const plan = curve(spec.plan)
  const roof = curve(spec.cabin.roof)
  const crown = curve(spec.crown ?? [[0, 0], [1, 0]])
  const zOf = (t) => -spec.L / 2 + t * spec.L
  const tOf = (z) => (z + spec.L / 2) / spec.L
  const halfW = (t) => (spec.W / 2) * plan(t)
  /** Underside height including the wheel-arch cut-outs. */
  const under = (t) => {
    const z = zOf(t)
    let y = bot(t)
    const R = spec.r + 0.07
    for (const az of spec.axle) {
      const dz = Math.abs(z - az)
      if (dz < R) y = Math.max(y, spec.r + Math.sqrt(R * R - dz * dz))
    }
    return Math.min(y, top(t) - 0.07)
  }
  return { spec, top, bot, plan, roof, crown, zOf, tOf, halfW, under }
}

export function carSpec(model) {
  return SPECS[model] ?? SPECS.sedan
}

/** Height of the roof — used to sit a taxi sign on it. */
export function carRoofY(model) {
  const { spec, roof } = carShape(model)
  return roof((spec.cabin.roofBand[0] + spec.cabin.roofBand[1]) / 2)
}

const STATIONS = 72
const RING = 36

/** Loft a closed tube with flat end caps. `section(t)` → { yb, yt, a, n, tumble }. Quads are
 * assigned to material group 0 or 1 by `pick(t, sinTheta, cosTheta)`. */
function loft({ t0, t1, stations, section, zOf, pick }) {
  const pos = []
  const groups = [[], []]
  const ringStart = []
  for (let i = 0; i <= stations; i += 1) {
    const t = t0 + ((t1 - t0) * i) / stations
    const { yb, yt, a, n, tumble, crown = 0 } = section(t)
    const yc = (yb + yt) / 2
    const b = (yt - yb) / 2
    ringStart.push(pos.length / 3)
    for (let j = 0; j < RING; j += 1) {
      const th = (j / RING) * Math.PI * 2
      const [px, py] = superPoint(th, a, b, n)
      const s = Math.sin(th)
      // sides lean in toward the top (tumblehome) and tuck under at the bottom
      const k = s > 0 ? 1 - (1 - tumble) * s : 1 - 0.05 * -s
      // crown < 0 lowers the middle of the top surface (hood between fenders)
      const dip = s > 0 ? crown * s * (1 - Math.min(1, (px / a) ** 2)) : 0
      pos.push(px * k, yc + py - dip, zOf(t))
    }
  }
  for (let i = 0; i < stations; i += 1) {
    const tm = t0 + ((t1 - t0) * (i + 0.5)) / stations
    for (let j = 0; j < RING; j += 1) {
      const a = ringStart[i] + j
      const b = ringStart[i] + ((j + 1) % RING)
      const c = ringStart[i + 1] + j
      const d = ringStart[i + 1] + ((j + 1) % RING)
      const th = ((j + 0.5) / RING) * Math.PI * 2
      const g = pick ? pick(tm, Math.sin(th), Math.cos(th)) : 0
      groups[g].push(a, b, c, b, d, c)
    }
  }
  // caps: duplicate the end rings so they get their own flat normals
  for (const [ri, flip] of [
    [0, true],
    [stations, false],
  ]) {
    const start = pos.length / 3
    const base = ringStart[ri]
    let cx = 0
    let cy = 0
    const cz = pos[base * 3 + 2]
    for (let j = 0; j < RING; j += 1) {
      cx += pos[(base + j) * 3]
      cy += pos[(base + j) * 3 + 1]
      pos.push(pos[(base + j) * 3], pos[(base + j) * 3 + 1], cz)
    }
    pos.push(cx / RING, cy / RING, cz)
    const center = start + RING
    for (let j = 0; j < RING; j += 1) {
      const a = start + j
      const b = start + ((j + 1) % RING)
      if (flip) groups[0].push(center, b, a)
      else groups[0].push(center, a, b)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const index = [...groups[0], ...groups[1]]
  geo.setIndex(index)
  geo.addGroup(0, groups[0].length, 0)
  geo.addGroup(groups[0].length, groups[1].length, 1)
  geo.computeVertexNormals()
  return geo
}

const cache = new Map()

export function buildCarGeometries(model) {
  if (cache.has(model)) return cache.get(model)
  const shape = carShape(model)
  const { spec, top, roof, crown, halfW, under, zOf } = shape
  const c = spec.cabin

  const body = loft({
    t0: 0,
    t1: 1,
    stations: STATIONS,
    zOf,
    section: (t) => ({ yb: under(t), yt: top(t), a: halfW(t), n: spec.n, tumble: 0.93, crown: crown(t) }),
  })

  const inPillar = (t) => c.pillars.some(([a, b]) => t >= a && t <= b)
  const inRoof = (t) => t >= c.roofBand[0] && t <= c.roofBand[1]
  // group 0 = paint (roof, pillars), group 1 = glass
  const cabin = loft({
    t0: c.t0,
    t1: c.t1,
    stations: 44,
    zOf,
    section: (t) => {
      // Centered on the beltline so only the upper half (which leans in) shows above the body.
      const base = top(t) - 0.04
      const yt = Math.max(roof(t), base + 0.02)
      return { yb: 2 * base - yt, yt, a: halfW(t) * 0.82, n: c.n, tumble: c.tumble }
    },
    pick: (t, s, co) => {
      if (s < 0) return 0
      const topBand = s > 0.86
      const shoulder = s > 0.6 && !topBand
      if (inRoof(t)) return topBand && c.roofGlass ? 1 : topBand || shoulder ? 0 : inPillar(t) ? 0 : 1
      // windshield / rear window run: glass on top, pillars on the shoulders
      if (topBand) return 1
      if (shoulder && Math.abs(co) > 0.25) return 0
      return inPillar(t) ? 0 : 1
    },
  })

  const tireW = spec.style === 'offroad' ? 0.38 : spec.style === 'supercar' ? 0.34 : 0.28
  const geos = {
    shape,
    body,
    cabin,
    tireW,
    tire: new THREE.CylinderGeometry(spec.r, spec.r, tireW, 36),
    tireSide: new THREE.TorusGeometry(spec.r - 0.07, 0.07, 10, 36),
    rim: new THREE.CylinderGeometry(spec.r * 0.68, spec.r * 0.68, 0.05, 36),
    spoke: new THREE.BoxGeometry(0.03, spec.r * 1.2, 0.06),
    cap: new THREE.CylinderGeometry(spec.r * 0.15, spec.r * 0.15, 0.07, 16),
    disc: new THREE.CylinderGeometry(spec.r * 0.6, spec.r * 0.6, 0.03, 24),
    caliper: new THREE.BoxGeometry(0.09, spec.r * 0.42, 0.15),
    tread: new THREE.BoxGeometry(0.05, tireW + 0.01, 0.11),
  }
  cache.set(model, geos)
  return geos
}
