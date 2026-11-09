import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@/pages/TownPage/scene/StaticInstances'
import { ARCS, ARTERIAL, AVENUE_WIDTH, FOOTBRIDGES, INTERSECTIONS, WORLD, NX_ROADS, NZ_ROADS, ROUNDABOUTS, onArc, OVERPASS, SIDEWALK, X_ROADS, Z_ROADS, deckHeight, lightState } from '@/shared/config/town'
import { asphaltTexture, concreteTexture, grassTexture, plasterTexture, sidewalkTexture } from '@/pages/TownPage/scene/textures'
import { getMaterials, plainMaterial } from '@/pages/TownPage/scene/materials'
import { followNight } from '@/pages/TownPage/scene/dayNight'
import { lightPoolTexture } from '@/pages/TownPage/scene/nightTextures'
import { Trees } from '@/pages/TownPage/scene/Nature'
import { Baked } from '@/pages/TownPage/scene/Baked'
import { LAMP_ARM, streetLamps } from '@/pages/TownPage/scene/lightSources'

const ROAD_Y = 0.02
const LINE_Y = 0.035
const WALK_H = 0.18

/** Grass everywhere under the town and the countryside around it. */
export function Ground() {
  const size = 3000
  const grass = useMemo(() => grassTexture([size / 12, size / 12]), [])
  return (
    <mesh rotation-x={-Math.PI / 2} position-z={(WORLD.minZ + WORLD.maxZ) / 2} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={grass} roughness={1} color="#9fb88a" />
    </mesh>
  )
}

/** Every straight road in town as ONE mesh with one material: the asphalt is mapped in world
 * space (16 m per tile), so roads that overlap at junctions look seamless and hundreds of
 * roads cost a single draw call. */
function AllRoads() {
  const geometry = useMemo(() => {
    const pos = []
    const uv = []
    const rect = (x0, x1, z0, z1) => {
      const y = ROAD_Y
      // two triangles facing up
      pos.push(x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0)
      for (const [x, z] of [
        [x0, z0],
        [x0, z1],
        [x1, z1],
        [x0, z0],
        [x1, z1],
        [x1, z0],
      ])
        uv.push(x / 16, z / 16)
    }
    for (const r of X_ROADS) rect(-r.xMax, r.xMax, r.z - r.w / 2, r.z + r.w / 2)
    for (const r of Z_ROADS) rect(r.x - r.w / 2, r.x + r.w / 2, r.z1, r.z2)
    for (const r of NX_ROADS) rect(r.x1, r.x2, r.z - r.w / 2, r.z + r.w / 2)
    for (const r of NZ_ROADS) rect(r.x - r.w / 2, r.x + r.w / 2, r.z1, r.z2)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.computeVertexNormals()
    g.computeBoundingSphere()
    return g
  }, [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: asphaltTexture([1, 1]), roughness: 0.92 }), [])
  return <mesh geometry={geometry} material={material} receiveShadow />
}

/** All sidewalks in one draw call. */
function Sidewalks({ pieces }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: sidewalkTexture([1, 1]),
        color: '#e4e2dc',
        roughness: 0.95,
      }),
    [],
  )
  return (
    <Instances frames={3} limit={pieces.length} material={material} receiveShadow>
      <boxGeometry args={[1, WALK_H, SIDEWALK]} />
      {pieces.map((pc, i) => (
        <Instance key={i} position={[pc.x, WALK_H / 2, pc.z]} scale={[pc.len, 1, 1]} />
      ))}
    </Instances>
  )
}

/** Is `z` on one of the roads along X (with its sidewalks, plus `pad`)? */
function onXRoad(z, pad = 2) {
  return X_ROADS.some((r) => Math.abs(z - r.z) < r.w / 2 + SIDEWALK + pad)
}

/** Would a dash centred at `x` on the road along X at `z` (half length `half`) reach into
 * a junction? */
function nearRoundabout(x, z, pad) {
  return ROUNDABOUTS.some((o) => Math.hypot(x - o.x, z - o.z) < o.outer + pad)
}
function dashInJunctionX(x, z, half, own) {
  if (nearRoundabout(x, z, half + 1)) return true
  if (ARCS.some((a) => a !== own && a.kind === 'street' && onArc(a, x, z, half + 1))) return true
  const cross = (r) => z >= r.z1 - 1 && z <= r.z2 + 1 && Math.abs(x - r.x) < r.w / 2 + half + 0.6
  return Z_ROADS.some(cross) || NZ_ROADS.some(cross)
}
function dashInJunctionZ(x, z, half) {
  if (nearRoundabout(x, z, half + 1)) return true
  if (ARCS.some((a) => a.kind === 'street' && onArc(a, x, z, half + 1))) return true
  if (NX_ROADS.some((r) => x >= r.x1 - 1 && x <= r.x2 + 1 && Math.abs(z - r.z) < r.w / 2 + half + 0.6)) return true
  return X_ROADS.some((r) => Math.abs(x) <= r.xMax && Math.abs(z - r.z) < r.w / 2 + SIDEWALK + half + 0.4)
}

