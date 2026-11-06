import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import { isDrivable } from '@/shared/config/town'
import { signTexture } from '@/pages/TownPage/scene/textures'
import { getMaterials, plainMaterial } from '@/pages/TownPage/scene/materials'
import { followNight } from '@/pages/TownPage/scene/dayNight'
import { Baked } from '@/pages/TownPage/scene/Baked'

/** The elevated metro: a viaduct on pillars standing in the medians of the city ring, all
 * round the city, with eight stations. Two trains run on a fixed timetable taken from the
 * wall clock — so every player sees them in the same place — and stop 5 s at each station.
 *
 * The line is a rounded rectangle over the city ring; positions along it are measured in
 * metres from the middle of its south side, going east. */

import { CARS, CAR_GAP, CAR_LEN, CYCLE, DECK, LINE, STOPS, at, trainS } from '@/pages/TownPage/scene/metroLine'

/* ---------------------------------------------------------------- the viaduct --------- */

function Viaduct() {
  const m = getMaterials()
  const concrete = plainMaterial('#d6d3cd', { roughness: 0.85 })
  const rail = plainMaterial('#9ca3af', { metalness: 0.8, roughness: 0.3 })
  const { segs, pillars } = useMemo(() => {
    const segs = []
    const p = {}
    for (let s = 0; s < LINE.length; s += 6) {
      at(s + 3, p)
      segs.push({ x: p.x, z: p.z, rot: p.heading })
    }
    const pillars = []
    for (let s = 0; s < LINE.length; s += 30) {
      at(s, p)
      // on the median (never on a crossing road)
      if (isDrivable(p.x, p.z, 0)) continue
      pillars.push({ x: p.x, z: p.z, rot: p.heading })
    }
    return { segs, pillars }
  }, [])
  return (
    <group>
      {/* deck (one box per 6 m, turned along the line) */}
      <Instances frames={3} limit={segs.length} material={concrete} castShadow receiveShadow>
        <boxGeometry args={[7, 1.2, 6.3]} />
        {segs.map((g, i) => (
          <Instance key={i} position={[g.x, DECK - 0.6, g.z]} rotation-y={g.rot} />
        ))}
      </Instances>
      {/* parapets */}
      {[-1, 1].map((side) => (
        <Instances key={side} frames={3} limit={segs.length} material={concrete} castShadow>
          <boxGeometry args={[0.3, 1, 6.3]} />
          {segs.map((g, i) => (
            <Instance key={i} position={[g.x + Math.cos(g.rot) * 3.35 * side, DECK + 0.5, g.z - Math.sin(g.rot) * 3.35 * side]} rotation-y={g.rot} />
          ))}
        </Instances>
      ))}
      {/* two tracks (four rails) */}
      {[-2.4, -0.9, 0.9, 2.4].map((off) => (
        <Instances key={off} frames={3} limit={segs.length} material={rail}>
          <boxGeometry args={[0.12, 0.16, 6.3]} />
          {segs.map((g, i) => (
            <Instance key={i} position={[g.x + Math.cos(g.rot) * off, DECK + 0.08, g.z - Math.sin(g.rot) * off]} rotation-y={g.rot} />
          ))}
        </Instances>
      ))}
      {/* pillars with a cap */}
      <Instances frames={3} limit={pillars.length} material={concrete} castShadow>
        <cylinderGeometry args={[0.8, 1, DECK - 1.2, 14]} />
        {pillars.map((g, i) => (
          <Instance key={i} position={[g.x, (DECK - 1.2) / 2, g.z]} />
        ))}
      </Instances>
      <Instances frames={3} limit={pillars.length} material={m.stone} castShadow>
        <boxGeometry args={[6, 0.9, 2.4]} />
        {pillars.map((g, i) => (
          <Instance key={i} position={[g.x, DECK - 1.65, g.z]} rotation-y={g.rot} />
        ))}
      </Instances>
    </group>
  )
}

/* ---------------------------------------------------------------- stations ------------ */

