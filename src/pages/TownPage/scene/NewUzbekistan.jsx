import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@/pages/TownPage/scene/StaticInstances'
import { NORTH, PARK_LANES, RING_Z, TOWN_PLOTS } from '@/shared/config/town'
import { concreteTexture, facadeTexture, grassTexture, signTexture } from '@/pages/TownPage/scene/textures'
import { getMaterials, glowPool, plainMaterial, uplight } from '@/pages/TownPage/scene/materials'
import { followNight } from '@/pages/TownPage/scene/dayNight'
import { Trees } from '@/pages/TownPage/scene/Nature'
import { Baked } from '@/pages/TownPage/scene/Baked'
import { Car } from '@/pages/TownPage/scene/Car'

/** The "Yangi O'zbekiston" district north of the town: a grand park with the independence
 * monument at the end of a fountain canal, a premium stadium, a recreation park with a lake,
 * a children's park with rides, and a big modern mosque. (Inspired by the real park's
 * layout, not a copy of it.) Static parts are merged with <Baked>; only rides and fountain
 * jets move. */

function seeded(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const PARK = { x0: -212, x1: 212, z0: NORTH.plaza + 26, z1: NORTH.top - 8 }
const MONUMENT_Z = 760

/* ---------------------------------------------------------------- footpaths ----------- */

/** The park's footpaths: one connected network. Every path starts and ends on another path,
 * on the central alley (|x| = 22), on the park lane (z ≈ 536/544) or on the monument plaza,
 * so you can walk anywhere. East side; the west side mirrors it, except near the
 * amphitheatre (west), where the paths lead to its stage instead. */
const PATHS_EAST = [
  [[22, 360], [50, 352], [80, 375], [112, 392], [140, 400]],
  [[140, 400], [160, 430], [150, 470]],
  [[150, 470], [120, 492], [90, 480], [55, 500], [22, 490]],
  [[80, 375], [72, 425], [90, 480]],
  [[150, 470], [140, 505], [146, 533]],
  [[96, 545], [85, 575], [60, 600]],
  [[60, 600], [40, 615], [22, 612]],
  [[60, 600], [92, 630], [120, 620]],
  [[120, 620], [155, 655], [150, 700]],
  [[150, 700], [128, 728], [100, 730], [70, 748], [40, 745]],
  [[120, 620], [105, 675], [100, 730]],
  [[100, 730], [118, 770], [95, 800], [55, 808], [30, 782]],
]
const PATHS_WEST_NORTH = [
  // by the amphitheatre: round its stage to the plaza
  [[150, 700], [118, 708], [90, 712]],
  [[120, 620], [100, 670], [90, 712]],
  [[90, 712], [65, 735], [40, 745]],
  [[90, 712], [100, 735], [106, 752]],
]
const FOOTPATHS = [
  ...PATHS_EAST.map((pts) => ({ pts })),
  ...PATHS_EAST.slice(0, 9).map((pts) => ({ pts: pts.map(([x, z]) => [-x, z]) })),
  ...PATHS_WEST_NORTH.map((pts) => ({ pts: pts.map(([x, z]) => [-x, z]) })),
]
const PATH_W = 2.6

let pathCache = null
/** Sampled footpaths (every ~1.5 m): points with tangents, both sides of the park. */
function footpaths() {
  if (pathCache) return pathCache
  pathCache = []
  {
    for (const f of FOOTPATHS) {
      const curve = new THREE.CatmullRomCurve3(
        f.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
        false,
        'centripetal',
      )
      const n = Math.max(8, Math.round(curve.getLength() / 1.5))
      const samples = []
      for (let k = 0; k <= n; k += 1) {
        const u = k / n
        const p = curve.getPointAt(u)
        const t = curve.getTangentAt(u)
        samples.push({ x: p.x, z: p.z, tx: t.x, tz: t.z })
      }
      pathCache.push(samples)
    }
  }
  return pathCache
}

/** Is (x, z) on (or within `pad` of) a footpath? */
function nearFootpath(x, z, pad) {
  for (const path of footpaths()) for (const s of path) if (Math.abs(s.x - x) < pad && Math.abs(s.z - z) < pad && Math.hypot(s.x - x, s.z - z) < pad) return true
  return false
}

function Footpaths() {
  const m = getMaterials()
  const { geometry, benches, lamps } = useMemo(() => {
    const pos = []
    const uv = []
    const benches = []
    const lamps = []
    for (const path of footpaths()) {
      let along = 0
      for (let k = 0; k < path.length - 1; k += 1) {
        const a = path[k]
        const b = path[k + 1]
        const seg = Math.hypot(b.x - a.x, b.z - a.z)
        const side = (s, w) => [s.x - s.tz * w, 0.03, s.z + s.tx * w]
        const a0 = side(a, -PATH_W / 2)
        const a1 = side(a, PATH_W / 2)
        const b0 = side(b, -PATH_W / 2)
        const b1 = side(b, PATH_W / 2)
        const v0 = along / 3
        const v1 = (along + seg) / 3
        // two triangles, facing up
        pos.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0)
        uv.push(0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1)
        along += seg
        // a bench every ~20 m (alternating sides), a garden lamp every ~30 m
        if (k % 14 === 7) {
          const s = (k / 14) % 2 < 1 ? 1 : -1
          const theta = Math.atan2(-a.tz, a.tx) + (s > 0 ? Math.PI : 0)
          benches.push({ x: a.x - a.tz * 2.4 * s, z: a.z + a.tx * 2.4 * s, rot: theta })
        }
        if (k % 20 === 0) lamps.push({ x: a.x + a.tz * 2, z: a.z - a.tx * 2 })
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    return { geometry: g, benches, lamps }
  }, [])
  const paving = useMemo(() => new THREE.MeshStandardMaterial({ map: concreteTexture([1, 1]), color: '#e6dccb', roughness: 0.9, side: THREE.DoubleSide }), [])
  const pool = glowPool('#ffd9a0', 0.55)
  return (
    <group>
      <mesh geometry={geometry} material={paving} receiveShadow />
      {/* benches: seat + back */}
      <Instances frames={3} limit={benches.length} material={m.wood} castShadow>
        <boxGeometry args={[1.8, 0.1, 0.5]} />
        {benches.map((b, i) => (
          <Instance key={i} position={[b.x, 0.45, b.z]} rotation-y={b.rot} />
        ))}
      </Instances>
      <Instances frames={3} limit={benches.length} material={m.wood} castShadow>
        <boxGeometry args={[1.8, 0.45, 0.08]} />
        {benches.map((b, i) => (
          <Instance key={i} position={[b.x - Math.sin(b.rot) * 0.24, 0.75, b.z - Math.cos(b.rot) * 0.24]} rotation-y={b.rot} />
        ))}
      </Instances>
      <Instances frames={3} limit={benches.length} material={m.metalDark}>
        <boxGeometry args={[1.6, 0.4, 0.4]} />
        {benches.map((b, i) => (
          <Instance key={i} position={[b.x, 0.2, b.z]} rotation-y={b.rot} />
        ))}
      </Instances>
      {/* garden lamps: short posts with glowing globes and a pool of light at night */}
      <Instances frames={3} limit={lamps.length} material={m.metalDark} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 3.2, 8]} />
        {lamps.map((l, i) => (
          <Instance key={i} position={[l.x, 1.6, l.z]} />
        ))}
      </Instances>
      <Instances frames={3} limit={lamps.length} material={m.lamp}>
        <sphereGeometry args={[0.28, 12, 10]} />
        {lamps.map((l, i) => (
          <Instance key={i} position={[l.x, 3.3, l.z]} />
        ))}
      </Instances>
      <Instances frames={3} limit={lamps.length} material={pool}>
        <planeGeometry args={[11, 11]} />
        {lamps.map((l, i) => (
          <Instance key={i} position={[l.x, 0.06, l.z]} rotation-x={-Math.PI / 2} />
        ))}
      </Instances>
    </group>
  )
}