/** Lane markings as instanced thin boxes. */
function Markings() {
  const m = getMaterials()
  const { white, yellow } = useMemo(() => {
    const white = []
    const yellow = []
    for (const r of X_ROADS) {
      const step = r.kind === 'avenue' ? 6 : 7
      for (let x = -r.xMax + step / 2; x < r.xMax - step / 2; x += step) {
        // yellow centre lines on the avenue/ring are as long as the step — keep them out too
        if (dashInJunctionX(x, r.z, r.kind === 'street' ? 1.5 : step / 2)) continue
        if (r.kind === 'avenue') {
          white.push({
            pos: [x, LINE_Y, AVENUE_WIDTH / 4],
            scale: [3, 1, 0.15],
          })
          white.push({
            pos: [x, LINE_Y, -AVENUE_WIDTH / 4],
            scale: [3, 1, 0.15],
          })
          yellow.push({ pos: [x, LINE_Y, 0.18], scale: [6, 1, 0.14] }, { pos: [x, LINE_Y, -0.18], scale: [6, 1, 0.14] })
        } else if (r.kind === 'ring') {
          yellow.push({ pos: [x, LINE_Y, r.z], scale: [7, 1, 0.16] })
          for (const s of [1, -1])
            white.push({
              pos: [x, LINE_Y, r.z + s * (r.w / 2 - 0.5)],
              scale: [7, 1, 0.14],
            })
        } else {
          white.push({ pos: [x, LINE_Y, r.z], scale: [3, 1, 0.14] })
        }
      }
    }
    for (const r of Z_ROADS) {
      for (let z = r.z1; z < r.z2; z += 7) {
        if (dashInJunctionZ(r.x, z, r.kind === 'ring' ? 3.5 : 1.5)) continue
        if (r.kind === 'ring') {
          yellow.push({ pos: [r.x, LINE_Y, z], scale: [0.16, 1, 7] })
          for (const s of [1, -1])
            white.push({
              pos: [r.x + s * (r.w / 2 - 0.5), LINE_Y, z],
              scale: [0.14, 1, 7],
            })
        } else {
          white.push({ pos: [r.x, LINE_Y, z], scale: [0.14, 1, 3] })
        }
      }
    }
    // the north district's roads
    for (const r of NX_ROADS) {
      for (let x = r.x1 + 3.5; x < r.x2 - 3.5; x += 7) {
        if (dashInJunctionX(x, r.z, r.kind === 'ring' || r.median ? 3.5 : 1.5)) continue
        if (r.median) {
          const cw = (r.w - r.median) / 2
          const lanes = cw >= 12 ? 3 : 2
          for (const s of [1, -1]) {
            for (let k = 1; k < lanes; k += 1) white.push({ pos: [x, LINE_Y, r.z + s * (r.median / 2 + (cw * k) / lanes)], scale: [3, 1, 0.14] })
            white.push({ pos: [x, LINE_Y, r.z + s * (r.w / 2 - 0.5)], scale: [7, 1, 0.14] })
            yellow.push({ pos: [x, LINE_Y, r.z + s * (r.median / 2 + 0.35)], scale: [7, 1, 0.14] })
          }
        } else if (r.kind === 'ring') {
          yellow.push({ pos: [x, LINE_Y, r.z], scale: [7, 1, 0.16] })
          for (const s of [1, -1]) white.push({ pos: [x, LINE_Y, r.z + s * (r.w / 2 - 0.5)], scale: [7, 1, 0.14] })
        } else if (r.w >= 14) {
          yellow.push({ pos: [x, LINE_Y, r.z + 0.18], scale: [7, 1, 0.12] }, { pos: [x, LINE_Y, r.z - 0.18], scale: [7, 1, 0.12] })
          for (const s of [1, -1]) white.push({ pos: [x, LINE_Y, r.z + (s * r.w) / 4], scale: [3, 1, 0.14] })
        } else {
          white.push({ pos: [x, LINE_Y, r.z], scale: [3, 1, 0.14] })
        }
      }
    }
    for (const r of NZ_ROADS) {
      for (let z = r.z1 + 3.5; z < r.z2 - 3.5; z += 7) {
        if (dashInJunctionZ(r.x, z, r.kind === 'ring' || r.median ? 3.5 : 1.5)) continue
        if (r.median) {
          const cw = (r.w - r.median) / 2
          const lanes = cw >= 12 ? 3 : 2
          for (const s of [1, -1]) {
            for (let k = 1; k < lanes; k += 1) white.push({ pos: [r.x + s * (r.median / 2 + (cw * k) / lanes), LINE_Y, z], scale: [0.14, 1, 3] })
            white.push({ pos: [r.x + s * (r.w / 2 - 0.5), LINE_Y, z], scale: [0.14, 1, 7] })
            yellow.push({ pos: [r.x + s * (r.median / 2 + 0.35), LINE_Y, z], scale: [0.14, 1, 7] })
          }
        } else if (r.kind === 'street' && r.w >= 14) {
          yellow.push({ pos: [r.x + 0.18, LINE_Y, z], scale: [0.12, 1, 7] }, { pos: [r.x - 0.18, LINE_Y, z], scale: [0.12, 1, 7] })
          for (const s of [1, -1]) white.push({ pos: [r.x + (s * r.w) / 4, LINE_Y, z], scale: [0.14, 1, 3] })
        } else if (r.kind === 'ring') {
          yellow.push({ pos: [r.x, LINE_Y, z], scale: [0.16, 1, 7] })
          for (const s of [1, -1]) white.push({ pos: [r.x + s * (r.w / 2 - 0.5), LINE_Y, z], scale: [0.14, 1, 7] })
        } else if (r.kind === 'boulevard') {
          white.push({ pos: [r.x, LINE_Y, z], scale: [0.14, 1, 3] })
          for (const s of [1, -1]) white.push({ pos: [r.x + s * (r.w / 2 - 0.4), LINE_Y, z], scale: [0.14, 1, 7] })
        } else {
          white.push({ pos: [r.x, LINE_Y, z], scale: [0.14, 1, 3] })
        }
      }
    }
    for (const a of ARCS) {
      const n = Math.round((a.r * Math.PI) / 2 / 7)
      for (let k = 0; k < n; k += 1) {
        const f = (k + 0.5) / n
        if (a.kind === 'street' && (f < 0.15 || f > 0.85)) continue
        const t = (f * Math.PI) / 2
        const ux = Math.cos(t) * a.sx
        const uz = Math.sin(t) * a.sz
        // tangent direction → rotation about y (a dash's length runs along local z)
        const rot = Math.atan2(-Math.sin(t) * a.sx, Math.cos(t) * a.sz)
        const at = (rr) => [a.cx + ux * rr, LINE_Y, a.cz + uz * rr]
        if (a.kind === 'ring') {
          yellow.push({ pos: at(a.r), scale: [0.16, 1, 6.6], rot })
          for (const sd of [1, -1])
            white.push({
              pos: at(a.r + sd * (a.w / 2 - 0.5)),
              scale: [0.14, 1, 6.6],
              rot,
            })
        } else {
          white.push({ pos: at(a.r), scale: [0.14, 1, 3], rot })
        }
      }
    }
    for (const o of ROUNDABOUTS) {
      const mid = (o.island + o.outer) / 2
      for (let k = 0; k < 24; k += 1) {
        const t = (k / 24) * Math.PI * 2
        white.push({
          pos: [o.x + Math.cos(t) * mid, LINE_Y, o.z + Math.sin(t) * mid],
          scale: [0.14, 1, 2.2],
          rot: Math.atan2(-Math.sin(t), Math.cos(t)),
        })
      }
    }
    // zebra crossings at the traffic-light junctions
    for (const j of INTERSECTIONS) {
      for (const side of [-1, 1]) {
        for (let k = -3; k <= 3; k += 1) {
          white.push({
            pos: [j.x + side * (j.hx + 1.8), LINE_Y, k * 1.8],
            scale: [2.6, 1, 0.9],
          })
        }
      }
    }
    return { white, yellow }
  }, [])

  return (
    <>
      <Instances frames={3} limit={white.length} material={m.lineWhite} receiveShadow>
        <boxGeometry args={[1, 0.01, 1]} />
        {white.map((d, i) => (
          <Instance key={i} position={d.pos} scale={d.scale} rotation-y={d.rot ?? 0} />
        ))}
      </Instances>
      <Instances frames={3} limit={yellow.length} material={m.lineYellow} receiveShadow>
        <boxGeometry args={[1, 0.01, 1]} />
        {yellow.map((d, i) => (
          <Instance key={i} position={d.pos} scale={d.scale} rotation-y={d.rot ?? 0} />
        ))}
      </Instances>
    </>
  )
}

