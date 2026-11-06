import { useMemo } from 'react'
import * as THREE from 'three'
import { getMaterials, plainMaterial } from '@/pages/TownPage/scene/materials'

/** The inside of one floor of a building, drawn only while the player is in it: floor,
 * ceiling with lights, walls with real window openings (you see the actual city through
 * them), the front door on the ground floor, the lift on the back wall, and furniture that
 * suits the kind of building. Built in the building's own frame (front = +z). */

const WALL_T = 0.12

/** Pieces of [a, b] left after cutting out the given [from, to] ranges. */
function remaining(a, b, cuts) {
  const out = []
  let x = a
  for (const [c0, c1] of [...cuts].sort((p, q) => p[0] - q[0])) {
    if (c0 - x > 0.01) out.push([x, c0])
    x = Math.max(x, c1)
  }
  if (b - x > 0.01) out.push([x, b])
  return out
}

/** One wall along local x, `len` long and `h` high, with a window every ~2.6 m and
 * full-height openings (`gaps`: [centre, width]) for the door or the lift. */
function Wall({ len, h, z = 0, x = 0, rot = 0, gaps = [], mat }) {
  const parts = useMemo(() => {
    const sill = Math.min(0.9, h * 0.28)
    const top = Math.min(h - 0.45, sill + 1.45)
    const doors = gaps.map(([c, gw]) => [c - gw / 2, c + gw / 2])
    const n = Math.max(1, Math.floor(len / 2.6))
    const windows = []
    for (let k = 0; k < n; k += 1) {
      const c = -len / 2 + (len / n) * (k + 0.5)
      if (doors.some(([d0, d1]) => c + 0.75 > d0 - 0.5 && c - 0.75 < d1 + 0.5)) continue
      windows.push([c - 0.75, c + 0.75])
    }
    const out = []
    // below the windows (cut only where the doors are)
    for (const [a, b] of remaining(-len / 2, len / 2, doors)) out.push({ cx: (a + b) / 2, cy: sill / 2, w: b - a, hh: sill })
    // between the windows and doors
    for (const [a, b] of remaining(-len / 2, len / 2, [...doors, ...windows])) out.push({ cx: (a + b) / 2, cy: (sill + top) / 2, w: b - a, hh: top - sill })
    // above everything
    out.push({ cx: 0, cy: (top + h) / 2, w: len, hh: h - top })
    return out
  }, [len, h, gaps])
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      {parts.map((p, i) => (
        <mesh key={i} position={[p.cx, p.cy, 0]} material={mat}>
          <boxGeometry args={[p.w, p.hh, WALL_T]} />
        </mesh>
      ))}
    </group>
  )
}

