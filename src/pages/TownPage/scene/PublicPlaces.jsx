import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { carpetTexture, concreteTexture, grassTexture, signTexture } from '@/pages/TownPage/scene/textures'
import { getMaterials, plainMaterial, wallMaterial } from '@/pages/TownPage/scene/materials'
import { followNight } from '@/pages/TownPage/scene/dayNight'
import { Trees } from '@/pages/TownPage/scene/Nature'
import { Car } from '@/pages/TownPage/scene/Car'
import { PLOT_BY_ID } from '@/shared/config/town'
import { Baked } from '@/pages/TownPage/scene/Baked'

/** A flat sign board facing +z. */
function Sign({ text, bg, fg, position, width = 6, height = 1.2, sub }) {
  const material = useMemo(() => {
    const tex = signTexture(text, {
      bg,
      fg,
      sub,
      width: 512,
      height: Math.round((512 * height) / width),
    })
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: '#ffffff',
      emissiveMap: tex,
      roughness: 0.5,
    })
    return followNight(mat, 'emissiveIntensity', 1.5, 0.25)
  }, [text, bg, fg, sub, width, height])
  return (
    <mesh position={position} castShadow material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}

/** Wraps a place at its plot position, facing the road, clickable as one unit. */
function Place({ plotId, offsetX = 0, children, onSelect, selected }) {
  const plot = PLOT_BY_ID[plotId]
  // the models are made for 22 m deep lots; on deeper lots they stand near the street
  const front = (plot.d - 22) / 2
  return (
    <group
      position={[plot.x + offsetX, 0, plot.z + (plot.z > 0 ? -front : front)]}
      rotation-y={plot.rotation}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(plotId)
      }}
    >
      <Baked bakeKey={plotId}>{children}</Baked>
      {selected && (
        <mesh position-y={0.25} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[13, 14, 48]} />
          <meshBasicMaterial color="#f59e0b" toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

function Fountain() {
  const m = getMaterials()
  const jet = useRef(null)
  useFrame((state) => {
    if (jet.current) jet.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.12
  })
  return (
    <group>
      <mesh position-y={0.35} material={m.stone} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.7, 40]} />
      </mesh>
      <mesh position-y={0.62} material={m.water}>
        <cylinderGeometry args={[3.85, 3.85, 0.1, 40]} />
      </mesh>
      <mesh position-y={1.4} material={m.stone} castShadow>
        <cylinderGeometry args={[0.35, 0.6, 1.6, 16]} />
      </mesh>
      <mesh position-y={2.25} material={m.stone} castShadow>
        <cylinderGeometry args={[1.6, 1.2, 0.3, 32]} />
      </mesh>
      <mesh ref={jet} position-y={3.4} material={m.water} userData={{ live: true }}>
        <coneGeometry args={[0.35, 2.2, 16]} />
      </mesh>
    </group>
  )
}

function Bench({ position, rotation = 0 }) {
  const m = getMaterials()
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.45} material={m.wood} castShadow>
        <boxGeometry args={[2, 0.08, 0.6]} />
      </mesh>
      <mesh position={[0, 0.8, -0.28]} material={m.wood} castShadow>
        <boxGeometry args={[2, 0.5, 0.06]} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]} material={m.metalDark}>
          <boxGeometry args={[0.08, 0.45, 0.55]} />
        </mesh>
      ))}
    </group>
  )
}

function Park() {
  const lawn = useMemo(() => grassTexture([6, 4]), [])
  const path = useMemo(() => concreteTexture([1, 6]), [])
  const trees = useMemo(
    () => [
      { x: -15, z: -7 },
      { x: -15, z: 6 },
      { x: 15, z: -7 },
      { x: 15, z: 6 },
      { x: -8, z: -8.5, s: 0.8 },
      { x: 8, z: -8.5, s: 0.8 },
    ],
    [],
  )
  const flowers = ['#ef4444', '#f59e0b', '#ec4899', '#a855f7', '#fde047']
  return (
    <group>
      <mesh position-y={0.07} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[38, 22]} />
        <meshStandardMaterial map={lawn} roughness={1} />
      </mesh>
      {[
        [0, 0, 3, 22],
        [0, 0, 38, 3],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.09, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial map={path} color="#e7dccb" roughness={0.9} />
        </mesh>
      ))}
      <Fountain />
      <Bench position={[-6.5, 0, 2.6]} rotation={Math.PI} />
      <Bench position={[6.5, 0, 2.6]} rotation={Math.PI} />
      <Bench position={[-6.5, 0, -2.6]} />
      <Bench position={[6.5, 0, -2.6]} />
      {flowers.map((c, i) => (
        <mesh key={c} position={[-12 + i * 6, 0.25, 8.5]} castShadow>
          <sphereGeometry args={[0.9, 10, 8]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}
      <Trees trees={trees} />
    </group>
  )
}

function Column({ x, z, h, r = 0.45 }) {
  const m = getMaterials()
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={h / 2} material={m.white} castShadow>
        <cylinderGeometry args={[r * 0.85, r, h, 16]} />
      </mesh>
      <mesh position-y={h + 0.15} material={m.white}>
        <boxGeometry args={[r * 2.6, 0.3, r * 2.6]} />
      </mesh>
    </group>
  )
}