/** Pieces [x0, x1] of a sidewalk along X at `z` (up to |x| = `xMax`), broken wherever a
 * road along Z, a curve or a roundabout crosses it. */
function sidewalkPieces(z, xMax) {
  const blocked = (x) =>
    nearRoundabout(x, z, 1.5) ||
    ARCS.some((a) => onArc(a, x, z, SIDEWALK / 2 + 0.3)) ||
    [...Z_ROADS, ...NZ_ROADS].some((r) => z + SIDEWALK / 2 > r.z1 && z - SIDEWALK / 2 < r.z2 && Math.abs(x - r.x) < r.w / 2)
  const pieces = []
  let start = null
  for (let x = -xMax; x <= xMax + 0.001; x += 0.5) {
    const free = !blocked(x)
    if (free && start === null) start = x
    if (!free && start !== null) {
      if (x - start > 1) pieces.push([start, x])
      start = null
    }
  }
  if (start !== null && xMax - start > 1) pieces.push([start, xMax])
  return pieces
}

/** A quarter-circle of road. */
function ArcRoad({ a }) {
  const tex = useMemo(() => asphaltTexture([(a.r * 2) / 16, (a.r * 2) / 16]), [a.r])
  // ringGeometry lies in XY; turned flat, angle θ points to (cos θ, −sin θ) in XZ
  const qy = -a.sz
  const start = a.sx > 0 ? (qy > 0 ? 0 : 1.5 * Math.PI) : qy > 0 ? 0.5 * Math.PI : Math.PI
  return (
    <mesh position={[a.cx, ROAD_Y + 0.002, a.cz]} rotation-x={-Math.PI / 2} receiveShadow>
      <ringGeometry args={[a.r - a.w / 2, a.r + a.w / 2, 48, 1, start, Math.PI / 2]} />
      <meshStandardMaterial map={tex} roughness={0.92} />
    </mesh>
  )
}

/** One clock face: white dial with gold rim and hour marks, hands that show the real time,
 * glowing at night. Faces +z. */
