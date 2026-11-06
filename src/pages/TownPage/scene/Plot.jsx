import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, Instance, Instances } from '@react-three/drei'
import { DISTRICTS, formatMoney } from '@/shared/config/town'
import { concreteTexture, dirtTexture, grassTexture, signTexture } from '@/pages/TownPage/scene/textures'
import { getMaterials, glowPool, plainMaterial } from '@/pages/TownPage/scene/materials'
import { Building } from '@/pages/TownPage/scene/Buildings'
import { Baked } from '@/pages/TownPage/scene/Baked'
import { Lod } from '@/pages/TownPage/scene/Lod'
import { buildingBox } from '@/pages/TownPage/scene/buildingInfo'
import { Car } from '@/pages/TownPage/scene/Car'

const HOUSE_X = -2

function SelectionFrame({ w, d, color }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.4,
        toneMapped: false,
      }),
    [color],
  )
  const ref = useRef(material)
  useEffect(() => {
    ref.current = material
  }, [material])
  useFrame((state) => {
    ref.current.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.6
  })
  const t = 0.35
  return (
    <group position-y={0.3}>
      {[
        [0, d / 2, w + t, t],
        [0, -d / 2, w + t, t],
        [w / 2, 0, t, d],
        [-w / 2, 0, t, d],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x, 0, z]} material={material}>
          <boxGeometry args={[sx, 0.12, sz]} />
        </mesh>
      ))}
    </group>
  )
}

function YardTree({ x, z, s = 1 }) {
  const m = getMaterials()
  const leaf = plainMaterial('#47772f', { roughness: 0.95 })
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position-y={1.5} material={m.trunk} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 3, 7]} />
      </mesh>
      <mesh position-y={3.6} material={leaf} castShadow>
        <icosahedronGeometry args={[1.6, 1]} />
      </mesh>
      <mesh position={[0.7, 3.1, 0.3]} material={leaf} castShadow>
        <icosahedronGeometry args={[1.1, 1]} />
      </mesh>
    </group>
  )
}

/** Red sign on a city plot for sale (border in the district colour); yellow when a player
 * resells theirs. One mesh, one material (the board); the posts of the empty lots' signs
 * are drawn for the whole town at once by <LotSignPosts>. */
function ForSaleSign({ plot, price = plot.price, resale = false, x = 0, posts = false }) {
  const m = getMaterials()
  const material = useMemo(() => {
    const tex = signTexture('SOTILADI', {
      bg: resale ? '#facc15' : '#dc2626',
      fg: resale ? '#111827' : '#ffffff',
      sub: `№${plot.number} • ${formatMoney(price)}`,
      border: DISTRICTS[plot.district]?.color ?? '#ffffff',
    })
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
  }, [plot.number, plot.district, price, resale])
  return (
    <group position={[x, 0, plot.d / 2 - 2]}>
      {posts &&
        [-1.3, 1.3].map((px) => (
          <mesh key={px} position={[px, 1.1, 0]} material={m.wood}>
            <boxGeometry args={[0.14, 2.2, 0.14]} />
          </mesh>
        ))}
      <mesh position={[0, 2.1, 0.08]} material={material}>
        <boxGeometry args={[3.2, 0.8, 0.06]} />
      </mesh>
    </group>
  )
}

/** The posts of every empty lot's sign, in one draw call. */
export function LotSignPosts({ plots }) {
  const m = getMaterials()
  const posts = useMemo(() => {
    const list = []
    for (const plot of plots) {
      const c = Math.cos(plot.rotation)
      const sn = Math.sin(plot.rotation)
      const lz = plot.d / 2 - 2
      for (const px of [-1.3, 1.3]) list.push([plot.x + px * c + lz * sn, 1.1, plot.z - px * sn + lz * c])
    }
    return list
  }, [plots])
  return (
    <Instances frames={3} limit={Math.max(1, posts.length)} material={m.wood}>
      <boxGeometry args={[0.14, 2.2, 0.14]} />
      {posts.map((pos, i) => (
        <Instance key={i} position={pos} />
      ))}
    </Instances>
  )
}