function Furniture({ kind, w, d, seed }) {
  const m = getMaterials()
  const fabric = plainMaterial(['#2563eb', '#16a34a', '#b45309', '#7c3aed', '#be123c'][seed % 5], { roughness: 0.9 })
  const wood = plainMaterial('#8b5a2b', { roughness: 0.6 })
  const dark = plainMaterial('#1f2937', { roughness: 0.5 })
  const screen = plainMaterial('#60a5fa', { roughness: 0.2 })
  if (kind === 'office' || kind === 'school') {
    // rows of desks (with screens in offices), a board at the back in schools
    const rows = []
    for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 2.6) {
      for (let z = -d / 2 + 3; z <= d / 2 - 2.6; z += 2.4) rows.push([x, z])
    }
    return (
      <group>
        {rows.slice(0, 16).map(([x, z]) => (
          <group key={`${x}:${z}`} position={[x, 0, z]}>
            <mesh position-y={0.74} material={kind === 'school' ? wood : m.white}>
              <boxGeometry args={[1.4, 0.06, 0.7]} />
            </mesh>
            {[-0.6, 0.6].map((lx) => (
              <mesh key={lx} position={[lx, 0.37, 0]} material={dark}>
                <boxGeometry args={[0.05, 0.74, 0.6]} />
              </mesh>
            ))}
            {kind === 'office' && (
              <mesh position={[0, 1.02, -0.2]} material={screen}>
                <boxGeometry args={[0.6, 0.38, 0.04]} />
              </mesh>
            )}
            <mesh position={[0, 0.45, 0.55]} material={fabric}>
              <boxGeometry args={[0.45, 0.08, 0.45]} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }
  if (kind === 'mall' || kind === 'shop') {
    // display shelves with coloured goods
    const shelves = []
    for (let x = -w / 2 + 2.5; x <= w / 2 - 2.5; x += 3.5) shelves.push(x)
    return (
      <group>
        {shelves.map((x, k) => (
          <group key={x} position={[x, 0, -0.5]}>
            <mesh position-y={0.8} material={m.white}>
              <boxGeometry args={[0.6, 1.6, Math.min(5, d - 4)]} />
            </mesh>
            {[0.45, 0.95, 1.45].map((y) => (
              <mesh key={y} position={[0.32, y, 0]} material={plainMaterial(['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][(k + Math.round(y * 2)) % 4])}>
                <boxGeometry args={[0.05, 0.3, Math.min(4.6, d - 4.4)]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    )
  }
  // homes and hotel rooms: rug, sofa, coffee table, a plant and a bed
  return (
    <group>
      <mesh position={[0, 0.02, 0.5]} rotation-x={-Math.PI / 2} material={plainMaterial('#9f1239', { roughness: 1 })}>
        <planeGeometry args={[Math.min(3.2, w - 3), Math.min(2.4, d - 3)]} />
      </mesh>
      <group position={[-w / 2 + 1.4, 0, 0.5]} rotation-y={Math.PI / 2}>
        <mesh position-y={0.25} material={fabric}>
          <boxGeometry args={[2.2, 0.5, 0.9]} />
        </mesh>
        <mesh position={[0, 0.6, -0.38]} material={fabric}>
          <boxGeometry args={[2.2, 0.7, 0.18]} />
        </mesh>
      </group>
      <mesh position={[0, 0.4, 0.5]} material={wood}>
        <boxGeometry args={[1.1, 0.06, 0.6]} />
      </mesh>
      <group position={[w / 2 - 1.6, 0, -d / 2 + 1.6]}>
        <mesh position-y={0.25} material={wood}>
          <boxGeometry args={[1.6, 0.5, 2.1]} />
        </mesh>
        <mesh position={[0, 0.55, 0.3]} material={m.white}>
          <boxGeometry args={[1.5, 0.12, 1.4]} />
        </mesh>
      </group>
      <group position={[w / 2 - 0.8, 0, d / 2 - 0.9]}>
        <mesh position-y={0.25} material={plainMaterial('#a16207')}>
          <cylinderGeometry args={[0.22, 0.18, 0.5, 10]} />
        </mesh>
        <mesh position-y={0.8} material={plainMaterial('#3f6f2a', { roughness: 0.9 })}>
          <icosahedronGeometry args={[0.45, 1]} />
        </mesh>
      </group>
    </group>
  )
}

export function Interior({ b, floor }) {
  const level = b.levels[floor]
  const w = b.w - 0.3
  const d = b.d - 0.3
  const h = level.h - 0.25
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1ece2', roughness: 0.9 }), [])
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: b.kind === 'office' || b.kind === 'mall' ? '#d6d3d1' : '#a47148', roughness: 0.7 }), [b.kind])
  // the ceiling faces down, where only the ground's green bounce light would reach it
  const ceiling = useMemo(() => new THREE.MeshBasicMaterial({ color: '#e7e2d8' }), [])
  const ceilingLight = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff7e0', emissiveIntensity: 1.2 }), [])
  const metal = plainMaterial('#cbd5e1', { metalness: 0.8, roughness: 0.25 })
  const ground = floor === 0
  return (
    <group position={[b.x, level.y, b.z]} rotation-y={b.rot}>
      {/* floor and ceiling */}
      <mesh position-y={0.02} rotation-x={-Math.PI / 2} material={floorMat}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh position-y={h} rotation-x={Math.PI / 2} material={ceiling}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * w * 0.22, h - 0.03, 0]} rotation-x={Math.PI / 2} material={ceilingLight}>
          <planeGeometry args={[1.2, Math.min(4, d * 0.5)]} />
        </mesh>
      ))}
      {/* walls: front (door on the ground floor), back (the lift), sides */}
      <Wall len={w} h={h} z={d / 2} gaps={ground ? [[0, 1.8]] : []} mat={wall} />
      <Wall len={w} h={h} z={-d / 2} gaps={[[0, 1.6]]} mat={wall} />
      <Wall len={d} h={h} x={-w / 2} rot={Math.PI / 2} mat={wall} />
      <Wall len={d} h={h} x={w / 2} rot={Math.PI / 2} mat={wall} />
      {/* the lift: steel doors in a frame, a lit call button */}
      <group position={[0, 0, -d / 2 + 0.08]}>
        {[-0.4, 0.4].map((x) => (
          <mesh key={x} position={[x, 1.1, 0]} material={metal}>
            <boxGeometry args={[0.78, 2.2, 0.06]} />
          </mesh>
        ))}
        <mesh position={[0, 2.35, 0]} material={plainMaterial('#334155')}>
          <boxGeometry args={[1.9, 0.3, 0.1]} />
        </mesh>
        <mesh position={[1.05, 1.2, 0.04]}>
          <boxGeometry args={[0.12, 0.2, 0.03]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>
      <Furniture kind={b.kind} w={w} d={d} seed={floor + b.floors} />
    </group>
  )
}