function ClockFace({ stone }) {
  const hour = useRef(null)
  const minute = useRef(null)
  const gold = plainMaterial('#c9a227', { metalness: 0.85, roughness: 0.25 })
  const black = plainMaterial('#111827', { roughness: 0.4 })
  const dial = useMemo(
    () =>
      followNight(
        new THREE.MeshStandardMaterial({
          color: '#fbf7ea',
          emissive: '#fff1c4',
          roughness: 0.5,
        }),
        'emissiveIntensity',
        1.6,
        0,
      ),
    [],
  )
  useFrame(() => {
    const d = new Date()
    const m = d.getMinutes() + d.getSeconds() / 60
    const h = (d.getHours() % 12) + m / 60
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2
  })
  return (
    <group>
      <mesh material={stone} position-z={-0.05}>
        <boxGeometry args={[4.6, 4.6, 0.1]} />
      </mesh>
      <mesh material={dial}>
        <circleGeometry args={[1.85, 40]} />
      </mesh>
      <mesh material={gold} position-z={0.03}>
        <torusGeometry args={[1.9, 0.11, 8, 48]} />
      </mesh>
      {Array.from({ length: 12 }, (_, k) => {
        const t = (k / 12) * Math.PI * 2
        return (
          <mesh key={k} position={[Math.sin(t) * 1.55, Math.cos(t) * 1.55, 0.03]} rotation-z={-t} material={black}>
            <boxGeometry args={[0.09, k % 3 ? 0.22 : 0.4, 0.02]} />
          </mesh>
        )
      })}
      <group ref={hour} position-z={0.06}>
        <mesh position-y={0.45} material={black}>
          <boxGeometry args={[0.14, 0.95, 0.03]} />
        </mesh>
      </group>
      <group ref={minute} position-z={0.09}>
        <mesh position-y={0.68} material={black}>
          <boxGeometry args={[0.09, 1.4, 0.03]} />
        </mesh>
      </group>
      <mesh position-z={0.12} material={gold}>
        <circleGeometry args={[0.12, 12]} />
      </mesh>
    </group>
  )
}

/** The clock tower in the middle of the central roundabout — a tall stone tower in the
 * Gothic style, a clock on all four sides and a slate spire with gold tips. */