function OwnerTag({ owned, isMine, x, z }) {
  const box = buildingBox(owned.kind, owned.design, owned.floors)
  return (
    <Html position={[x, Math.max(5, box.h) + 2.5, z]} center zIndexRange={[20, 0]}>
      <div
        className="pointer-events-none flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white shadow-lg select-none"
        style={{ background: isMine ? '#2563eb' : 'rgba(17,24,39,0.82)' }}
      >
        <span className="size-2.5 rounded-full ring-2 ring-white/70" style={{ background: owned.ownerColor }} />
        {owned.ownerName}
        {isMine && <span className="rounded bg-white/25 px-1 text-[10px]">SIZ</span>}
      </div>
    </Html>
  )
}

const SITE_MS = 9000

/** Scaffolding + a tower crane around a house that was just built up — shown for a few
 * seconds after a floor is added (keyed by `builtAt`, so each new floor replays it). */
function ConstructionSite({ box, floors, builtAt }) {
  const [visible, setVisible] = useState(() => Date.now() - builtAt < SITE_MS)
  const jib = useRef(null)
  const hook = useRef(null)
  useEffect(() => {
    if (!visible) return undefined
    const id = setTimeout(() => setVisible(false), Math.max(0, SITE_MS - (Date.now() - builtAt)))
    return () => clearTimeout(id)
  }, [visible, builtAt])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (jib.current) jib.current.rotation.y = -0.6 + Math.sin(t * 0.5) * 0.5
    if (hook.current) hook.current.position.y = -4 - Math.abs(Math.sin(t * 0.8)) * 5
  })
  if (!visible) return null

  const yellow = plainMaterial('#f5b301', { roughness: 0.5, metalness: 0.3 })
  const pole = plainMaterial('#9ca3af', { roughness: 0.4, metalness: 0.7 })
  const plank = plainMaterial('#a16207', { roughness: 0.9 })
  const h = Math.min(box.h, 60)
  const hw = box.w / 2 + 0.9
  const hd = box.d / 2 + 0.9
  const mastH = box.h + 9
  const levels = Math.min(floors, 14)

  return (
    <group>
      {/* scaffolding poles + planks every floor */}
      {[-hw, 0, hw].flatMap((x) =>
        [-hd, hd].map((z) => (
          <mesh key={`${x}${z}`} position={[x, h / 2, z]} material={pole} castShadow>
            <cylinderGeometry args={[0.05, 0.05, h, 6]} />
          </mesh>
        )),
      )}
      {Array.from({ length: levels }, (_, i) =>
        [-hd, hd].map((z) => (
          <mesh key={`${i}${z}`} position={[0, ((i + 1) * h) / (levels + 0.3), z]} material={plank} castShadow>
            <boxGeometry args={[hw * 2, 0.08, 0.7]} />
          </mesh>
        )),
      )}
      {/* green safety net on the street side */}
      <mesh position={[0, h / 2, hd + 0.05]}>
        <planeGeometry args={[hw * 2, h]} />
        <meshStandardMaterial color="#16a34a" transparent opacity={0.35} side={2} depthWrite={false} />
      </mesh>
      {/* tower crane */}
      <group position={[hw + 2.2, 0, -hd - 1]}>
        <mesh position-y={mastH / 2} material={yellow} castShadow>
          <boxGeometry args={[0.7, mastH, 0.7]} />
        </mesh>
        <group ref={jib} position-y={mastH}>
          <mesh position={[-5, 0.4, 0]} material={yellow} castShadow>
            <boxGeometry args={[14, 0.45, 0.45]} />
          </mesh>
          <mesh position={[3.5, 0.2, 0]} material={plainMaterial('#4b5563')} castShadow>
            <boxGeometry args={[2, 1, 1]} />
          </mesh>
          <mesh position={[0, 1.5, 0]} material={yellow}>
            <boxGeometry args={[0.4, 2.6, 0.4]} />
          </mesh>
          <group position={[-9, 0, 0]}>
            <group ref={hook}>
              <mesh position-y={2.5} material={pole}>
                <cylinderGeometry args={[0.02, 0.02, 5, 4]} />
              </mesh>
              <mesh material={plainMaterial('#9ca3af', { roughness: 0.8 })} castShadow>
                <boxGeometry args={[1.4, 0.7, 1.4]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/** Each kind of building lights its surroundings its own way at night. */
const GLOW = {
  house: { color: '#ffb35c', max: 0.75 },
  shop: { color: '#fff1d0', max: 0.95 },
  apartment: { color: '#ffc477', max: 0.85 },
  office: { color: '#cfe2ff', max: 0.9 },
  hotel: { color: '#ffd9a0', max: 0.9 },
  school: { color: '#fff3c4', max: 0.8 },
  mall: { color: '#e8f2ff', max: 1 },
  stall: { color: '#ffe7b8', max: 0.9 },
}
const BIG_GLOW = new Set(['office', 'apartment', 'hotel', 'school', 'mall'])

function BuildingGlow({ owned }) {
  if (!owned.floors) return null
  const box = buildingBox(owned.kind, owned.design, owned.floors)
  const g = GLOW[owned.kind] ?? GLOW.house
  const mat = glowPool(g.color, g.max)
  const big = BIG_GLOW.has(owned.kind)
  return (
    <group>
      {/* spill out of the front windows / door onto the yard */}
      <mesh position={[0, 0.11, box.d / 2 + 3.5]} rotation-x={-Math.PI / 2} material={mat}>
        <planeGeometry args={[box.w * 1.6, 11]} />
      </mesh>
      {/* tall buildings light the ground all around them */}
      {big && (
        <mesh position-y={0.1} rotation-x={-Math.PI / 2} material={mat}>
          <planeGeometry args={[box.w + 16, box.d + 16]} />
        </mesh>
      )}
    </group>
  )
}

function seeded(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Garden trees for roomy plots: spread over the yard, clear of the building, the front
 * yard and the driveway. */
function gardenTrees(plot, b, tight) {
  const halfW = plot.w / 2
  const halfD = plot.d / 2
  const list = []
  let n = (plot.number ?? 1) * 31
  for (let x = -halfW + 2.2; x <= halfW - 2.2; x += 4.6) {
    for (let z = -halfD + 2.2; z <= halfD - 2.2; z += 4.6) {
      n += 1
      if (z > b.z + b.d / 2 - 1) continue // front yard stays open
      if (Math.abs(x - b.x) < b.w / 2 + 2.2 && Math.abs(z - b.z) < b.d / 2 + 2.2) continue
      if (!tight && x > 2.8 && x < 8.6) continue // driveway
      if (seeded(n) > 0.55) continue
      list.push({
        x: x + (seeded(n + 7) - 0.5) * 1.6,
        z: z + (seeded(n + 9) - 0.5) * 1.6,
        s: 0.8 + seeded(n + 3) * 0.5,
      })
    }
  }
  return list.slice(0, 18)
}

/** Beyond this distance (m) a yard is drawn as a simple block. */
const FAR = 480

const FAR_COLORS = {
  house: '#efe4cf',
  shop: '#f3e8da',
  apartment: '#e7e5e4',
  school: '#c0745a',
  mall: '#dbe4ea',
  stall: '#f5f0e6',
}

/** A building seen from far away: its outline as one or two boxes. */
function FarBuilding({ owned }) {
  const m = getMaterials()
  const box = buildingBox(owned.kind, owned.design, owned.floors)
  const glassy = owned.kind === 'office' || (owned.kind === 'hotel' && owned.design === 'sky')
  const material = glassy
    ? owned.design === 'dark' || owned.design === 'sky'
      ? m.darkGlass
      : m.glass
    : plainMaterial(owned.kind === 'hotel' && owned.design === 'grand' ? '#a4553b' : (FAR_COLORS[owned.kind] ?? '#efe4cf'))
  const roof = owned.kind === 'house' && owned.design !== 'modern' && owned.design !== 'villa'
  const bodyH = roof ? box.h - 2.6 : box.h
  return (
    <group>
      <mesh position-y={bodyH / 2} material={material} castShadow>
        <boxGeometry args={[box.w, bodyH, box.d]} />
      </mesh>
      {roof && (
        <mesh position-y={bodyH + 1.3} rotation-y={Math.PI / 4} material={plainMaterial('#7b3b2a')} castShadow>
          <coneGeometry args={[box.w * 0.78, 2.6, 4]} />
        </mesh>
      )}
    </group>
  )
}

function OwnedYard({ plot, owned, car, isMine }) {
  const m = getMaterials()
  const lawn = useMemo(() => grassTexture([plot.w / 6, plot.d / 6]), [plot.w, plot.d])
  const concrete = useMemo(() => concreteTexture([1, 3]), [])
  const halfW = plot.w / 2
  const halfD = plot.d / 2
  const box = buildingBox(owned.kind, owned.design, Math.max(1, owned.floors))
  // Narrow plots or wide buildings: building centred, car parked along the front. Otherwise
  // the building stands to the left with a driveway on the right. On deep plots the building
  // stays near the street and the back becomes a garden.
  const narrow = plot.w < 16
  const tight = narrow || box.w > plot.w - 8
  const bx = tight ? 0 : HOUSE_X
  const bz = Math.max(halfD - 14.5, -halfD + box.d / 2 + 0.8)
  const front = bz + box.d / 2
  const carPos = tight ? [plot.w > 22 ? Math.min(halfW - 3, box.w / 2 - 2.5) : 2.7, 0.1, halfD - 2.6] : [5.6, 0.1, halfD - 6]
  const roomy = plot.d > 24 || plot.w > 30
  const bakeKey = `${owned.kind}:${owned.design}:${owned.floors}:${owned.style}:${car?.model}:${car?.color}:${owned.salePrice}:${owned.ownerColor}`
  const trees = useMemo(() => (roomy ? gardenTrees(plot, { x: bx, z: bz, w: box.w, d: box.d }, tight) : []), [roomy, plot, bx, bz, box.w, box.d, tight])

  return (
    <group>
      <mesh position-y={0.08} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[plot.w, plot.d]} />
        <meshStandardMaterial map={lawn} color="#b6d39a" roughness={1} />
      </mesh>
      <Lod distance={FAR}>
        <group>
          <Baked bakeKey={bakeKey}>
            {!tight && (
              <mesh position={[5.6, 0.1, halfD - 7]} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[4.6, 14]} />
                <meshStandardMaterial map={concrete} roughness={0.9} />
              </mesh>
            )}
            {/* stone walkway to the door */}
            <mesh position={[tight ? 0 : bx - 2.6, 0.1, (front + 1.5 + halfD) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[tight ? 2.4 : 1.6, Math.max(0.5, halfD - (front + 1.5))]} />
              <meshStandardMaterial map={concrete} color="#d9cfc0" roughness={0.9} />
            </mesh>
            {/* hedges: sides + back */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (halfW - 0.35), 0.55, -1]} material={m.hedge} castShadow receiveShadow>
                <boxGeometry args={[0.7, 1.1, plot.d - 2]} />
              </mesh>
            ))}
            <mesh position={[0, 0.55, -halfD + 0.35]} material={m.hedge} castShadow receiveShadow>
              <boxGeometry args={[plot.w, 1.1, 0.7]} />
            </mesh>
            {/* mailbox in the owner's color */}
            <group position={[-halfW + 1.4, 0, halfD - 0.8]}>
              <mesh position-y={0.55} material={m.metalDark}>
                <cylinderGeometry args={[0.05, 0.05, 1.1, 6]} />
              </mesh>
              <mesh position-y={1.2} castShadow>
                <boxGeometry args={[0.45, 0.32, 0.6]} />
                <meshStandardMaterial color={owned.ownerColor} roughness={0.4} />
              </mesh>
            </group>
            {!roomy && owned.kind === 'house' && !tight && <YardTree x={-6.5} z={-8.5} s={1.1} />}
            {!roomy && !tight && <YardTree x={6.5} z={-8} s={0.9} />}
            {trees.map((t) => (
              <YardTree key={`${t.x}:${t.z}`} x={t.x} z={t.z} s={t.s} />
            ))}
            <group position={[bx, 0, bz]}>
              <Building kind={owned.kind} design={owned.design} floors={owned.floors} styleId={owned.style} seed={plot.number ?? 0} />
              {owned.builtAt && (
                <group userData={{ live: true }}>
                  <ConstructionSite key={owned.builtAt} box={buildingBox(owned.kind, owned.design, owned.floors)} floors={owned.floors} builtAt={owned.builtAt} />
                </group>
              )}
            </group>
            {car && (
              <group position={carPos} rotation-y={tight ? Math.PI / 2 : 0}>
                <Car model={car.model} color={car.color} />
              </group>
            )}
            {owned.salePrice && <ForSaleSign plot={plot} price={owned.salePrice} resale posts x={tight ? -3 : 0} />}
          </Baked>
        </group>
        {/* far away: just the building's block — a handful of meshes instead of hundreds */}
        <group position={[bx, 0, bz]}>{owned.floors > 0 && <FarBuilding owned={owned} />}</group>
      </Lod>
      <group position={[bx, 0, bz]}>
        <BuildingGlow owned={owned} />
      </group>
      <OwnerTag owned={owned} isMine={isMine} x={bx} z={bz} />
    </group>
  )
}