function Bank() {
  const m = getMaterials()
  const pediment = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-13.5, 0)
    shape.lineTo(13.5, 0)
    shape.lineTo(0, 2.8)
    shape.closePath()
    return shape
  }, [])
  const wall = wallMaterial('#e8e1d3')
  return (
    <group position-z={-2}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.4, 8.2 - i * 0.7]} material={m.stone} receiveShadow castShadow>
          <boxGeometry args={[24, 0.4, 3 + i * 0.2]} />
        </mesh>
      ))}
      <mesh position={[0, 0.6, 0]} material={m.stone} receiveShadow castShadow>
        <boxGeometry args={[30, 1.2, 14]} />
      </mesh>
      <mesh position={[0, 6, -1]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[28, 9.6, 11]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <Column key={i} x={-10.5 + i * 3} z={6} h={8.4} />
      ))}
      <mesh position={[0, 10.2, 3.2]} material={m.white} castShadow>
        <boxGeometry args={[26, 0.9, 7]} />
      </mesh>
      {/* pediment */}
      <mesh position={[0, 10.65, 5.7]} material={m.white} castShadow>
        <extrudeGeometry args={[pediment, { depth: 1, bevelEnabled: false }]} />
      </mesh>
      <Sign text="ISLOMIY BANK" sub="Foizsiz • Halol moliya" bg="#065f46" fg="#fcd34d" position={[0, 9.6, 6.75]} width={11} height={1.5} />
      {/* gold geometric band under the cornice */}
      <mesh position={[0, 10.75, 6.72]}>
        <boxGeometry args={[26, 0.25, 0.05]} />
        <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* arched tops over the windows and the door */}
      {[-6, 0, 6].map((x) => (
        <mesh key={x} position={[x, x === 0 ? 5.1 : 5.9, 4.51]}>
          <circleGeometry args={[x === 0 ? 1.6 : 1.5, 24, 0, Math.PI]} />
          <meshStandardMaterial color={x === 0 ? '#7a4e2d' : '#22323f'} metalness={x === 0 ? 0 : 0.9} roughness={x === 0 ? 0.7 : 0.05} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 6, 3.4, 4.45]} material={m.darkGlass}>
          <boxGeometry args={[3, 5, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 3, 4.45]} material={m.wood}>
        <boxGeometry args={[3.2, 4.2, 0.12]} />
      </mesh>
    </group>
  )
}

function Topchan({ position }) {
  const m = getMaterials()
  const carpet = useMemo(() => carpetTexture(), [])
  return (
    <group position={position}>
      <mesh position-y={0.55} material={m.wood} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.18, 2.4]} />
      </mesh>
      {[
        [-1.1, -1.1],
        [1.1, -1.1],
        [-1.1, 1.1],
        [1.1, 1.1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]} material={m.wood}>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
        </mesh>
      ))}
      <mesh position-y={0.66} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>
      {/* low table (xontaxta) + teapot */}
      <mesh position-y={0.8} material={m.wood} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
      </mesh>
      <mesh position-y={1.02}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#1e40af" roughness={0.3} />
      </mesh>
    </group>
  )
}

function Choyxona() {
  const m = getMaterials()
  const wall = wallMaterial('#efe2c4')
  return (
    <group position-z={-3}>
      <mesh position={[0, 2.4, -2]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[15, 4.8, 8]} />
      </mesh>
      {/* aivan: wooden porch roof on carved posts */}
      <mesh position={[0, 4.9, 4]} material={m.wood} castShadow receiveShadow>
        <boxGeometry args={[16, 0.35, 8]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-7.5 + i * 3, 2.4, 7.6]} material={m.wood} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 4.8, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 5.3, -2]} castShadow>
        <boxGeometry args={[15.6, 0.8, 8.6]} />
        <meshStandardMaterial color="#0f766e" roughness={0.5} />
      </mesh>
      <Topchan position={[-4.5, 0, 3.5]} />
      <Topchan position={[0, 0, 3.5]} />
      <Topchan position={[4.5, 0, 3.5]} />
      <Sign text="CHOYXONA" sub="Palov • Choy • Somsa" bg="#0f766e" fg="#fef3c7" position={[0, 5.3, 2.32]} width={8} height={1.4} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 4.5, 2.2, 2.05]} material={m.glass}>
          <boxGeometry args={[3, 2.2, 0.1]} />
        </mesh>
      ))}
    </group>
  )
}

