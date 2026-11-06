import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/shared/config/town'
import { plainMaterial } from '@/pages/TownPage/scene/materials'
import { driveInput, useDriveHud } from '@/pages/TownPage/drive/driveState'
import { toLocal, useWalk } from '@/pages/TownPage/drive/walkState'
import { Interior } from '@/pages/TownPage/drive/Interior'
import { setCameraNear } from '@/pages/TownPage/scene/warmup'

const WALK = 4.5 // m/s
const RUN = 9
const TURN = 2.4 // rad/s

/** A little person — the player — with arms and legs that swing as they walk.
 * `onPart(name, object)` hands over the pivots that the controller animates. */
function Person({ color, onPart }) {
  const skin = plainMaterial('#e0ac69', { roughness: 0.8 })
  const shirt = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }), [color])
  const pants = plainMaterial('#1f2a44', { roughness: 0.8 })
  const shoes = plainMaterial('#111827', { roughness: 0.6 })
  const hair = plainMaterial('#2a1a10', { roughness: 0.9 })
  return (
    <group
      ref={(el) => onPart('body', el)}
    >
      {/* legs */}
      {[-1, 1].map((s) => (
        <group
          key={`l${s}`}
          position={[s * 0.13, 0.95, 0]}
          ref={(el) => onPart(s < 0 ? 'legL' : 'legR', el)}
        >
          <mesh position-y={-0.45} material={pants} castShadow>
            <boxGeometry args={[0.17, 0.9, 0.2]} />
          </mesh>
          <mesh position={[0, -0.9, 0.05]} material={shoes}>
            <boxGeometry args={[0.18, 0.1, 0.3]} />
          </mesh>
        </group>
      ))}
      {/* torso */}
      <mesh position-y={1.27} material={shirt} castShadow>
        <boxGeometry args={[0.5, 0.64, 0.27]} />
      </mesh>
      {/* arms */}
      {[-1, 1].map((s) => (
        <group
          key={`a${s}`}
          position={[s * 0.32, 1.55, 0]}
          ref={(el) => onPart(s < 0 ? 'armL' : 'armR', el)}
        >
          <mesh position-y={-0.28} material={shirt} castShadow>
            <boxGeometry args={[0.13, 0.58, 0.15]} />
          </mesh>
          <mesh position-y={-0.62} material={skin}>
            <sphereGeometry args={[0.075, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* head */}
      <mesh position-y={1.68} material={skin}>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 10]} />
      </mesh>
      <mesh position-y={1.86} material={skin} castShadow>
        <sphereGeometry args={[0.17, 18, 14]} />
      </mesh>
      <mesh position={[0, 1.93, -0.02]} scale={[1, 0.7, 1]} material={hair}>
        <sphereGeometry args={[0.18, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* eyes, so you can tell which way they face */}
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 1.88, 0.16]} material={hair}>
          <sphereGeometry args={[0.022, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** Walking around the city on foot: arrows / WASD (or the on-screen buttons) to walk and
 * turn, Shift or the run button to run. Buildings are solid; at a building's door you can go
 * in (the HUD asks), walk around each floor, ride the lift between floors and look out of
 * the windows — inside, the camera is the player's own eyes. */
export function WalkController({ spawn, color, buildings }) {
  const root = useRef(null)
  const rig = useRef({})
  const s = useRef({ x: spawn.x, z: spawn.z, h: spawn.heading ?? 0, v: 0, phase: 0, y: 0 })
  const camera = useThree((st) => st.camera)
  const desired = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3(spawn.x, 1.6, spawn.z))
  const lookTarget = useRef(new THREE.Vector3())
  const hudAt = useRef(0)
  // where the player is: outside (null) or { b, floor } — kept in the walk store, which
  // the HUD reads too; insideRef mirrors it for the frame loop
  const insideInfo = useWalk((st) => st.inside)
  const inside = useMemo(() => {
    const b = insideInfo && buildings.find((x) => x.id === insideInfo.id)
    return b ? { b, floor: insideInfo.floor } : null
  }, [insideInfo, buildings])
  const insideRef = useRef(null)
  const setPart = useCallback((name, el) => {
    rig.current[name] = el
  }, [])

  // requests from the HUD (go in, come out, take the lift): the store is an outside system,
  // so they're handled in its subscription — moving the player and updating the store
  useEffect(() => {
    const handle = (request) => {
      if (!request) return
      const c = s.current
      const ins = insideRef.current
      if (request.type === 'enter' && !ins) {
        const b = buildings.find((x) => x.id === request.id)
        if (!b || !b.levels.length) return useWalk.setState({ request: null })
        c.x = b.inside.x
        c.z = b.inside.z
        c.h = b.rot + Math.PI // facing into the building
        c.v = 0
        insideRef.current = { b, floor: 0 }
        useWalk.setState({ request: null, inside: { id: b.id, floor: 0, floors: b.levels.length, kind: b.kind }, door: null })
      } else if (request.type === 'exit' && ins) {
        c.x = ins.b.outside.x
        c.z = ins.b.outside.z
        c.h = ins.b.rot
        c.v = 0
        insideRef.current = null
        useWalk.setState({ request: null, inside: null, nearLift: false })
      } else if (request.type === 'floor' && ins) {
        const { b } = ins
        const floor = THREE.MathUtils.clamp(request.floor, 0, b.levels.length - 1)
        // step out of the lift on the new floor, facing into the room
        c.x = b.lift.x + Math.sin(b.rot) * 1.2
        c.z = b.lift.z + Math.cos(b.rot) * 1.2
        c.h = b.rot
        c.v = 0
        insideRef.current = { b, floor }
        useWalk.setState({ request: null, inside: { id: b.id, floor, floors: b.levels.length, kind: b.kind } })
      } else {
        useWalk.setState({ request: null })
      }
    }
    handle(useWalk.getState().request)
    return useWalk.subscribe((st, prev) => {
      if (st.request && st.request !== prev.request) handle(st.request)
    })
  }, [buildings])

  useEffect(() => {
    insideRef.current = inside
    setCameraNear(camera, inside ? 0.08 : 1)
  }, [inside, camera])
  useEffect(() => () => setCameraNear(camera, 1), [camera])
  useEffect(() => {
    camera.position.set(spawn.x - Math.sin(spawn.heading ?? 0) * 7, 3.5, spawn.z - Math.cos(spawn.heading ?? 0) * 7)
  }, [camera, spawn])
  useEffect(() => () => useWalk.setState({ door: null, inside: null, nearLift: false, request: null }), [])

  /** Is (x, z) free to stand on? Outside: not in any building. Inside: within the room. */
  const free = (x, z) => {
    const ins = insideRef.current
    if (ins) {
      const { lx, lz } = toLocal(ins.b, x, z)
      return Math.abs(lx) < ins.b.w / 2 - 0.55 && Math.abs(lz) < ins.b.d / 2 - 0.55
    }
    if (x < WORLD.minX + 2 || x > WORLD.maxX - 2 || z < WORLD.minZ + 2 || z > WORLD.maxZ - 2) return false
    for (const b of buildings) {
      if (Math.abs(b.x - x) > 40 || Math.abs(b.z - z) > 40) continue
      const { lx, lz } = toLocal(b, x, z)
      if (Math.abs(lx) < b.w / 2 + 0.35 && Math.abs(lz) < b.d / 2 + 0.35) return false
    }
    return true
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const c = s.current
    const i = driveInput
    const ins = insideRef.current

    const run = i.brake || i.run
    const speed = ins ? (run ? 4 : 2.2) : run ? RUN : WALK
    const target = (i.up ? 1 : 0) * speed - (i.down ? 1 : 0) * speed * 0.6
    c.v += (target - c.v) * Math.min(1, dt * 6)
    c.h += ((i.left ? 1 : 0) - (i.right ? 1 : 0)) * TURN * dt
    const nx = c.x + Math.sin(c.h) * c.v * dt
    const nz = c.z + Math.cos(c.h) * c.v * dt
    // slide along walls
    if (free(nx, nz)) {
      c.x = nx
      c.z = nz
    } else if (free(nx, c.z)) c.x = nx
    else if (free(c.x, nz)) c.z = nz
    else c.v = 0

    const level = ins ? ins.b.levels[ins.floor] : null
    c.y = level ? level.y + 0.02 : 0

    // swing arms and legs with the pace
    const pace = Math.abs(c.v)
    c.phase += dt * (2.2 + pace * 1.3) * (pace > 0.2 ? 1 : 0)
    const amp = Math.min(1, pace / WALK) * (run && pace > WALK ? 0.85 : 0.55)
    const swing = Math.sin(c.phase) * amp
    const r = rig.current
    if (r.legL) r.legL.rotation.x = swing
    if (r.legR) r.legR.rotation.x = -swing
    if (r.armL) r.armL.rotation.x = -swing * 0.9
    if (r.armR) r.armR.rotation.x = swing * 0.9
    if (r.body) r.body.position.y = Math.abs(Math.cos(c.phase)) * 0.06 * Math.min(1, pace / WALK)
    if (root.current) {
      root.current.position.set(c.x, c.y + 0.04, c.z)
      root.current.rotation.y = c.h
      // inside, the camera is the player's eyes — don't draw them
      root.current.visible = !ins
    }

    if (ins) {
      // first person: eyes at 1.6 m, looking where the player faces
      state.camera.position.set(c.x, c.y + 1.62, c.z)
      // high up, the eyes look a little down so the city below shows through the windows
      // (most of all when standing right at a window)
      const { lx, lz } = toLocal(ins.b, c.x, c.z)
      const atWindow = Math.min(ins.b.w / 2 - Math.abs(lx), ins.b.d / 2 - Math.abs(lz)) < 1.8
      const tilt = c.y > 8 ? (atWindow ? 2.4 : 0.35) : 0
      lookTarget.current.set(c.x + Math.sin(c.h) * 5, c.y + 1.5 - tilt, c.z + Math.cos(c.h) * 5)
      look.current.copy(lookTarget.current)
      state.camera.lookAt(look.current)
    } else {
      desired.current.set(c.x - Math.sin(c.h) * 7, 3.4, c.z - Math.cos(c.h) * 7)
      state.camera.position.lerp(desired.current, 1 - Math.exp(-dt * 4))
      lookTarget.current.set(c.x + Math.sin(c.h) * 3, 1.5, c.z + Math.cos(c.h) * 3)
      look.current.lerp(lookTarget.current, 1 - Math.exp(-dt * 6))
      state.camera.lookAt(look.current)
    }

    if (state.clock.elapsedTime - hudAt.current > 0.15) {
      hudAt.current = state.clock.elapsedTime
      useDriveHud.setState({ speed: pace * 3.6, x: c.x, z: c.z, heading: c.h, dist: null })
      // what's within reach: a door outside, the door / the lift inside
      let door = null
      let nearLift = false
      if (ins) {
        if (ins.floor === 0 && Math.hypot(ins.b.inside.x - c.x, ins.b.inside.z - c.z) < 1.8) door = ins.b.id
        nearLift = Math.hypot(ins.b.lift.x - c.x, ins.b.lift.z - c.z) < 2.2 && ins.b.levels.length > 1
      } else {
        for (const b of buildings) {
          if (b.levels.length && Math.hypot(b.outside.x - c.x, b.outside.z - c.z) < 2.4) {
            door = b.id
            break
          }
        }
      }
      const cur = useWalk.getState()
      if (cur.door !== door || cur.nearLift !== nearLift) useWalk.setState({ door, nearLift })
    }
  })

  return (
    <>
      <group ref={root}>
        <Person color={color} onPart={setPart} />
      </group>
      {inside && <Interior key={`${inside.b.id}:${inside.floor}`} b={inside.b} floor={inside.floor} />}
    </>
  )
}