/* ---------------------------------------------------------------- shared bits --------- */

function BigSign({ text, sub, bg, fg, position, rotation = 0, w = 16, h = 3 }) {
  const material = useMemo(() => {
    const tex = signTexture(text, { bg, fg, sub, width: 1024, height: Math.round((1024 * h) / w) })
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, roughness: 0.5 })
    return followNight(mat, 'emissiveIntensity', 1.3, 0.2)
  }, [text, sub, bg, fg, w, h])
  const m = getMaterials()
  return (
    <group position={position} rotation-y={rotation}>
      {[-w / 2 + 0.6, w / 2 - 0.6].map((x) => (
        <mesh key={x} position={[x, -h / 2 - 1, -0.1]} material={m.metalDark} castShadow>
          <boxGeometry args={[0.3, 2.4, 0.3]} />
        </mesh>
      ))}
      <mesh material={material} castShadow>
        <boxGeometry args={[w, h, 0.3]} />
      </mesh>
    </group>
  )
}

/** A flat pointed (Islamic) arch outline, for window and gate recesses. */
function archShape(w, h) {
  const s = new THREE.Shape()
  const spring = h - w * 0.62
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, spring)
  s.quadraticCurveTo(w / 2, h - w * 0.15, 0, h)
  s.quadraticCurveTo(-w / 2, h - w * 0.15, -w / 2, spring)
  s.closePath()
  return s
}
const archCache = new Map()
function archGeometry(w, h) {
  const key = `${w}:${h}`
  if (!archCache.has(key)) archCache.set(key, new THREE.ShapeGeometry(archShape(w, h), 12))
  return archCache.get(key)
}

