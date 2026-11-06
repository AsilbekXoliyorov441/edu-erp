import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { ARCS, TOWN_HALF_X, TOWN_HALF_Z, WORLD, isDrivable, onArc } from '@/shared/config/town'
import { getMaterials, plainMaterial } from '@/pages/TownPage/scene/materials'

function seeded(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const LEAF_COLORS = ['#3f6f2a', '#4b7d31', '#355f24', '#5a8a3a', '#2f5420', '#6b8f3a']

/** Trees as instanced trunks + clustered leaf blobs. `trees` = [{ x, z, s }]. */
export function Trees({ trees }) {
  const m = getMaterials()
  const leaves = useMemo(
    () =>
      trees.flatMap((t, i) => {
        const s = t.s ?? 1
        return [0, 1, 2, 3].map((k) => ({
          pos: [
            t.x + (k === 0 ? 0 : Math.cos(k * 2.1 + i) * 1.1 * s),
            (4.2 + (k === 0 ? 1.2 : seeded(i * 7 + k) * 0.8)) * s,
            t.z + (k === 0 ? 0 : Math.sin(k * 2.1 + i) * 1.1 * s),
          ],
          scale: (k === 0 ? 2.2 : 1.5 + seeded(i * 3 + k) * 0.5) * s,
          color: LEAF_COLORS[Math.floor(seeded(i * 13 + k) * LEAF_COLORS.length)],
        }))
      }),
    [trees],
  )

  return (
    <>
      <Instances frames={3} limit={trees.length} material={m.trunk} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 4, 7]} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 2 * (t.s ?? 1), t.z]} scale={t.s ?? 1} />
        ))}
      </Instances>
      <Instances frames={3} limit={leaves.length} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
        {leaves.map((l, i) => (
          <Instance key={i} position={l.pos} scale={l.scale} color={l.color} />
        ))}
      </Instances>
    </>
  )
}

/** Forest belt around the town plus a few distant hills, so the edge of the world isn't a
 * flat cut-off. */
export function Surroundings({ sparse = false }) {
  const trees = useMemo(() => {
    const list = []
    let n = 1
    const cx = (WORLD.minX + WORLD.maxX) / 2
    const cz = (WORLD.minZ + WORLD.maxZ) / 2
    const hx = (WORLD.maxX - WORLD.minX) / 2
    const hz = (WORLD.maxZ - WORLD.minZ) / 2
    for (let i = 0; i < 760; i += 1) {
      n += 1
      const angle = seeded(n) * Math.PI * 2
      const rx = hx + 24 + seeded(n + 500) * 170
      const rz = hz + 24 + seeded(n + 900) * 150
      const x = cx + Math.cos(angle) * rx
      const z = cz + Math.sin(angle) * rz
      // never inside the world, and the skyline east of the town stays clear
      if (x > WORLD.minX - 14 && x < WORLD.maxX + 14 && z > WORLD.minZ - 14 && z < WORLD.maxZ + 14) continue
      if (x > TOWN_HALF_X + 25 && x < WORLD.maxX + 140 && z > -95 && z < 95) continue
      list.push({ x, z, s: 0.9 + seeded(n + 1300) * 0.9 })
    }
    // a tree-lined boulevard along the south side of the ring road
    for (let x = -TOWN_HALF_X + 60; x <= TOWN_HALF_X - 60; x += 16) if (!isDrivable(x, -(TOWN_HALF_Z + 6), -3)) list.push({ x, z: -(TOWN_HALF_Z + 6), s: 1.05 })
    // little groves in the corners the curved ring road leaves outside
    for (const a of ARCS) {
      if (a.kind !== 'ring') continue
      for (let k = 0; k < 40; k += 1) {
        n += 1
        const x = a.cx + a.sx * seeded(n) * (a.r + 12)
        const z = a.cz + a.sz * seeded(n + 77) * (a.r + 12)
        if (Math.hypot(x - a.cx, z - a.cz) < a.r + a.w / 2 + 3 || onArc(a, x, z, 3) || isDrivable(x, z, -4)) continue
        list.push({ x, z, s: 0.9 + seeded(n + 5) * 0.6 })
      }
    }
    return list
  }, [])

  const shown = useMemo(() => (sparse ? trees.filter((_, i) => i % 3 === 0) : trees), [trees, sparse])
  const hill = plainMaterial('#5d7f45', { roughness: 1 })

  return (
    <>
      <Trees key={shown.length} trees={shown} />
      {[
        [-1250, -300, 260],
        [1250, 150, 280],
        [-1220, 950, 260],
        [1180, 1150, 250],
        [0, -950, 300],
        [-650, -900, 240],
        [700, -880, 260],
        [480, 1750, 300],
        [-520, 1720, 280],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, -r * 0.55, z]} material={hill} receiveShadow>
          <sphereGeometry args={[r, 24, 16]} />
        </mesh>
      ))}
    </>
  )
}