function ClockTower({ stone }) {
  const sand = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plasterTexture(),
        color: '#dcc596',
        roughness: 0.75,
      }),
    [],
  )
  const trim = plainMaterial('#b89c66', { roughness: 0.7 })
  const slate = plainMaterial('#3f5f55', { roughness: 0.55, metalness: 0.2 })
  const gold = plainMaterial('#d4a537', { metalness: 0.85, roughness: 0.25 })
  const shadow = plainMaterial('#5b4a32', { roughness: 0.9 })
  const W = 4.4
  const SHAFT = 22
  const CLOCK_Y = 2 + SHAFT
  const sides = [0, 1, 2, 3].map((k) => (k * Math.PI) / 2)
  return (
    <group position-y={0.36}>
      {/* stepped base */}
      {[7, 6].map((w, k) => (
        <mesh key={w} position-y={0.4 + k * 0.8} material={stone} castShadow receiveShadow>
          <boxGeometry args={[w, 0.8, w]} />
        </mesh>
      ))}
      {/* shaft with vertical ribs and stone bands */}
      <mesh position-y={1.6 + SHAFT / 2} material={sand} castShadow receiveShadow>
        <boxGeometry args={[W, SHAFT, W]} />
      </mesh>
      {sides.map((r) => (
        <group key={r} rotation-y={r}>
          {[-1.4, -0.47, 0.47, 1.4].map((x) => (
            <mesh key={x} position={[x, 1.6 + SHAFT / 2, W / 2 + 0.06]} material={trim} castShadow>
              <boxGeometry args={[0.18, SHAFT - 1, 0.14]} />
            </mesh>
          ))}
          {/* tall narrow windows */}
          {[6, 12, 18].map((y) => (
            <mesh key={y} position={[0, y, W / 2 + 0.02]} material={shadow}>
              <boxGeometry args={[0.6, 2.2, 0.04]} />
            </mesh>
          ))}
        </group>
      ))}
      {[7, 13, 19, CLOCK_Y - 0.4].map((y) => (
        <mesh key={y} position-y={y} material={trim} castShadow>
          <boxGeometry args={[W + 0.35, 0.3, W + 0.35]} />
        </mesh>
      ))}
      {/* clock stage, a little wider, a clock on every side */}
      <mesh position-y={CLOCK_Y + 2.5} material={sand} castShadow>
        <boxGeometry args={[W + 0.8, 5, W + 0.8]} />
      </mesh>
      {sides.map((r) => (
        <group key={r} rotation-y={r}>
          <group position={[0, CLOCK_Y + 2.5, (W + 0.8) / 2 + 0.06]} userData={{ live: true }}>
            <ClockFace stone={trim} />
          </group>
        </group>
      ))}
      <mesh position-y={CLOCK_Y + 5.15} material={trim} castShadow>
        <boxGeometry args={[W + 1.2, 0.3, W + 1.2]} />
      </mesh>
      {/* belfry with arched openings */}
      <mesh position-y={CLOCK_Y + 6.8} material={sand} castShadow>
        <boxGeometry args={[W, 3, W]} />
      </mesh>
      {sides.map((r) => (
        <group key={r} rotation-y={r}>
          {[-0.9, 0.9].map((x) => (
            <group key={x} position={[x, CLOCK_Y + 6.6, W / 2 + 0.02]}>
              <mesh material={shadow}>
                <boxGeometry args={[0.9, 1.6, 0.04]} />
              </mesh>
              <mesh position-y={0.8} material={shadow}>
                <circleGeometry args={[0.45, 16, 0, Math.PI]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* corner pinnacles */}
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz]) => (
        <group key={`${sx}${sz}`} position={[(sx * W) / 2, CLOCK_Y + 8.3, (sz * W) / 2]}>
          <mesh position-y={0.9} rotation-y={Math.PI / 4} material={slate} castShadow>
            <coneGeometry args={[0.45, 1.8, 4]} />
          </mesh>
          <mesh position-y={1.95} material={gold}>
            <sphereGeometry args={[0.12, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* slate spire with a gold cross-tip */}
      <mesh position-y={CLOCK_Y + 8.3 + 4.5} rotation-y={Math.PI / 4} material={slate} castShadow>
        <coneGeometry args={[W * 0.72, 9, 4]} />
      </mesh>
      <mesh position-y={CLOCK_Y + 8.3 + 9.6} material={gold} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 2.4, 8]} />
      </mesh>
      <mesh position-y={CLOCK_Y + 8.3 + 10.9} material={gold}>
        <sphereGeometry args={[0.25, 12, 8]} />
      </mesh>
    </group>
  )
}

/** The fountain on the island of the roundabout at the park's entrance. */
function PlazaFountain({ stone }) {
  const m = getMaterials()
  const jets = useRef(null)
  useFrame((state) => {
    if (jets.current) jets.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.15
  })
  return (
    <group position-y={0.36}>
      <mesh position-y={0.4} material={stone} castShadow receiveShadow>
        <cylinderGeometry args={[7.5, 7.8, 0.8, 48]} />
      </mesh>
      <mesh position-y={0.82} material={m.water}>
        <cylinderGeometry args={[7, 7, 0.06, 48]} />
      </mesh>
      <mesh position-y={1.6} material={stone} castShadow>
        <cylinderGeometry args={[2.4, 2.8, 1.6, 32]} />
      </mesh>
      <group ref={jets}>
        <mesh position-y={4.6} material={m.water}>
          <cylinderGeometry args={[0.25, 0.9, 5, 16]} />
        </mesh>
        {Array.from({ length: 10 }, (_, k) => {
          const t = (k / 10) * Math.PI * 2
          return (
            <mesh key={k} position={[Math.cos(t) * 5, 2.2, Math.sin(t) * 5]} rotation={[Math.sin(t) * 0.35, 0, -Math.cos(t) * 0.35]} material={m.water}>
              <cylinderGeometry args={[0.08, 0.28, 2.8, 8]} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

/** A roundabout: ring of road around a raised island with flowers, trees and a clock tower. */
function Roundabout({ o }) {
  const tex = useMemo(() => asphaltTexture([(o.outer * 2) / 16, (o.outer * 2) / 16]), [o.outer])
  const lawn = useMemo(() => grassTexture([4, 4]), [])
  const stone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plasterTexture(),
        color: '#e7e1d6',
        roughness: 0.7,
      }),
    [],
  )
  const flowers = ['#f43f5e', '#f59e0b', '#ec4899', '#facc15', '#a855f7', '#ef4444']
  const trees = useMemo(
    () => [
      // on the island
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({
        x: o.x + Math.cos(k * 0.785 + 0.4) * 8.2,
        z: o.z + Math.sin(k * 0.785 + 0.4) * 8.2,
        s: 0.8,
      })),
      // the plaza corners around the central one
      ...(o.z !== 0 || o.x !== 0 ? [] : [1, -1].flatMap((sx) =>
        [1, -1].flatMap((sz) => [
          { x: o.x + sx * 11, z: o.z + sz * 30, s: 1 },
          { x: o.x + sx * 16, z: o.z + sz * 27, s: 1.1 },
          { x: o.x + sx * 19, z: o.z + sz * 21.5, s: 0.9 },
        ]),
      )),
    ],
    [o.x, o.z],
  )
  return (
    <group>
      <mesh position={[o.x, ROAD_Y + 0.003, o.z]} rotation-x={-Math.PI / 2} receiveShadow>
        <ringGeometry args={[o.island, o.outer + 1, 72]} />
        <meshStandardMaterial map={tex} roughness={0.92} />
      </mesh>
      <group position={[o.x, 0, o.z]}>
        {/* curb + lawn */}
        <mesh position-y={0.18} material={stone} receiveShadow castShadow>
          <cylinderGeometry args={[o.island, o.island, 0.36, 64]} />
        </mesh>
        <mesh position-y={0.37} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[o.island - 0.4, 64]} />
          <meshStandardMaterial map={lawn} color="#a7d18a" roughness={1} />
        </mesh>
        {/* ring of flower beds */}
        <Instances frames={3} limit={28}>
          <sphereGeometry args={[0.55, 10, 8]} />
          <meshStandardMaterial roughness={0.9} />
          {Array.from({ length: 28 }, (_, k) => {
            const t = (k / 28) * Math.PI * 2
            return <Instance key={k} position={[Math.cos(t) * (o.island - 1.3), 0.6, Math.sin(t) * (o.island - 1.3)]} color={flowers[k % flowers.length]} />
          })}
        </Instances>
        {o.z === 0 && o.x === 0 ? (
          <Baked bakeKey="tower">
            <ClockTower stone={stone} />
          </Baked>
        ) : (
          <PlazaFountain stone={stone} />
        )}
      </group>
      <Trees trees={trees} />
    </group>
  )
}

export function Streets() {
  const walkPieces = useMemo(
    () =>
      X_ROADS.flatMap((r) =>
        [1, -1].flatMap((s) => {
          const z = r.z + s * (r.w / 2 + SIDEWALK / 2)
          return sidewalkPieces(z, r.xMax).map(([a, b]) => ({
            x: (a + b) / 2,
            z,
            len: b - a,
          }))
        }),
      ),
    [],
  )
  return (
    <group>
      <AllRoads />
      {ARCS.map((a) => (
        <ArcRoad key={`${a.cx}:${a.cz}`} a={a} />
      ))}
      {ROUNDABOUTS.map((o) => (
        <Roundabout key={`${o.x}:${o.z}`} o={o} />
      ))}

      <Markings />
      <Sidewalks pieces={walkPieces} />
      <Medians />
      <Footbridges />
    </group>
  )
}

/* ---------------------------------------------------------------- boulevards ---------- */

/** The planted medians of the divided boulevards: a kerbed strip with a low hedge and a tree
 * every 20 m, broken where other roads cross. All instanced. */
function Medians() {
  const m = getMaterials()
  const { curbs, hedges, trees } = useMemo(() => {
    const curbs = []
    const hedges = []
    const trees = []
    for (const r of NX_ROADS) {
      if (!r.median) continue
      for (let x = r.x1 + 5; x < r.x2 - 5; x += 10) {
        if (nearRoundabout(x, r.z, 8) || dashInJunctionX(x, r.z, 5)) continue
        curbs.push({ pos: [x, 0.12, r.z], scale: [10, 1, r.median], rot: 0 })
        hedges.push({ pos: [x, 0.5, r.z], scale: [9.2, 1, r.median - 1.4], rot: 0 })
        if (Math.round(x / 10) % 2 === 0) trees.push({ x, z: r.z, s: 0.85 })
      }
    }
    for (const r of NZ_ROADS) {
      if (!r.median) continue
      for (let z = r.z1 + 5; z < r.z2 - 5; z += 10) {
        if (nearRoundabout(r.x, z, 8) || dashInJunctionZ(r.x, z, 5)) continue
        curbs.push({ pos: [r.x, 0.12, z], scale: [10, 1, r.median], rot: Math.PI / 2 })
        hedges.push({ pos: [r.x, 0.5, z], scale: [9.2, 1, r.median - 1.4], rot: Math.PI / 2 })
        if (Math.round(z / 10) % 2 === 0) trees.push({ x: r.x, z, s: 0.85 })
      }
    }
    return { curbs, hedges, trees }
  }, [])
  return (
    <group>
      <Instances frames={3} limit={curbs.length} material={m.stone} receiveShadow>
        <boxGeometry args={[1, 0.24, 1]} />
        {curbs.map((c, i) => (
          <Instance key={i} position={c.pos} scale={c.scale} rotation-y={c.rot} />
        ))}
      </Instances>
      <Instances frames={3} limit={hedges.length} material={m.hedge} castShadow>
        <boxGeometry args={[1, 0.6, 1]} />
        {hedges.map((c, i) => (
          <Instance key={i} position={c.pos} scale={c.scale} rotation-y={c.rot} />
        ))}
      </Instances>
      <Trees trees={trees} />
    </group>
  )
}

/** Pedestrian bridges over the boulevards: stair towers on both kerbs, a deck with glass
 * railings across, so people never have to cross six lanes on foot. */
function Footbridges() {
  const m = getMaterials()
  const steel = plainMaterial('#e5e7eb', { metalness: 0.6, roughness: 0.3 })
  const span = ARTERIAL.w + 8
  return (
    <Baked bakeKey="footbridges">
      {FOOTBRIDGES.map((b) => (
        <group key={`${b.x}:${b.z}`} position={[b.x, 0, b.z]} rotation-y={b.alongX ? Math.PI / 2 : 0}>
          {/* (local x crosses the road) */}
          {[-1, 1].map((sd) => (
            <group key={sd} position-x={sd * (span / 2)}>
              <mesh position-y={3.6} material={steel} castShadow>
                <boxGeometry args={[3.2, 7.2, 4]} />
              </mesh>
              <mesh position={[sd * 0.02, 3.6, 2.05]} material={m.glass}>
                <boxGeometry args={[2.6, 6.2, 0.06]} />
              </mesh>
            </group>
          ))}
          <mesh position-y={6.9} material={steel} castShadow receiveShadow>
            <boxGeometry args={[span + 3.2, 0.5, 3.2]} />
          </mesh>
          {[-1, 1].map((sz) => (
            <mesh key={sz} position={[0, 7.75, sz * 1.55]} material={m.glass}>
              <boxGeometry args={[span + 3, 1.2, 0.06]} />
            </mesh>
          ))}
          {/* a supporting column on the median */}
          <mesh position-y={3.4} material={steel} castShadow>
            <cylinderGeometry args={[0.35, 0.45, 6.8, 12]} />
          </mesh>
        </group>
      ))}
    </Baked>
  )
}

/* ---------------------------------------------------------------- expressways --------- */

/** A box-like strip running along Z: x from `x0` to `x1`, top/bottom heights as functions
 * of z. `faces` picks which sides to build. */
function stripGeometry(x0, x1, top, bottom, zs, faces = { top: true, bottom: true, sides: true }, uvScale = 8) {
  const pos = []
  const uv = []
  const quad = (a, b, c, d, ua, ub, uc, ud) => {
    pos.push(...a, ...b, ...c, ...a, ...c, ...d)
    uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud)
  }
  const w = (x1 - x0) / uvScale
  for (let k = 0; k < zs.length - 1; k += 1) {
    const za = zs[k]
    const zb = zs[k + 1]
    const ta = top(za)
    const tb = top(zb)
    const ba = bottom(za)
    const bb = bottom(zb)
    const va = za / uvScale
    const vb = zb / uvScale
    if (faces.top) quad([x0, ta, za], [x0, tb, zb], [x1, tb, zb], [x1, ta, za], [0, va], [0, vb], [w, vb], [w, va])
    if (faces.bottom) quad([x0, ba, za], [x1, ba, za], [x1, bb, zb], [x0, bb, zb], [0, va], [w, va], [w, vb], [0, vb])
    if (faces.sides) {
      quad([x1, ba, za], [x1, ta, za], [x1, tb, zb], [x1, bb, zb], [va, ba / uvScale], [va, ta / uvScale], [vb, tb / uvScale], [vb, bb / uvScale])
      quad([x0, ba, za], [x0, bb, zb], [x0, tb, zb], [x0, ta, za], [va, ba / uvScale], [vb, bb / uvScale], [vb, tb / uvScale], [va, ta / uvScale])
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

const DECK_T = 1.1

function Expressway({ ox }) {
  const m = getMaterials()
  const H = OVERPASS.half
  const parts = useMemo(() => {
    const zs = []
    for (let z = -OVERPASS.end; z <= OVERPASS.end + 0.01; z += 2) zs.push(z)
    const top = (z) => deckHeight(z) + 0.05
    const under = (z) => Math.max(0.02, deckHeight(z) - DECK_T)
    return {
      road: stripGeometry(-H, H, top, top, zs, { top: true }, 16),
      body: stripGeometry(-H - 0.05, H + 0.05, (z) => top(z) - 0.02, under, zs, { bottom: true, sides: true }, 6),
      railL: stripGeometry(-H, -H + 0.38, (z) => top(z) + 0.95, top, zs, { top: true, sides: true }, 4),
      railR: stripGeometry(H - 0.38, H, (z) => top(z) + 0.95, top, zs, { top: true, sides: true }, 4),
      lineL: stripGeometry(-0.22, -0.08, (z) => top(z) + 0.012, top, zs, { top: true }, 4),
      lineR: stripGeometry(0.08, 0.22, (z) => top(z) + 0.012, top, zs, { top: true }, 4),
      edgeL: stripGeometry(-H + 0.6, -H + 0.75, (z) => top(z) + 0.012, top, zs, { top: true }, 4),
      edgeR: stripGeometry(H - 0.75, H - 0.6, (z) => top(z) + 0.012, top, zs, { top: true }, 4),
    }
  }, [H])
  const asphalt = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: asphaltTexture([1, 1]),
        roughness: 0.9,
      }),
    [],
  )
  const concrete = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: concreteTexture([1, 1]),
        color: '#d4d0c8',
        roughness: 0.9,
      }),
    [],
  )
  // piers: one round column with a cap beam under the deck
  const piers = useMemo(() => {
    const list = []
    for (let z = -OVERPASS.end + 22; z <= OVERPASS.end - 22; z += 18) {
      if (onXRoad(z, 0.6)) continue
      list.push({ z, h: deckHeight(z) - DECK_T })
    }
    return list.filter((p) => p.h > 1.2)
  }, [])

  return (
    <group position-x={ox}>
      <Baked bakeKey={`ov${ox}`}>
        <mesh geometry={parts.road} material={asphalt} receiveShadow />
        <mesh geometry={parts.body} material={concrete} castShadow receiveShadow />
        <mesh geometry={parts.railL} material={concrete} castShadow />
        <mesh geometry={parts.railR} material={concrete} castShadow />
        <mesh geometry={parts.lineL} material={m.lineYellow} />
        <mesh geometry={parts.lineR} material={m.lineYellow} />
        <mesh geometry={parts.edgeL} material={m.lineWhite} />
        <mesh geometry={parts.edgeR} material={m.lineWhite} />
        {piers.map((p) => (
          <group key={p.z} position-z={p.z}>
            <mesh position-y={p.h / 2} material={concrete} castShadow receiveShadow>
              <cylinderGeometry args={[0.9, 1.05, p.h, 18]} />
            </mesh>
            <mesh position-y={p.h - 0.4} material={concrete} castShadow>
              <boxGeometry args={[9, 0.8, 1.6]} />
            </mesh>
          </group>
        ))}
      </Baked>
    </group>
  )
}