/** Paving plane. */
function Paving({ x, z, w, d, color = '#ddd6c8', y = 0.05, repeat = 6 }) {
  const tex = useMemo(() => concreteTexture([w / repeat, d / repeat]), [w, d, repeat])
  return (
    <mesh position={[x, y, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} color={color} roughness={0.9} />
    </mesh>
  )
}

function Lawn({ x, z, w, d, color = '#a9cf8c', y = 0.012 }) {
  const tex = useMemo(() => grassTexture([w / 10, d / 10]), [w, d])
  return (
    <mesh position={[x, y, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[w, d]} />
      {/* pushed back in depth so roads and paths drawn over it always win */}
      <meshStandardMaterial map={tex} color={color} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={2} />
    </mesh>
  )
}

/** Warm light on the ground at night (no real light — an additive glow). */
function NightGlow({ x, z, w, d, color = '#ffd9a0', max = 0.6, y = 0.12 }) {
  return (
    <mesh position={[x, y, z]} rotation-x={-Math.PI / 2} material={glowPool(color, max)}>
      <planeGeometry args={[w, d]} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- boulevard ----------- */

function Boulevard() {
  const m = getMaterials()
  const z0 = RING_Z + 7
  const z1 = NORTH.plaza - 25
  const trees = useMemo(() => {
    const list = []
    for (let z = z0 + 6; z < z1 - 4; z += 13) list.push({ x: 0, z, s: 0.95 })
    return list
  }, [z0, z1])
  return (
    <group>
      <mesh position={[0, 0.15, (z0 + z1) / 2]} material={m.stone} receiveShadow>
        <boxGeometry args={[4, 0.3, z1 - z0]} />
      </mesh>
      <Lawn x={0} z={(z0 + z1) / 2} w={3.4} d={z1 - z0 - 0.6} y={0.31} />
      <Trees trees={trees} />
      <BigSign text="YANGI O'ZBEKISTON" sub="bog'i va majmuasi" bg="#0f5132" fg="#fde68a" position={[-24, 5.5, RING_Z + 14]} w={18} h={3.2} />
    </group>
  )
}

/* ---------------------------------------------------------------- grand park ---------- */

/** The independence monument: stepped marble base, a tall tapering tower with gold ribs and
 * bands, an arcaded lantern, a gold dome and a stylised gold bird with open wings. */
function Monument() {
  const marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.35, metalness: 0.05 }), [])
  const gold = plainMaterial('#d4a537', { metalness: 0.9, roughness: 0.22 })
  const shaftH = 52
  const shaft = useMemo(() => {
    // 4-sided taper: cylinder with 4 radial segments, rotated so faces point along the axes
    const g = new THREE.CylinderGeometry(2.6, 4.4, shaftH, 4, 1)
    g.rotateY(Math.PI / 4)
    return g
  }, [])
  const base = 9
  const lantern = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffd27a' }), 'emissiveIntensity', 3, 0.2), [])
  return (
    <group>
      {/* stepped plinth */}
      {[
        [26, 1.2],
        [20, 1.6],
        [14, 2.2],
      ].reduce(
        (acc, [w, h]) => {
          acc.list.push(
            <mesh key={w} position-y={acc.y + h / 2} material={marble} castShadow receiveShadow>
              <boxGeometry args={[w, h, w]} />
            </mesh>,
          )
          acc.y += h
          return acc
        },
        { list: [], y: 0 },
      ).list}
      <mesh position-y={5 + 2} material={marble} castShadow>
        <boxGeometry args={[base, 4, base]} />
      </mesh>
      {/* gold relief bands round the pedestal */}
      <mesh position-y={5 + 3.6} material={gold}>
        <boxGeometry args={[base + 0.2, 0.35, base + 0.2]} />
      </mesh>
      {/* the tower */}
      <mesh position-y={9 + shaftH / 2} geometry={shaft} material={marble} castShadow receiveShadow />
      {[12, 24, 36, 48].map((y) => {
        const r = 4.4 - ((4.4 - 2.6) * y) / shaftH
        return (
          <mesh key={y} position-y={9 + y} rotation-y={Math.PI / 4} material={gold}>
            <cylinderGeometry args={[r + 0.12, r + 0.12, 0.45, 4]} />
          </mesh>
        )
      })}
      {/* gold ribs up the corners */}
      {[0, 1, 2, 3].map((k) => {
        const a = (k * Math.PI) / 2
        const r0 = 4.4 / Math.SQRT2
        const r1 = 2.6 / Math.SQRT2
        const len = Math.hypot(shaftH, r0 - r1)
        const tilt = Math.atan2(r0 - r1, shaftH)
        return (
          <group key={k} rotation-y={a}>
            <mesh position={[(r0 + r1) / 2, 9 + shaftH / 2, (r0 + r1) / 2]} rotation={[-tilt, 0, tilt]} material={gold}>
              <boxGeometry args={[0.3, len, 0.3]} />
            </mesh>
          </group>
        )
      })}
      {/* lantern with arches, dome, bird */}
      <group position-y={9 + shaftH}>
        <mesh position-y={0.4} material={gold}>
          <cylinderGeometry args={[3.3, 3.3, 0.8, 24]} />
        </mesh>
        {Array.from({ length: 8 }, (_, k) => {
          const a = (k / 8) * Math.PI * 2
          return (
            <mesh key={k} position={[Math.cos(a) * 2.6, 2.8, Math.sin(a) * 2.6]} material={marble} castShadow>
              <cylinderGeometry args={[0.25, 0.25, 4, 10]} />
            </mesh>
          )
        })}
        <mesh position-y={2.8} material={lantern}>
          <cylinderGeometry args={[1.6, 1.6, 3.6, 16]} />
        </mesh>
        <mesh position-y={5} material={gold}>
          <cylinderGeometry args={[3.2, 3.2, 0.6, 24]} />
        </mesh>
        <mesh position-y={5.2} material={gold} castShadow>
          <sphereGeometry args={[3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position-y={8.6} material={gold}>
          <cylinderGeometry args={[0.12, 0.2, 1.2, 8]} />
        </mesh>
        {/* stylised bird with raised wings */}
        <group position-y={10}>
          <mesh rotation-x={Math.PI / 2} material={gold} castShadow>
            <coneGeometry args={[0.45, 2.6, 12]} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 1.9, 0.9, 0]} rotation-z={s * 0.55} material={gold} castShadow>
              <boxGeometry args={[3.6, 0.12, 1.4]} />
            </mesh>
          ))}
          <mesh position={[0, 0.2, -1.6]} rotation-x={-0.4} material={gold}>
            <boxGeometry args={[1, 0.1, 1.4]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/** Stepped half-bowl of seats facing +z. */
function Amphitheater({ x, z, rotation = 0 }) {
  const stone = getMaterials().stone
  const geo = useMemo(() => {
    const pts = [new THREE.Vector2(10, 0)]
    for (let k = 0; k < 8; k += 1) {
      pts.push(new THREE.Vector2(12 + k * 2.4, 0.55 * k + 0.55))
      pts.push(new THREE.Vector2(12 + (k + 1) * 2.4, 0.55 * k + 0.55))
    }
    pts.push(new THREE.Vector2(12 + 8 * 2.4, 0))
    return new THREE.LatheGeometry(pts, 40, Math.PI / 2, Math.PI)
  }, [])
  return (
    <group position={[x, 0, z]} rotation-y={rotation}>
      <mesh geometry={geo} material={stone} castShadow receiveShadow />
      <mesh position-y={0.3} rotation-x={-Math.PI / 2} material={plainMaterial('#b45309', { roughness: 0.6 })} receiveShadow>
        <circleGeometry args={[9, 32, 0, Math.PI]} />
      </mesh>
    </group>
  )
}

function GrandPark() {
  const m = getMaterials()
  const cz = (PARK.z0 + PARK.z1) / 2
  const canalZ0 = PARK.z0 + 14
  const canalZ1 = MONUMENT_Z - 80
  const stoneRim = plainMaterial('#d6cfc1', { roughness: 0.6 })

  const trees = useMemo(() => {
    const list = []
    // four rows of trees along the central alley
    for (let z = PARK.z0 + 8; z < MONUMENT_Z - 48; z += 12) for (const x of [-26, -36, 26, 36]) list.push({ x, z, s: 1 })
    // groves in the outer gardens
    let n = 7
    for (let x = PARK.x0 + 10; x < PARK.x1 - 10; x += 13) {
      for (let z = PARK.z0 + 10; z < PARK.z1 - 6; z += 13) {
        n += 1
        if (Math.abs(x) < 70) continue
        if (Math.hypot(x + 120, z - MONUMENT_Z) < 40) continue // amphitheatre
        if (seeded(n) > 0.62) continue
        list.push({ x: x + (seeded(n + 3) - 0.5) * 8, z: z + (seeded(n + 5) - 0.5) * 8, s: 0.9 + seeded(n + 9) * 0.6 })
      }
    }
    // (trees on the lanes and the lots get dropped below)
    // a ring of trees round the monument plaza
    for (let k = 0; k < 28; k += 1) {
      const a = (k / 28) * Math.PI * 2
      list.push({ x: Math.cos(a) * 54, z: MONUMENT_Z + Math.sin(a) * 54, s: 1.1 })
    }
    const lots = TOWN_PLOTS.filter((p) => p.row === 'P' || p.row === 'R').map((p) => {
      const turned = Math.abs(Math.sin(p.rotation)) > 0.5
      return { x: p.x, z: p.z, hx: (turned ? p.d : p.w) / 2 + 2, hz: (turned ? p.w : p.d) / 2 + 2 }
    })
    return list.filter(
      (t) =>
        !PARK_LANES.some((lz) => Math.abs(t.z - lz) < 7 && Math.abs(t.x) > 20) &&
        !lots.some((p) => Math.abs(t.x - p.x) < p.hx && Math.abs(t.z - p.z) < p.hz) &&
        !nearFootpath(t.x, t.z, 3.2),
    )
  }, [])

  // flower parterres either side of the canal
  const beds = useMemo(() => {
    const list = []
    for (let z = canalZ0 + 10; z < canalZ1 - 10; z += 22) {
      for (const s of [1, -1]) {
        list.push({ x: s * 14, z, c: ['#f43f5e', '#f59e0b', '#a855f7', '#ec4899'][Math.floor(Math.abs(z) / 22) % 4] })
      }
    }
    return list
  }, [canalZ0, canalZ1])

  const jets = useRef(null)
  useFrame((state) => {
    if (jets.current) jets.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2
  })

  return (
    <group>
      <Lawn x={0} z={cz} w={PARK.x1 - PARK.x0} d={PARK.z1 - PARK.z0} />
      {/* central alley, cross paths and the monument plaza */}
      <Paving x={0} z={(PARK.z0 + MONUMENT_Z) / 2} w={44} d={MONUMENT_Z - PARK.z0} />
      <mesh position={[0, 0.06, MONUMENT_Z]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[46, 64]} />
        <meshStandardMaterial color="#e9e2d3" roughness={0.8} />
      </mesh>
      <Baked bakeKey="grandpark">
        {/* the canal */}
        <mesh position={[0, 0.25, (canalZ0 + canalZ1) / 2]} material={stoneRim} receiveShadow castShadow>
          <boxGeometry args={[10, 0.5, canalZ1 - canalZ0]} />
        </mesh>
        <mesh position={[0, 0.52, (canalZ0 + canalZ1) / 2]} rotation-x={-Math.PI / 2} material={m.water}>
          <planeGeometry args={[8.6, canalZ1 - canalZ0 - 1.4]} />
        </mesh>
        {/* reflecting pool in front of the monument */}
        <mesh position={[0, 0.25, canalZ1 + 20]} material={stoneRim} receiveShadow>
          <boxGeometry args={[30, 0.5, 34]} />
        </mesh>
        <mesh position={[0, 0.52, canalZ1 + 20]} rotation-x={-Math.PI / 2} material={m.water}>
          <planeGeometry args={[28.4, 32.4]} />
        </mesh>
        {/* parterres: hedge frames with flowers */}
        {beds.map((b) => (
          <group key={`${b.x}:${b.z}`} position={[b.x, 0, b.z]}>
            <mesh position-y={0.35} material={m.hedge} castShadow receiveShadow>
              <boxGeometry args={[9, 0.7, 16]} />
            </mesh>
            <mesh position-y={0.72} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[7.6, 14.6]} />
              <meshStandardMaterial color={b.c} roughness={0.9} />
            </mesh>
          </group>
        ))}
        {/* stairs round the monument */}
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[0, 0.2 + k * 0.4, MONUMENT_Z]} material={stoneRim} castShadow receiveShadow>
            <cylinderGeometry args={[34 - k * 3, 34 - k * 3, 0.4, 64]} />
          </mesh>
        ))}
        <group position={[0, 1.2, MONUMENT_Z]}>
          <Monument />
        </group>
        <Amphitheater x={-120} z={MONUMENT_Z} rotation={Math.PI / 2} />
        {/* benches along the alley */}
        {Array.from({ length: 16 }, (_, k) => PARK.z0 + 20 + k * 22).flatMap((z) =>
          [-19, 19].map((x) => (
            <mesh key={`${x}:${z}`} position={[x, 0.45, z]} material={m.wood} castShadow>
              <boxGeometry args={[0.7, 0.9, 2.4]} />
            </mesh>
          )),
        )}
      </Baked>
      {/* fountain jets along the canal (moving) */}
      <group ref={jets}>
        <Instances frames={3} limit={64} material={m.water}>
          <cylinderGeometry args={[0.06, 0.22, 3, 8]} />
          {Array.from({ length: Math.floor((canalZ1 - canalZ0) / 12) }, (_, k) => canalZ0 + 6 + k * 12).flatMap((z) =>
            [-2.2, 2.2].map((x) => <Instance key={`${x}:${z}`} position={[x, 2, z]} rotation-z={x > 0 ? -0.3 : 0.3} />),
          )}
        </Instances>
      </group>
      <Trees trees={trees} />
      <Footpaths />
      {/* night: the monument washed in light, glowing alley */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[Math.sin((k * Math.PI) / 2) * 4.7, 26, MONUMENT_Z + Math.cos((k * Math.PI) / 2) * 4.7]} rotation-y={(k * Math.PI) / 2} material={uplight('#ffe7b0', 0.7)}>
          <planeGeometry args={[9, 46]} />
        </mesh>
      ))}
      <NightGlow x={0} z={MONUMENT_Z} w={110} d={110} max={0.55} />
      <NightGlow x={0} z={(canalZ0 + canalZ1) / 2} w={40} d={canalZ1 - canalZ0} color="#cfe6ff" max={0.25} />
    </group>
  )
}