const PARASOLS = ['#ef4444', '#f59e0b', '#0ea5e9', '#22c55e', '#ec4899']

/** A café table with a parasol and two stools. */
function ParasolTable({ x, z, color }) {
  const m = getMaterials()
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={0.75} material={m.white} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.06, 16]} />
      </mesh>
      <mesh position-y={1.4} material={m.metalDark}>
        <cylinderGeometry args={[0.04, 0.04, 2.8, 6]} />
      </mesh>
      <mesh position-y={2.6} castShadow>
        <coneGeometry args={[1.6, 0.6, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.95, 0.25, 0]} material={m.wood} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.5, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** A park lot: a paved little square with the stall or shop at the back, café tables in
 * front and flower planters at the corners — no fences, it belongs to the park. */
function ParkYard({ plot, owned, isMine }) {
  const stone = useMemo(() => concreteTexture([plot.w / 3, plot.d / 3]), [plot.w, plot.d])
  const halfW = plot.w / 2
  const halfD = plot.d / 2
  const box = buildingBox(owned.kind, owned.design, Math.max(1, owned.floors))
  const bz = Math.min(halfD - box.d / 2 - 3, -halfD + box.d / 2 + 1.5)
  const front = bz + box.d / 2
  const color = PARASOLS[(plot.number ?? 0) % PARASOLS.length]
  const flowers = ['#f43f5e', '#f59e0b', '#a855f7', '#ec4899']
  return (
    <group>
      <mesh position-y={0.08} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[plot.w, plot.d]} />
        <meshStandardMaterial map={stone} color="#e8dfcf" roughness={0.85} />
      </mesh>
      <Baked bakeKey={`${owned.kind}:${owned.design}:${owned.floors}:${owned.salePrice}`}>
        {/* kerb round the square */}
        {[
          [0, halfD - 0.1, plot.w, 0.2],
          [0, -halfD + 0.1, plot.w, 0.2],
          [halfW - 0.1, 0, 0.2, plot.d],
          [-halfW + 0.1, 0, 0.2, plot.d],
        ].map(([x, z, w, d], k) => (
          <mesh key={k} position={[x, 0.14, z]} material={plainMaterial('#bfb6a6')} receiveShadow>
            <boxGeometry args={[w, 0.12, d]} />
          </mesh>
        ))}
        {/* planters at the corners */}
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz], k) => (
          <group key={k} position={[sx * (halfW - 1), 0, sz * (halfD - 1)]}>
            <mesh position-y={0.35} material={plainMaterial('#a8a29e')} castShadow>
              <cylinderGeometry args={[0.6, 0.5, 0.7, 12]} />
            </mesh>
            <mesh position-y={0.85}>
              <sphereGeometry args={[0.55, 10, 8]} />
              <meshStandardMaterial color={flowers[k]} roughness={0.9} />
            </mesh>
          </group>
        ))}
        <group position={[0, 0, bz]}>
          <Building kind={owned.kind} design={owned.design} floors={owned.floors} styleId={owned.style} seed={plot.number ?? 0} />
        </group>
        {owned.floors > 0 && (
          <>
            <ParasolTable x={-halfW / 2} z={(front + halfD) / 2 + 0.6} color={color} />
            <ParasolTable x={halfW / 2} z={(front + halfD) / 2 + 0.6} color={PARASOLS[((plot.number ?? 0) + 2) % PARASOLS.length]} />
          </>
        )}
        {owned.salePrice && <ForSaleSign plot={plot} price={owned.salePrice} resale posts x={-3} />}
      </Baked>
      {owned.builtAt && (
        <group position={[0, 0, bz]}>
          <ConstructionSite key={owned.builtAt} box={buildingBox(owned.kind, owned.design, owned.floors)} floors={owned.floors} builtAt={owned.builtAt} />
        </group>
      )}
      <group position={[0, 0, bz]}>
        <BuildingGlow owned={owned} />
      </group>
      <OwnerTag owned={owned} isMine={isMine} x={0} z={bz} />
    </group>
  )
}