function Supermarket() {
  const m = getMaterials()
  const wall = wallMaterial('#e5e7eb')
  return (
    <group position-z={-3}>
      <mesh position={[0, 3.2, -1]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[16, 6.4, 12]} />
      </mesh>
      <mesh position={[0, 2.2, 5.05]} material={m.glass}>
        <boxGeometry args={[14, 4, 0.1]} />
      </mesh>
      <mesh position={[0, 5.3, 5.3]} castShadow>
        <boxGeometry args={[16.4, 1.6, 0.6]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      <Sign text="SUPERMARKET" bg="#dc2626" fg="#ffffff" position={[0, 5.3, 5.62]} width={11} height={1.3} />
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, 0.11, 8.5]} material={m.lineWhite} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.15, 5]} />
        </mesh>
      ))}
      <group position={[-1.5, 0.1, 8.5]} rotation-y={Math.PI}>
        <Car model="suv" color="#e5e7eb" />
      </group>
    </group>
  )
}

function Umbrella({ position, color }) {
  const m = getMaterials()
  return (
    <group position={position}>
      <mesh position-y={0.4} material={m.white} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 16]} />
      </mesh>
      <mesh position-y={1.4} material={m.metalDark}>
        <cylinderGeometry args={[0.04, 0.04, 2.8, 6]} />
      </mesh>
      <mesh position-y={2.7} castShadow>
        <coneGeometry args={[1.6, 0.7, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Restaurant() {
  const m = getMaterials()
  const wall = plainMaterial('#3f2a1f', { roughness: 0.7 })
  return (
    <group position-z={-3}>
      <mesh position={[0, 3.6, -1.5]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[15, 7.2, 10]} />
      </mesh>
      {[1.9, 5.5].map((y) => (
        <mesh key={y} position={[0, y, 3.56]} material={m.glass}>
          <boxGeometry args={[13, 2.4, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 3.7, 4.3]} castShadow>
        <boxGeometry args={[15.4, 0.25, 1.6]} />
        <meshStandardMaterial color="#b45309" roughness={0.5} />
      </mesh>
      <Sign text="RESTORAN" sub="Milliy va Yevropa taomlari" bg="#111827" fg="#fbbf24" position={[0, 7.8, 3.6]} width={8} height={1.4} />
      <Umbrella position={[-4.5, 0, 7]} color="#f8fafc" />
      <Umbrella position={[0, 0, 7.5]} color="#b91c1c" />
      <Umbrella position={[4.5, 0, 7]} color="#f8fafc" />
    </group>
  )
}

function Library() {
  const m = getMaterials()
  const wall = wallMaterial('#c9b79c')
  return (
    <group position-z={-3}>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.4, 5.6 - i * 0.6]} material={m.stone} receiveShadow castShadow>
          <boxGeometry args={[9, 0.4, 2.4]} />
        </mesh>
      ))}
      <mesh position={[0, 3.8, -1]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[15, 7.6, 10]} />
      </mesh>
      {[-3, -1, 1, 3].map((x) => (
        <Column key={x} x={x} z={5} h={6.4} r={0.35} />
      ))}
      <mesh position={[0, 7, 2.8]} material={m.white} castShadow>
        <boxGeometry args={[9, 0.6, 5]} />
      </mesh>
      <Sign text="KUTUBXONA" sub="Bilim — kuch" bg="#1e3a8a" fg="#ffffff" position={[0, 6.4, 4.05]} width={7} height={1.3} />
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 3.5, 4.05]} material={m.glass}>
          <boxGeometry args={[2.2, 4.5, 0.1]} />
        </mesh>
      ))}
    </group>
  )
}

export function PublicPlaces({ selectedId, onSelect }) {
  const sel = (id) => selectedId === id
  return (
    <group>
      <Place plotId="N-C-0-0" onSelect={onSelect} selected={sel('N-C-0-0')}>
        <Park />
      </Place>
      <Place plotId="S-C-0-0" onSelect={onSelect} selected={sel('S-C-0-0')}>
        <Bank />
      </Place>
      <Place plotId="N-B-0-0" onSelect={onSelect} selected={sel('N-B-0-0')}>
        <Choyxona />
      </Place>
      <Place plotId="N-B-0-1" onSelect={onSelect} selected={sel('N-B-0-1')}>
        <Supermarket />
      </Place>
      <Place plotId="S-B-0-0" onSelect={onSelect} selected={sel('S-B-0-0')}>
        <Restaurant />
      </Place>
      <Place plotId="S-B-0-1" onSelect={onSelect} selected={sel('S-B-0-1')}>
        <Library />
      </Place>
    </group>
  )
}
