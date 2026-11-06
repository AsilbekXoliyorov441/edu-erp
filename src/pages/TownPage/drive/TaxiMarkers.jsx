import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STOP_BY_ID } from '@/shared/config/town'
import { plainMaterial } from '@/pages/TownPage/scene/materials'

const SHIRTS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#0ea5e9', '#ec4899']
const SKIN = ['#f1c9a5', '#d9a77e', '#b97f55', '#8d5a3b']

function hash(str) {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** A waiting passenger on the sidewalk, waving at the taxi. */
function Passenger({ x, z, seed, facing }) {
  const arm = useRef(null)
  const root = useRef(null)
  const shirt = plainMaterial(SHIRTS[seed % SHIRTS.length], { roughness: 0.8 })
  const skin = plainMaterial(SKIN[seed % SKIN.length], { roughness: 0.7 })
  const pants = plainMaterial(seed % 2 ? '#1f2937' : '#1e3a8a', { roughness: 0.9 })
  const hair = plainMaterial(seed % 3 ? '#1c1917' : '#78350f', { roughness: 0.9 })

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (arm.current) arm.current.rotation.z = Math.PI - 0.5 + Math.sin(t * 7) * 0.45
    if (root.current) root.current.position.y = 0.18 + Math.abs(Math.sin(t * 3.5)) * 0.06
  })

  return (
    <group ref={root} position={[x, 0.18, z]} rotation-y={facing}>
      {[-0.14, 0.14].map((lx) => (
        <mesh key={lx} position={[lx, 0.45, 0]} material={pants} castShadow>
          <boxGeometry args={[0.2, 0.9, 0.24]} />
        </mesh>
      ))}
      <mesh position-y={1.25} material={shirt} castShadow>
        <boxGeometry args={[0.6, 0.75, 0.32]} />
      </mesh>
      <mesh position-y={1.85} material={skin} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.98, -0.02]} material={hair}>
        <sphereGeometry args={[0.23, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* resting arm + waving arm */}
      <mesh position={[-0.38, 1.25, 0]} rotation-z={0.08} material={shirt} castShadow>
        <boxGeometry args={[0.16, 0.7, 0.18]} />
      </mesh>
      <group ref={arm} position={[0.36, 1.55, 0]}>
        <mesh position-y={0.35} material={shirt} castShadow>
          <boxGeometry args={[0.16, 0.7, 0.18]} />
        </mesh>
        <mesh position-y={0.75} material={skin}>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
      </group>
      {/* suitcase */}
      <mesh position={[-0.55, 0.35, 0.1]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.45]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** A tall glowing column + pulsing ground ring marking where to go. */
function Beacon({ x, z, color }) {
  const ring = useRef(null)
  const beamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    [color],
  )
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, toneMapped: false }), [color])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring.current) {
      const k = 1 + (t % 1.2) * 0.6
      ring.current.scale.set(k, k, 1)
      ring.current.material.opacity = 0.9 - (t % 1.2) * 0.7
    }
  })
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={20} material={beamMat}>
        <cylinderGeometry args={[2.2, 2.2, 40, 24, 1, true]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.08} material={ringMat}>
        <ringGeometry args={[3.2, 3.8, 40]} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.09}>
        <ringGeometry args={[3.8, 4.1, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function TaxiMarkers({ trip }) {
  if (!trip) return null
  const from = STOP_BY_ID[trip.fromStop]
  const to = STOP_BY_ID[trip.toStop]
  if (!from || !to) return null
  if (trip.status === 'pickup') {
    return (
      <group>
        <Beacon x={from.x} z={from.z} color="#facc15" />
        <Passenger
          x={from.walkX ?? from.x}
          z={from.walkZ}
          seed={hash(trip.id)}
          // face the road: across x for stops on north–south roads, across z otherwise
          facing={from.walkX !== undefined ? (from.walkX > from.x ? -Math.PI / 2 : Math.PI / 2) : from.walkZ > from.z ? Math.PI : 0}
        />
      </group>
    )
  }
  return <Beacon x={to.x} z={to.z} color="#22c55e" />
}
