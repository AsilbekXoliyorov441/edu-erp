import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAR_MODELS, INTERSECTIONS, deckHeight, driveLayer, lightState } from '@/shared/config/town'
import { playSound, setEngine, startEngine, stopEngine } from '@/shared/lib/sound/gameSounds'
import { Car } from '@/pages/TownPage/scene/Car'
import { carRoofY } from '@/pages/TownPage/scene/carGeometry'
import { driveInput, useDriveHud } from '@/pages/TownPage/drive/driveState'

const MAX_REVERSE = 7
const BRAKE = 22
const HANDBRAKE = 30
const WHEELBASE = 2.7
const ARRIVE_RADIUS = 6.5
const ARRIVE_SPEED = 4.5

/** The player's own car in taxi mode: arcade physics, roads-only, chase camera.
 * `target` = { x, z, kind, key } — calls `onArrive(kind, key)` once the car stops near it. */
export function DriveController({ car, spawn, target, onArrive, onRedLight }) {
  const group = useRef(null)
  const body = useRef(null)
  // layer: 'ground' or 'bridge' (on an expressway deck / ramp); y = height of the road under the car
  const s = useRef({ x: spawn.x, z: spawn.z, h: spawn.heading, v: 0, steer: 0, layer: 'ground', y: 0 })
  const fired = useRef(null)
  const hudAt = useRef(0)
  const look = useRef(new THREE.Vector3(spawn.x, 1, spawn.z))
  const arriveRef = useRef(onArrive)
  const targetRef = useRef(target)
  const redRef = useRef(onRedLight)
  const inJunction = useRef(null)
  const lastFine = useRef(0)
  const camera = useThree((st) => st.camera)
  const stats = CAR_MODELS.find((c) => c.id === car.model) ?? CAR_MODELS[0]
  const MAX_SPEED = stats.maxSpeed
  const ACCEL = stats.accel

  useEffect(() => {
    arriveRef.current = onArrive
    targetRef.current = target
    redRef.current = onRedLight
  }, [onArrive, target, onRedLight])

  useEffect(() => {
    playSound('engine')
    const id = setTimeout(startEngine, 900)
    camera.position.set(spawn.x - Math.sin(spawn.heading) * 14, 7, spawn.z - Math.cos(spawn.heading) * 14)
    return () => {
      clearTimeout(id)
      stopEngine()
    }
  }, [camera, spawn])

  const desired = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const c = s.current
    const i = driveInput
    const throttle = i.up ? 1 : 0
    const reverse = i.down ? 1 : 0

    if (throttle) c.v += (c.v < 0 ? BRAKE : ACCEL * (1 - (c.v / MAX_SPEED) * 0.6)) * dt
    if (reverse) c.v -= (c.v > 0 ? BRAKE : ACCEL * 0.6) * dt
    if (i.brake) c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), HANDBRAKE * dt)
    if (!throttle && !reverse) c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), (1.8 + Math.abs(c.v) * 0.18) * dt)
    c.v = Math.max(-MAX_REVERSE, Math.min(MAX_SPEED, c.v))

    const steerTarget = (i.left ? 1 : 0) - (i.right ? 1 : 0)
    c.steer += (steerTarget - c.steer) * Math.min(1, dt * 7)
    const maxSteer = 0.6 * (1 - Math.min(0.55, Math.abs(c.v) / 40))
    const drift = i.brake && Math.abs(c.v) > 8 ? 1.6 : 1
    c.h += (c.v / WHEELBASE) * Math.tan(c.steer * maxSteer) * drift * dt

    const nx = c.x + Math.sin(c.h) * c.v * dt
    const nz = c.z + Math.cos(c.h) * c.v * dt
    const both = driveLayer(c.layer, c.z, nx, nz)
    const onlyX = both ? null : driveLayer(c.layer, c.z, nx, c.z)
    const onlyZ = both || onlyX ? null : driveLayer(c.layer, c.z, c.x, nz)
    if (both) {
      c.x = nx
      c.z = nz
      c.layer = both
    } else if (onlyX) {
      c.x = nx
      c.layer = onlyX
      c.v *= 0.92
    } else if (onlyZ) {
      c.z = nz
      c.layer = onlyZ
      c.v *= 0.92
    } else {
      if (Math.abs(c.v) > 5) playSound('bump')
      c.v *= -0.3
    }

    // on a ramp the car rides up the slope, nose tilted with it
    const bridge = c.layer === 'bridge'
    const ty = bridge ? deckHeight(c.z) + 0.05 : 0
    c.y += (ty - c.y) * Math.min(1, dt * 12)
    const ahead = Math.cos(c.h) * 1.4
    const pitch = bridge ? Math.atan2(deckHeight(c.z + ahead) - deckHeight(c.z - ahead), 2.8) : 0
    if (group.current) {
      group.current.position.set(c.x, 0.03 + c.y, c.z)
      group.current.rotation.set(-pitch, c.h, 0, 'YXZ')
    }
    if (body.current) {
      // body roll in corners, pitch under braking/acceleration
      const roll = -c.steer * maxSteer * Math.min(1, Math.abs(c.v) / 18) * 0.07
      body.current.rotation.z += (roll - body.current.rotation.z) * Math.min(1, dt * 6)
      const pitch = (throttle ? -0.015 : 0) + ((reverse && c.v > 0) || i.brake ? 0.03 : 0)
      body.current.rotation.x += (pitch - body.current.rotation.x) * Math.min(1, dt * 6)
    }

    // chase camera
    const back = 13 + Math.abs(c.v) * 0.12
    desired.current.set(c.x - Math.sin(c.h) * back, c.y + 6 + Math.abs(c.v) * 0.04, c.z - Math.cos(c.h) * back)
    state.camera.position.lerp(desired.current, 1 - Math.exp(-dt * 3.5))
    lookTarget.current.set(c.x + Math.sin(c.h) * 7, c.y + 1.6, c.z + Math.cos(c.h) * 7)
    look.current.lerp(lookTarget.current, 1 - Math.exp(-dt * 6))
    state.camera.lookAt(look.current)

    setEngine(Math.abs(c.v) / MAX_SPEED, throttle || reverse)

    // Red light: entering a junction while your direction's light is red.
    const j = bridge ? null : INTERSECTIONS.find((q) => Math.abs(c.x - q.x) < q.hx && Math.abs(c.z - q.z) < q.hz)
    if (j && inJunction.current !== j && Math.abs(c.v) > 2.5) {
      const axis = Math.abs(Math.sin(c.h)) > Math.abs(Math.cos(c.h)) ? 'x' : 'z'
      const now = Date.now()
      if (lightState(axis, now / 1000) === 'red' && now - lastFine.current > 4000) {
        lastFine.current = now
        redRef.current?.()
      }
    }
    inJunction.current = j ?? null

    const t = targetRef.current
    let dist = null
    if (t) {
      dist = Math.hypot(t.x - c.x, t.z - c.z)
      if (dist > ARRIVE_RADIUS + 6) fired.current = null
      if (c.y < 1 && dist < ARRIVE_RADIUS && Math.abs(c.v) < ARRIVE_SPEED && fired.current !== t.key) {
        fired.current = t.key
        arriveRef.current?.(t.kind, t.key)
      }
    }

    if (state.clock.elapsedTime - hudAt.current > 0.1) {
      hudAt.current = state.clock.elapsedTime
      useDriveHud.setState({ speed: Math.abs(c.v) * 3.6, maxKmh: MAX_SPEED * 3.6, x: c.x, z: c.z, heading: c.h, dist })
    }
  })

  return (
    <group ref={group}>
      <group ref={body}>
        <Car model={car.model} color={car.color} />
        {/* yellow taxi roof sign */}
        <mesh position={[0, carRoofY(car.model) + 0.16, -0.3]}>
          <boxGeometry args={[0.9, 0.28, 0.4]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  )
}