/** The two elevated expressways — they fly over the avenue and the streets. */
export function Overpasses() {
  return OVERPASS.xs.map((ox) => <Expressway key={ox} ox={ox} />)
}

/* ---------------------------------------------------------------- street lamps -------- */

/** Street lamps: instanced poles, arms and glowing heads, plus warm pools on the ground at
 * night. (The light they cast on everything else is done in the shader — lampShader.js.) */
export function StreetLamps() {
  const m = getMaterials()
  const poolMat = useMemo(
    () =>
      followNight(
        new THREE.MeshBasicMaterial({
          map: lightPoolTexture(),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        }),
        'opacity',
        1,
        0,
      ),
    [],
  )
  const lamps = useMemo(() => streetLamps(), [])
  const armRot = (l) => (l.ax === 'x' ? Math.PI / 2 : 0)

  return (
    <>
      <Instances frames={3} limit={lamps.length} material={m.metalDark} castShadow>
        <cylinderGeometry args={[0.11, 0.17, 10, 8]} />
        {lamps.map((l, i) => (
          <Instance key={i} position={[l.x, l.y + 5, l.z]} />
        ))}
      </Instances>
      <Instances frames={3} limit={lamps.length} material={m.metalDark} castShadow>
        <boxGeometry args={[0.12, 0.12, 2]} />
        {lamps.map((l, i) => (
          <Instance key={i} position={[(l.x + l.hx) / 2, l.y + 9.95, (l.z + l.hz) / 2]} rotation-y={armRot(l)} />
        ))}
      </Instances>
      <Instances frames={3} limit={lamps.length} material={m.lamp}>
        <boxGeometry args={[0.55, 0.14, 1]} />
        {lamps.map((l, i) => (
          <Instance key={i} position={[l.hx, l.hy + 0.25, l.hz]} rotation-y={armRot(l)} />
        ))}
      </Instances>
      {/* warm pools of light on the road at night */}
      <Instances frames={3} limit={lamps.length} material={poolMat}>
        <planeGeometry args={[19, 19]} />
        {lamps.map((l, i) => {
          const k = (LAMP_ARM + 0.5) / LAMP_ARM
          return <Instance key={i} position={[l.x + (l.hx - l.x) * k, l.y + 0.12, l.z + (l.hz - l.z) * k]} rotation-x={-Math.PI / 2} />
        })}
      </Instances>
    </>
  )
}