const lotMatrix = new THREE.Matrix4()
const lotQuat = new THREE.Quaternion()
const lotEuler = new THREE.Euler()
const lotPos = new THREE.Vector3()
const lotScale = new THREE.Vector3()

/** The bare ground of every lot for sale, as one instanced mesh (one draw call). Clicking or
 * hovering it selects that lot. */
export function EmptyLotGrounds({ plots, onSelect, onHover }) {
  const mesh = useRef(null)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: dirtTexture([6, 6]), color: '#d8c9b0', roughness: 1 }), [])
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    plots.forEach((p, i) => {
      lotEuler.set(0, p.rotation, 0)
      lotQuat.setFromEuler(lotEuler)
      lotPos.set(p.x, 0.06, p.z)
      lotScale.set(p.w, 1, p.d)
      lotMatrix.compose(lotPos, lotQuat, lotScale)
      m.setMatrixAt(i, lotMatrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [plots])
  if (!plots.length) return null
  return (
    <instancedMesh
      key={plots.length}
      ref={mesh}
      args={[geometry, material, plots.length]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation()
        const p = plots[e.instanceId]
        if (p) onSelect(p.id)
      }}
      onPointerMove={(e) => {
        e.stopPropagation()
        const p = plots[e.instanceId]
        if (p) onHover(p.id)
      }}
      onPointerOut={() => onHover(null)}
    />
  )
}