function Station({ st }) {
  const m = getMaterials()
  const p = at(st.s)
  const steel = plainMaterial('#e5e7eb', { metalness: 0.6, roughness: 0.3 })
  const sign = useMemo(() => {
    const tex = signTexture(`M  ${st.name.toUpperCase()}`, { bg: '#0369a1', fg: '#ffffff', width: 1024, height: 128 })
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex })
    return followNight(mat, 'emissiveIntensity', 1.4, 0.25)
  }, [st.name])
  const light = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e0f2fe', toneMapped: false }), 'emissiveIntensity', 2.5, 0), [])
  const L = 64
  return (
    <group position={[p.x, 0, p.z]} rotation-y={p.heading}>
      {/* platforms either side of the tracks */}
      {[-1, 1].map((side) => (
        <group key={side} position-x={side * 5.3}>
          <mesh position-y={DECK - 0.1} material={m.stone} castShadow receiveShadow>
            <boxGeometry args={[3.6, 1, L]} />
          </mesh>
          <mesh position={[side * 1.75, DECK + 1, 0]} material={m.glass}>
            <boxGeometry args={[0.06, 1.6, L]} />
          </mesh>
          {/* columns of the canopy */}
          {[-24, -8, 8, 24].map((z) => (
            <mesh key={z} position={[side * 1.5, DECK + 2.6, z]} material={steel} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 4.6, 8]} />
            </mesh>
          ))}
          <mesh position={[side * 0.4, DECK + 3.6, 0]} rotation-y={side > 0 ? Math.PI / 2 : -Math.PI / 2} material={sign}>
            <planeGeometry args={[18, 1.4]} />
          </mesh>
        </group>
      ))}
      {/* glass canopy over the whole station and its lights */}
      <mesh position-y={DECK + 5} material={m.glass} castShadow>
        <boxGeometry args={[14, 0.25, L + 4]} />
      </mesh>
      <mesh position-y={DECK + 4.82} material={light}>
        <boxGeometry args={[10, 0.06, L]} />
      </mesh>
      {/* lift and stair towers on the median at both ends */}
      {[-1, 1].map((end) => (
        <mesh key={end} position={[0, DECK / 2, end * (L / 2 + 1.5)]} material={steel} castShadow>
          <boxGeometry args={[3, DECK, 3]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------- trains -------------- */

function Train({ offset }) {
  const cars = useRef([])
  const body = plainMaterial('#f8fafc', { metalness: 0.3, roughness: 0.35 })
  const stripe = plainMaterial('#0d9488', { roughness: 0.4 })
  const roof = plainMaterial('#cbd5e1', { metalness: 0.4, roughness: 0.4 })
  const under = plainMaterial('#1f2937', { roughness: 0.7 })
  const windows = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#1e293b', emissive: '#fff4d6', metalness: 0.4, roughness: 0.15 }), 'emissiveIntensity', 1.6, 0), [])
  const front = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.5, roughness: 0.15 }), [])
  const a = useRef({})
  const b = useRef({})
  useFrame(() => {
    const head = trainS(Date.now() / 1000 + offset)
    cars.current.forEach((car, k) => {
      if (!car) return
      // a car sits between its two bogies, so it follows the curves
      const s0 = head - k * (CAR_LEN + CAR_GAP)
      at(s0 - 2, a.current)
      at(s0 - CAR_LEN + 2, b.current)
      car.position.set((a.current.x + b.current.x) / 2, DECK, (a.current.z + b.current.z) / 2)
      car.rotation.y = Math.atan2(a.current.x - b.current.x, a.current.z - b.current.z)
    })
  })
  return Array.from({ length: CARS }, (_, k) => (
    <group
      key={k}
      ref={(el) => {
        cars.current[k] = el
      }}
    >
      {/* track offset: trains keep to the right-hand track */}
      <group position-x={-1.65}>
        <mesh position-y={2.05} material={body} castShadow>
          <boxGeometry args={[3, 3.1, CAR_LEN]} />
        </mesh>
        <mesh position-y={3.65} material={roof}>
          <boxGeometry args={[2.7, 0.2, CAR_LEN - 0.6]} />
        </mesh>
        <mesh position-y={2.55} material={windows}>
          <boxGeometry args={[3.04, 1.1, CAR_LEN - 1.2]} />
        </mesh>
        <mesh position-y={1.3} material={stripe}>
          <boxGeometry args={[3.04, 0.35, CAR_LEN]} />
        </mesh>
        <mesh position-y={0.35} material={under}>
          <boxGeometry args={[2.4, 0.5, CAR_LEN - 2]} />
        </mesh>
        {k === 0 && (
          <mesh position={[0, 2.2, CAR_LEN / 2 + 0.6]} rotation-x={-0.35} material={front}>
            <boxGeometry args={[2.9, 2.4, 1.4]} />
          </mesh>
        )}
        {k === CARS - 1 && (
          <mesh position={[0, 2.2, -CAR_LEN / 2 - 0.6]} rotation-x={0.35} material={front}>
            <boxGeometry args={[2.9, 2.4, 1.4]} />
          </mesh>
        )}
      </group>
    </group>
  ))
}

const TRAINS = 6

export function MetroLine() {
  return (
    <group>
      <Viaduct />
      <Baked bakeKey="metro-stations">
        {STOPS.map((st) => (
          <Station key={st.name} st={st} />
        ))}
      </Baked>
      {/* six trains, evenly spread round the loop on the same timetable */}
      {Array.from({ length: TRAINS }, (_, k) => (
        <Train key={k} offset={(k * CYCLE) / TRAINS} />
      ))}
    </group>
  )
}