/* ---------------------------------------------------------------- stadium ------------- */

function pitchTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 768
  const g = c.getContext('2d')
  for (let k = 0; k < 12; k += 1) {
    g.fillStyle = k % 2 ? '#3f8f3a' : '#4aa043'
    g.fillRect(0, k * 64, 512, 64)
  }
  g.strokeStyle = '#ffffff'
  g.lineWidth = 5
  g.strokeRect(16, 16, 480, 736)
  g.beginPath()
  g.moveTo(16, 384)
  g.lineTo(496, 384)
  g.stroke()
  g.beginPath()
  g.arc(256, 384, 70, 0, Math.PI * 2)
  g.stroke()
  g.strokeRect(126, 16, 260, 110)
  g.strokeRect(126, 642, 260, 110)
  g.strokeRect(196, 16, 120, 40)
  g.strokeRect(196, 712, 120, 40)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Stadium({ x, z }) {
  const m = getMaterials()
  const SZ = 1.32 // oval: stretched along z
  const { lower, upper, roof } = useMemo(() => {
    const steps = (r0, r1, y0, y1, n) => {
      const pts = [new THREE.Vector2(r0, 0)]
      for (let k = 0; k < n; k += 1) {
        const r = r0 + ((r1 - r0) * k) / n
        const y = y0 + ((y1 - y0) * (k + 1)) / n
        pts.push(new THREE.Vector2(r, y), new THREE.Vector2(r + (r1 - r0) / n, y))
      }
      pts.push(new THREE.Vector2(r1, 0))
      return new THREE.LatheGeometry(pts, 72)
    }
    const roofPts = [new THREE.Vector2(51, 26), new THREE.Vector2(63, 28.4), new THREE.Vector2(63, 29), new THREE.Vector2(51, 26.6)]
    return { lower: steps(44, 52, 1, 9, 10), upper: steps(53, 60, 11, 21, 10), roof: new THREE.LatheGeometry(roofPts, 72) }
  }, [])
  const pitch = useMemo(() => new THREE.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95 }), [])
  const facade = useMemo(() => {
    const t = facadeTexture('office', 'dark').clone()
    t.needsUpdate = true
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
    t.repeat.set(36, 2)
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.5, roughness: 0.25, side: THREE.DoubleSide })
  }, [])
  const membrane = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4, side: THREE.DoubleSide }), [])
  const led = useMemo(
    () => followNight(new THREE.MeshStandardMaterial({ color: '#0ea5e9', emissive: '#22d3ee', toneMapped: false, side: THREE.DoubleSide }), 'emissiveIntensity', 2.5, 0.6),
    [],
  )
  const roofLights = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', toneMapped: false }), 'emissiveIntensity', 4, 0.3), [])
  const cars = useMemo(() => {
    const colors = ['#f8fafc', '#111827', '#b91c1c', '#1d4ed8', '#9ca3af', '#047857', '#f59e0b']
    const models = ['sedan', 'suv', 'offroad', 'executive', 'electric']
    const list = []
    for (let k = 0; k < 12; k += 1) list.push({ x: -72 + k * 6.5 + (k > 5 ? 20 : 0), model: models[k % models.length], color: colors[(k * 3) % colors.length] })
    return list
  }, [])

  return (
    <group position={[x, 0, z]}>
      {/* entrance plaza and parking */}
      <Paving x={0} z={0} w={190} d={250} color="#d9d4c9" y={0.04} repeat={10} />
      <mesh position={[0, 0.06, -135]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[190, 34]} />
        <meshStandardMaterial color="#3a3d42" roughness={0.9} />
      </mesh>
      <Baked bakeKey="stadium">
        <group scale={[1, 1, SZ]}>
          <mesh geometry={lower} castShadow receiveShadow>
            <meshStandardMaterial color="#1d4ed8" roughness={0.7} />
          </mesh>
          <mesh position-y={10} material={m.white} receiveShadow>
            <cylinderGeometry args={[53, 53, 0.6, 72, 1, true]} />
          </mesh>
          <mesh geometry={upper} castShadow receiveShadow>
            <meshStandardMaterial color="#0ea5e9" roughness={0.7} />
          </mesh>
          {/* outer façade, roof canopy and its LED band */}
          <mesh position-y={12.5} material={facade} castShadow receiveShadow>
            <cylinderGeometry args={[62, 62, 25, 72, 1, true]} />
          </mesh>
          <mesh geometry={roof} material={membrane} castShadow />
          <mesh position-y={23.5} material={led}>
            <cylinderGeometry args={[62.3, 62.3, 1.6, 72, 1, true]} />
          </mesh>
          {/* the pitch surround */}
          <mesh position-y={0.08} rotation-x={-Math.PI / 2} receiveShadow>
            <circleGeometry args={[44, 64]} />
            <meshStandardMaterial color="#2f6b2f" roughness={1} />
          </mesh>
        </group>
        <mesh position-y={0.12} rotation-x={-Math.PI / 2} material={pitch} receiveShadow>
          <planeGeometry args={[68, 105]} />
        </mesh>
        {/* goals */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[0, 1.2, s * 51]} material={m.white}>
            <boxGeometry args={[7.3, 2.4, 0.15]} />
          </mesh>
        ))}
        {/* parking lines and parked cars */}
        {Array.from({ length: 26 }, (_, k) => (
          <mesh key={k} position={[-84 + k * 6.5, 0.08, -135]} rotation-x={-Math.PI / 2} material={m.lineWhite}>
            <planeGeometry args={[0.15, 5.5]} />
          </mesh>
        ))}
        {cars.map((c, k) => (
          <group key={k} position={[c.x, 0.06, -135]}>
            <Car model={c.model} color={c.color} />
          </group>
        ))}
      </Baked>
      {/* floodlights along the inner roof edge */}
      <Instances frames={3} limit={40} material={roofLights}>
        <boxGeometry args={[1.6, 0.5, 0.8]} />
        {Array.from({ length: 40 }, (_, k) => {
          const a = (k / 40) * Math.PI * 2
          return <Instance key={k} position={[Math.cos(a) * 51.5, 25.8, Math.sin(a) * 51.5 * SZ]} rotation-y={-a} />
        })}
      </Instances>
      <BigSign text="STADION" sub="Premium arena" bg="#0b1f4b" fg="#38bdf8" position={[86, 6, 40]} rotation={Math.PI / 2} w={20} h={3.6} />
      <NightGlow x={0} z={0} w={80} d={120} color="#f0f7ff" max={0.75} y={0.2} />
    </group>
  )
}