function EmptyLot({ plot }) {
  const park = plot.row === 'P'
  const dirt = useMemo(() => (park ? concreteTexture([plot.w / 3, plot.d / 3]) : dirtTexture([plot.w / 7, plot.d / 7])), [plot.w, plot.d, park])
  return (
    <group>
      {/* park lots are paved; every other lot's ground is drawn by <EmptyLotGrounds> */}
      {park && (
        <mesh position-y={0.06} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[plot.w, plot.d]} />
          <meshStandardMaterial map={dirt} roughness={1} color="#e8dfcf" />
        </mesh>
      )}
      {/* the sale sign only up close: there are hundreds of lots */}
      <Lod distance={160}>
        <ForSaleSign plot={plot} />
        <group />
      </Lod>
    </group>
  )
}

export const Plot = memo(function Plot({ plot, owned, car, isMine, selected, hovered, onSelect, onHover }) {
  return (
    <group
      position={[plot.x, 0, plot.z]}
      rotation-y={plot.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(plot.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(plot.id)
      }}
      onPointerOut={() => onHover(null)}
    >
      {owned ? plot.row === 'P' ? <ParkYard plot={plot} owned={owned} isMine={isMine} /> : <OwnedYard plot={plot} owned={owned} car={car} isMine={isMine} /> : <EmptyLot plot={plot} />}
      {hovered && !selected && (
        <mesh position-y={0.2} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[plot.w, plot.d]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}
      {selected && <SelectionFrame w={plot.w} d={plot.d} color={isMine ? '#3b82f6' : '#f59e0b'} />}
    </group>
  )
})