const LIGHT_COLORS = { red: '#ef4444', yellow: '#f59e0b', green: '#22c55e' }

/** Traffic lights: a pole on each corner of every junction, with one head for X traffic and
 * one for Z traffic. Lamps are instanced per (axis, colour) and lit by a shared clock, so all
 * players see the same phase. */
export function TrafficLights() {
  const m = getMaterials()
  const { poles, heads, lamps } = useMemo(() => {
    const poles = []
    const heads = []
    const lamps = {
      x: { red: [], yellow: [], green: [] },
      z: { red: [], yellow: [], green: [] },
    }
    for (const j of INTERSECTIONS) {
      // two poles per junction, on opposite corners
      for (const [sx, sz] of [
        [-1, -1],
        [1, 1],
      ]) {
        {
          const px = j.x + sx * (j.hx + 1.1)
          const pz = j.z + sz * (j.hz + 1.1)
          poles.push([px, pz])
          // head for X traffic hangs over the X road; head for Z traffic over the cross street
          const hxPos = [px, 4.6, pz - sz * 1.2]
          const hzPos = [px - sx * 1.2, 4.6, pz]
          heads.push({ pos: hxPos, rotY: Math.PI / 2 }, { pos: hzPos, rotY: 0 })
          ;['red', 'yellow', 'green'].forEach((c, k) => {
            lamps.x[c].push([hxPos[0], hxPos[1] + 0.36 - k * 0.36, hxPos[2]])
            lamps.z[c].push([hzPos[0], hzPos[1] + 0.36 - k * 0.36, hzPos[2]])
          })
        }
      }
    }
    return { poles, heads, lamps }
  }, [])

  const mats = useMemo(() => {
    const out = {}
    for (const axis of ['x', 'z']) {
      out[axis] = {}
      for (const c of ['red', 'yellow', 'green']) {
        out[axis][c] = new THREE.MeshStandardMaterial({
          color: LIGHT_COLORS[c],
          emissive: LIGHT_COLORS[c],
          emissiveIntensity: 0,
          toneMapped: false,
        })
      }
    }
    return out
  }, [])

  // lamp materials are mutated every frame — reach them through a ref
  const matsRef = useRef(mats)
  useEffect(() => {
    matsRef.current = mats
  }, [mats])

  useFrame(() => {
    const t = Date.now() / 1000
    for (const axis of ['x', 'z']) {
      const on = lightState(axis, t)
      for (const c of ['red', 'yellow', 'green']) {
        const mat = matsRef.current[axis][c]
        mat.emissiveIntensity = c === on ? 2.2 : 0
        mat.color.set(c === on ? LIGHT_COLORS[c] : '#2a2a2a')
      }
    }
  })

  return (
    <>
      <Instances frames={3} limit={poles.length} material={m.metalDark} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 5.2, 8]} />
        {poles.map(([x, z], i) => (
          <Instance key={i} position={[x, 2.6, z]} />
        ))}
      </Instances>
      <Instances frames={3} limit={poles.length * 2} material={m.metalDark}>
        <boxGeometry args={[0.1, 0.1, 1.3]} />
        {heads.map((h, i) => (
          <Instance
            key={i}
            position={[(h.pos[0] + poles[Math.floor(i / 2)][0]) / 2, 5.2, (h.pos[2] + poles[Math.floor(i / 2)][1]) / 2]}
            rotation-y={h.rotY === 0 ? Math.PI / 2 : 0}
          />
        ))}
      </Instances>
      <Instances frames={3} limit={heads.length} castShadow>
        <boxGeometry args={[0.42, 1.2, 0.42]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
        {heads.map((h, i) => (
          <Instance key={i} position={h.pos} rotation-y={h.rotY} />
        ))}
      </Instances>
      {['x', 'z'].flatMap((axis) =>
        ['red', 'yellow', 'green'].map((c) => (
          <Instances key={`${axis}${c}`} frames={3} limit={lamps[axis][c].length} material={mats[axis][c]}>
            <sphereGeometry args={[0.15, 12, 8]} />
            {lamps[axis][c].map((p, i) => (
              <Instance key={i} position={p} scale={[1.6, 1, 1.6]} />
            ))}
          </Instances>
        )),
      )}
    </>
  )
}