/* ---------------------------------------------------------------- recreation park ----- */

function RecreationPark({ x, z }) {
  const m = getMaterials()
  const trees = useMemo(() => {
    const list = []
    let n = 300
    for (let tx = -95; tx <= 95; tx += 11) {
      for (let tz = -170; tz <= 170; tz += 11) {
        n += 1
        const lake = (tx / 66) ** 2 + (tz / 118) ** 2
        if (lake < 1.25) continue
        if (seeded(n) > 0.6) continue
        list.push({ x: x + tx + (seeded(n + 2) - 0.5) * 6, z: z + tz + (seeded(n + 4) - 0.5) * 6, s: 0.9 + seeded(n + 6) * 0.7 })
      }
    }
    return list
  }, [x, z])
  const boats = ['#ef4444', '#f8fafc', '#f59e0b', '#22c55e']
  return (
    <group position={[x, 0, z]}>
      <Baked bakeKey="recreation">
        {/* lake with a sandy shore and a walking path round it */}
        <group scale={[1, 1, 1.8]}>
          <mesh position-y={0.05} rotation-x={-Math.PI / 2} receiveShadow>
            <ringGeometry args={[66, 70, 96]} />
            <meshStandardMaterial color="#e6d3a3" roughness={1} />
          </mesh>
          <mesh position-y={0.06} rotation-x={-Math.PI / 2} receiveShadow>
            <ringGeometry args={[60, 66, 96]} />
            <meshStandardMaterial color="#e8dcc0" roughness={1} />
          </mesh>
          <mesh position-y={0.1} rotation-x={-Math.PI / 2} material={m.water}>
            <circleGeometry args={[60, 96]} />
          </mesh>
        </group>
        {/* island with a domed pavilion, and a bridge to it */}
        <mesh position={[0, 0.4, 20]} material={plainMaterial('#86b86a', { roughness: 1 })} receiveShadow>
          <cylinderGeometry args={[14, 15, 0.8, 40]} />
        </mesh>
        <group position={[0, 0.8, 20]}>
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * Math.PI * 2
            return (
              <mesh key={k} position={[Math.cos(a) * 5, 2.5, Math.sin(a) * 5]} material={m.white} castShadow>
                <cylinderGeometry args={[0.3, 0.3, 5, 12]} />
              </mesh>
            )
          })}
          <mesh position-y={5.2} material={m.white} castShadow>
            <cylinderGeometry args={[6, 6, 0.6, 32]} />
          </mesh>
          <mesh position-y={5.5} material={plainMaterial('#0e7490', { roughness: 0.4, metalness: 0.3 })} castShadow>
            <sphereGeometry args={[5, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
        <mesh position={[30, 0.9, 20]} material={m.wood} castShadow receiveShadow>
          <boxGeometry args={[34, 0.4, 3.2]} />
        </mesh>
        {/* boats */}
        {boats.map((c, k) => (
          <mesh key={c} position={[-30 + k * 9, 0.35, -60 + k * 14]} rotation-y={k * 0.8} castShadow>
            <boxGeometry args={[1.8, 0.6, 4]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        ))}
        {/* benches on the path */}
        {Array.from({ length: 18 }, (_, k) => {
          const a = (k / 18) * Math.PI * 2
          return (
            <mesh key={k} position={[Math.cos(a) * 71.5, 0.45, Math.sin(a) * 71.5 * 1.8]} rotation-y={-a} material={m.wood} castShadow>
              <boxGeometry args={[0.7, 0.9, 2.4]} />
            </mesh>
          )
        })}
      </Baked>
      <Trees trees={trees.map((t) => ({ ...t, x: t.x - x, z: t.z - z }))} />
      <BigSign text="ISTIROHAT BOG'I" bg="#14532d" fg="#bbf7d0" position={[86, 5, -40]} rotation={Math.PI / 2} w={16} h={3} />
      <NightGlow x={0} z={20} w={40} d={40} max={0.5} />
    </group>
  )
}

/* ---------------------------------------------------------------- children's park ----- */

const KID_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15']

function FerrisWheel({ x, z }) {
  const wheel = useRef(null)
  const m = getMaterials()
  const R = 22
  const cabins = useRef([])
  useFrame((_, dt) => {
    if (!wheel.current) return
    wheel.current.rotation.z += dt * 0.12
    // cabins hang level
    for (const c of cabins.current) if (c) c.rotation.z = -wheel.current.rotation.z
  })
  const bulbs = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffd27a', toneMapped: false }), 'emissiveIntensity', 4, 0.2), [])
  return (
    <group position={[x, 0, z]}>
      {/* A-frame legs */}
      {[1, -1].flatMap((sz) =>
        [1, -1].map((sx) => (
          <mesh key={`${sx}${sz}`} position={[sx * 7, 12.5, sz * 3]} rotation-z={sx * 0.28} material={m.white} castShadow>
            <cylinderGeometry args={[0.45, 0.6, 27, 10]} />
          </mesh>
        )),
      )}
      <group ref={wheel} position-y={R + 4}>
        <mesh material={m.white}>
          <torusGeometry args={[R, 0.35, 8, 64]} />
        </mesh>
        <mesh material={bulbs}>
          <torusGeometry args={[R + 0.5, 0.12, 6, 64]} />
        </mesh>
        {Array.from({ length: 16 }, (_, k) => {
          const a = (k / 16) * Math.PI * 2
          return (
            <group key={k}>
              <mesh position={[(Math.cos(a) * R) / 2, (Math.sin(a) * R) / 2, 0]} rotation-z={a + Math.PI / 2} material={m.white}>
                <boxGeometry args={[0.18, R, 0.18]} />
              </mesh>
              <group
                position={[Math.cos(a) * R, Math.sin(a) * R, 0]}
                ref={(el) => {
                  cabins.current[k] = el
                }}
              >
                <mesh position-y={-1.6} castShadow>
                  <boxGeometry args={[2.2, 2, 2.2]} />
                  <meshStandardMaterial color={KID_COLORS[k % KID_COLORS.length]} roughness={0.5} />
                </mesh>
              </group>
            </group>
          )
        })}
        <mesh rotation-x={Math.PI / 2} material={m.metalDark}>
          <cylinderGeometry args={[1, 1, 7, 16]} />
        </mesh>
      </group>
    </group>
  )
}

function Carousel({ x, z }) {
  const spin = useRef(null)
  const m = getMaterials()
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.6
  })
  const roof = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 32
    const g = c.getContext('2d')
    for (let k = 0; k < 16; k += 1) {
      g.fillStyle = k % 2 ? '#ef4444' : '#fef3c7'
      g.fillRect(k * 16, 0, 16, 32)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })
  }, [])
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={0.3} material={m.white} receiveShadow>
        <cylinderGeometry args={[8.5, 8.5, 0.6, 40]} />
      </mesh>
      <group ref={spin}>
        <mesh position-y={3.3} material={plainMaterial('#fcd34d', { metalness: 0.6, roughness: 0.3 })}>
          <cylinderGeometry args={[0.6, 0.6, 6, 16]} />
        </mesh>
        <mesh position-y={7.3} material={roof} castShadow>
          <coneGeometry args={[9, 3.4, 16]} />
        </mesh>
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * Math.PI * 2
          return (
            <group key={k} position={[Math.cos(a) * 6.5, 0, Math.sin(a) * 6.5]} rotation-y={-a}>
              <mesh position-y={3.3} material={plainMaterial('#fde68a', { metalness: 0.7, roughness: 0.3 })}>
                <cylinderGeometry args={[0.06, 0.06, 6, 6]} />
              </mesh>
              <mesh position-y={2} castShadow>
                <boxGeometry args={[0.6, 1, 1.8]} />
                <meshStandardMaterial color={KID_COLORS[k % KID_COLORS.length]} roughness={0.5} />
              </mesh>
              <mesh position={[0, 2.7, 0.8]} castShadow>
                <boxGeometry args={[0.4, 0.9, 0.5]} />
                <meshStandardMaterial color={KID_COLORS[k % KID_COLORS.length]} roughness={0.5} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

function KidsPark({ x, z }) {
  const m = getMaterials()
  const trees = useMemo(() => {
    const list = []
    for (let k = 0; k < 26; k += 1) list.push({ x: -92 + (k % 13) * 15, z: k < 13 ? -165 : 165, s: 1 })
    for (let k = 0; k < 18; k += 1) list.push({ x: 92, z: -150 + k * 18, s: 0.95 })
    // shade trees between the rides
    let n = 900
    for (let tx = -85; tx <= 85; tx += 12) {
      for (let tz = -150; tz <= 150; tz += 12) {
        n += 1
        const busy = Math.hypot(tx - 45, tz - 30) < 32 || Math.hypot(tx + 45, tz - 10) < 16 || (Math.abs(tx) < 68 && Math.abs(tz + 90) < 26) || (Math.abs(tx + 40) < 30 && Math.abs(tz - 100) < 28) || (Math.abs(tx - 34) < 22 && Math.abs(tz - 120) < 12)
        if (busy || seeded(n) > 0.4) continue
        list.push({ x: tx + (seeded(n + 1) - 0.5) * 5, z: tz + (seeded(n + 2) - 0.5) * 5, s: 0.85 + seeded(n + 3) * 0.4 })
      }
    }
    return list
  }, [])
  return (
    <group position={[x, 0, z]}>
      <Paving x={0} z={0} w={190} d={350} color="#e5ddd0" y={0.04} repeat={10} />
      <Baked bakeKey="kids">
        {/* soft rubber play areas */}
        {[
          [-40, -90, 50, 40, '#38bdf8'],
          [40, -90, 50, 40, '#4ade80'],
          [-40, 100, 50, 46, '#fb923c'],
        ].map(([px, pz, w, d, c]) => (
          <mesh key={`${px}${pz}`} position={[px, 0.07, pz]} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color={c} roughness={0.95} />
          </mesh>
        ))}
        {/* slides: tower + coloured chute */}
        {[-56, -40, -24].map((px, k) => (
          <group key={px} position={[px, 0, -95]}>
            <mesh position-y={2} material={m.white} castShadow>
              <boxGeometry args={[3, 4, 3]} />
            </mesh>
            <mesh position={[0, 4.4, 0]} castShadow>
              <coneGeometry args={[2.4, 2, 4]} />
              <meshStandardMaterial color={KID_COLORS[k + 1]} roughness={0.5} />
            </mesh>
            <mesh position={[0, 2, 4.6]} rotation-x={0.62} castShadow>
              <boxGeometry args={[1.6, 0.25, 7]} />
              <meshStandardMaterial color={KID_COLORS[k + 4]} roughness={0.4} />
            </mesh>
          </group>
        ))}
        {/* swings */}
        <group position={[40, 0, -90]}>
          {[-6, 6].map((sx) => (
            <mesh key={sx} position={[sx, 2.5, 0]} material={m.metalDark} castShadow>
              <boxGeometry args={[0.25, 5, 0.25]} />
            </mesh>
          ))}
          <mesh position-y={5} material={m.metalDark}>
            <boxGeometry args={[12.5, 0.3, 0.3]} />
          </mesh>
          {[-4, -1.3, 1.3, 4].map((sx, k) => (
            <group key={sx} position={[sx, 0, 0]}>
              <mesh position-y={3.1} material={m.metalDark}>
                <boxGeometry args={[0.05, 3.8, 0.05]} />
              </mesh>
              <mesh position-y={1.1} castShadow>
                <boxGeometry args={[0.9, 0.12, 0.5]} />
                <meshStandardMaterial color={KID_COLORS[k]} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
        {/* bouncy castle */}
        <group position={[-40, 0, 100]}>
          <mesh position-y={2.2} castShadow>
            <boxGeometry args={[14, 4.4, 12]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.6} />
          </mesh>
          {[
            [-7, -6],
            [7, -6],
            [-7, 6],
            [7, 6],
          ].map(([tx, tz], k) => (
            <group key={k} position={[tx, 0, tz]}>
              <mesh position-y={3.5} castShadow>
                <cylinderGeometry args={[1.4, 1.4, 7, 16]} />
                <meshStandardMaterial color={KID_COLORS[(k + 2) % KID_COLORS.length]} roughness={0.6} />
              </mesh>
              <mesh position-y={8} castShadow>
                <coneGeometry args={[1.8, 2.6, 16]} />
                <meshStandardMaterial color="#facc15" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
        {/* trampolines */}
        {[20, 34, 48].map((px) => (
          <mesh key={px} position={[px, 0.5, 120]} castShadow>
            <cylinderGeometry args={[5, 5, 1, 32]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        ))}
      </Baked>
      <FerrisWheel x={45} z={30} />
      <Carousel x={-45} z={10} />
      <Trees trees={trees} />
      <BigSign text="BOLALAR BOG'I" sub="Attraksionlar • O'yin maydonchalari" bg="#7c3aed" fg="#fde68a" position={[-86, 5, -40]} rotation={-Math.PI / 2} w={16} h={3} />
      <NightGlow x={0} z={0} w={170} d={300} color="#ffe0f0" max={0.35} />
    </group>
  )
}

/* ---------------------------------------------------------------- mosque -------------- */

function Minaret({ x, z, h = 62 }) {
  const m = getMaterials()
  const tile = plainMaterial('#1e88a8', { roughness: 0.35, metalness: 0.2 })
  const gold = plainMaterial('#d4a537', { metalness: 0.9, roughness: 0.22 })
  const glow = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#bfe3ff', toneMapped: false }), 'emissiveIntensity', 2.4, 0), [])
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={3} material={m.white} castShadow>
        <cylinderGeometry args={[3.2, 3.4, 6, 8]} />
      </mesh>
      <mesh position-y={6 + (h - 14) / 2} material={m.white} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.6, h - 14, 16]} />
      </mesh>
      {[0.45, 0.8].map((f) => (
        <group key={f} position-y={6 + (h - 14) * f}>
          <mesh material={m.white} castShadow>
            <cylinderGeometry args={[3.2, 2.4, 1.2, 16]} />
          </mesh>
          <mesh position-y={0.9} material={glow}>
            <cylinderGeometry args={[3.1, 3.1, 0.6, 16, 1, true]} />
          </mesh>
        </group>
      ))}
      <mesh position-y={h - 6} material={m.white} castShadow>
        <cylinderGeometry args={[1.6, 1.9, 4, 16]} />
      </mesh>
      <mesh position-y={h - 2.2} material={tile} castShadow>
        <coneGeometry args={[2, 5, 16]} />
      </mesh>
      <mesh position-y={h + 0.8} material={gold}>
        <cylinderGeometry args={[0.08, 0.12, 1.6, 8]} />
      </mesh>
      <mesh position-y={h + 2} material={gold}>
        <torusGeometry args={[0.6, 0.12, 8, 24, Math.PI * 1.5]} />
      </mesh>
    </group>
  )
}

function Mosque({ x, z }) {
  const m = getMaterials()
  const marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f7f5f0', roughness: 0.4 }), [])
  const tile = plainMaterial('#1e88a8', { roughness: 0.35, metalness: 0.2 })
  const gold = plainMaterial('#d4a537', { metalness: 0.9, roughness: 0.22 })
  const recess = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#1f3b57', emissive: '#ffd9a0', side: THREE.DoubleSide }), 'emissiveIntensity', 0.9, 0), [])
  const HALL = { x: 32, w: 66, d: 62, h: 16 }
  const COURT = { x: -38, w: 66, d: 62 }
  return (
    <group position={[x, 0, z]}>
      <Paving x={-5} z={0} w={190} d={150} color="#ece7dc" y={0.04} repeat={8} />
      <Baked bakeKey="mosque">
        {/* prayer hall */}
        <mesh position={[HALL.x, HALL.h / 2, 0]} material={marble} castShadow receiveShadow>
          <boxGeometry args={[HALL.w, HALL.h, HALL.d]} />
        </mesh>
        {/* arched windows on the long sides */}
        {[1, -1].flatMap((s) =>
          Array.from({ length: 8 }, (_, k) => (
            <mesh key={`${s}${k}`} position={[HALL.x - HALL.w / 2 + 6 + k * 7.7, 3, s * (HALL.d / 2 + 0.05)]} rotation-y={s > 0 ? 0 : Math.PI} geometry={archGeometry(3.4, 9)} material={recess} />
          )),
        )}
        {/* gold cornice band round the top of the walls */}
        <mesh position={[HALL.x, HALL.h - 0.5, 0]} material={gold}>
          <boxGeometry args={[HALL.w + 0.5, 0.7, HALL.d + 0.5]} />
        </mesh>
        <mesh position={[HALL.x, HALL.h + 0.5, 0]} material={marble} castShadow>
          <boxGeometry args={[HALL.w + 0.8, 1, HALL.d + 0.8]} />
        </mesh>
        {/* main dome on a drum, four smaller domes */}
        <mesh position={[HALL.x, HALL.h + 4, 0]} material={marble} castShadow>
          <cylinderGeometry args={[17, 17, 8, 48]} />
        </mesh>
        {Array.from({ length: 16 }, (_, k) => {
          const a = (k / 16) * Math.PI * 2
          return <mesh key={k} position={[HALL.x + Math.cos(a) * 17.05, HALL.h + 1.4, Math.sin(a) * 17.05]} rotation-y={-a + Math.PI / 2} geometry={archGeometry(2, 5)} material={recess} />
        })}
        <mesh position={[HALL.x, HALL.h + 8, 0]} scale={[1, 1.18, 1]} material={tile} castShadow>
          <sphereGeometry args={[17.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[HALL.x, HALL.h + 8 + 20.6 + 1.5, 0]} material={gold}>
          <cylinderGeometry args={[0.2, 0.5, 3, 12]} />
        </mesh>
        <mesh position={[HALL.x, HALL.h + 8 + 20.6 + 4, 0]} material={gold}>
          <torusGeometry args={[1.1, 0.2, 8, 24, Math.PI * 1.5]} />
        </mesh>
        {[
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[HALL.x + sx * 22, HALL.h, sz * 20]}>
            <mesh position-y={1.5} material={marble}>
              <cylinderGeometry args={[6, 6, 3, 32]} />
            </mesh>
            <mesh position-y={3} material={tile} castShadow>
              <sphereGeometry args={[6.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position-y={9.6} material={gold}>
              <cylinderGeometry args={[0.1, 0.25, 1.4, 8]} />
            </mesh>
          </group>
        ))}
        {/* courtyard (sahn) with arcades on three sides and an ablution fountain */}
        {[
          [COURT.x, COURT.d / 2, 0],
          [COURT.x, -COURT.d / 2, Math.PI],
          [COURT.x - COURT.w / 2, 0, -Math.PI / 2],
        ].map(([ax, az, rot], k) => (
          <group key={k} position={[ax, 0, az]} rotation-y={rot}>
            <mesh position={[0, 4.5, 0]} material={marble} castShadow receiveShadow>
              <boxGeometry args={[k === 2 ? COURT.d : COURT.w, 9, 5]} />
            </mesh>
            {Array.from({ length: k === 2 ? 0 : 9 }, (_, i) => (
              <mesh key={i} position={[-COURT.w / 2 + 4 + i * 7.25, 0.4, -2.55]} rotation-y={Math.PI} geometry={archGeometry(4.6, 7)} material={recess} />
            ))}
            <mesh position={[0, 9.2, 0]} material={tile}>
              <boxGeometry args={[(k === 2 ? COURT.d : COURT.w) + 0.2, 0.4, 5.2]} />
            </mesh>
          </group>
        ))}
        {/* the main gate (pishtoq) facing the road */}
        <group position={[COURT.x - COURT.w / 2 - 0.5, 0, 0]} rotation-y={-Math.PI / 2}>
          <mesh position-y={13} material={marble} castShadow>
            <boxGeometry args={[26, 26, 4]} />
          </mesh>
          <mesh position={[0, 0.3, 2.06]} geometry={archGeometry(13, 21)} material={recess} />
          <mesh position={[0, 26.3, 0]} material={tile}>
            <boxGeometry args={[26.4, 0.6, 4.4]} />
          </mesh>
          <mesh position={[0, 23.5, 2.1]} material={gold}>
            <boxGeometry args={[20, 0.5, 0.1]} />
          </mesh>
        </group>
        <mesh position={[COURT.x, 0.4, 0]} material={marble} castShadow>
          <cylinderGeometry args={[6, 6.3, 0.8, 8]} />
        </mesh>
        <mesh position={[COURT.x, 0.82, 0]} material={m.water}>
          <cylinderGeometry args={[5.5, 5.5, 0.05, 8]} />
        </mesh>
        <mesh position={[COURT.x, 2.2, 0]} material={marble}>
          <cylinderGeometry args={[0.8, 1.2, 2.8, 8]} />
        </mesh>
      </Baked>
      {[
        [COURT.x - COURT.w / 2 + 2, COURT.d / 2 + 2],
        [COURT.x - COURT.w / 2 + 2, -COURT.d / 2 - 2],
        [HALL.x + HALL.w / 2 + 2, HALL.d / 2 + 2],
        [HALL.x + HALL.w / 2 + 2, -HALL.d / 2 - 2],
      ].map(([mx, mz]) => (
        <Baked key={`${mx}${mz}`} bakeKey={`minaret${mx}${mz}`}>
          <Minaret x={mx} z={mz} />
        </Baked>
      ))}
      {/* night: the dome and the walls washed in light */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[HALL.x + Math.sin((k * Math.PI) / 2) * 33.2, 8, Math.cos((k * Math.PI) / 2) * 31.2]} rotation-y={(k * Math.PI) / 2} material={uplight('#ffe7c2', 0.55)}>
          <planeGeometry args={[k % 2 ? 62 : 66, 16]} />
        </mesh>
      ))}
      <NightGlow x={-5} z={0} w={170} d={130} color="#ffe7c2" max={0.5} />
      <BigSign text="MASJID" bg="#0f4c5c" fg="#fde68a" position={[-86, 5, 52]} rotation={-Math.PI / 2} w={12} h={2.6} />
    </group>
  )
}

/* ---------------------------------------------------------------- the district -------- */

export function NewUzbekistan() {
  const westX = -(NORTH.inner + NORTH.x) / 2
  const eastX = (NORTH.inner + NORTH.x) / 2
  return (
    <group>
      <Boulevard />
      <GrandPark />
      <Stadium x={westX} z={(RING_Z + NORTH.mid) / 2} />
      <RecreationPark x={westX} z={(NORTH.mid + NORTH.top) / 2} />
      <KidsPark x={eastX} z={(RING_Z + NORTH.mid) / 2} />
      <Mosque x={eastX} z={(NORTH.mid + NORTH.top) / 2} />
    </group>
  )
}
