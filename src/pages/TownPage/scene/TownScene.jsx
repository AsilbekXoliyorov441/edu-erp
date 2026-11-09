import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Environment, Lightformer, PerformanceMonitor, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { PLOT_BY_ID, TOWN_PLOTS } from '@/shared/config/town'
import { Ground, Overpasses, StreetLamps, Streets, TrafficLights } from '@/pages/TownPage/scene/Streets'
import { Surroundings } from '@/pages/TownPage/scene/Nature'
import { EmptyLotGrounds, LotSignPosts, NearSigns, Plot } from '@/pages/TownPage/scene/Plot'
import { PublicPlaces } from '@/pages/TownPage/scene/PublicPlaces'
import { NewUzbekistan } from '@/pages/TownPage/scene/NewUzbekistan'
import { MetroLine } from '@/pages/TownPage/scene/MetroLine'
import { DriveController } from '@/pages/TownPage/drive/DriveController'
import { WalkController } from '@/pages/TownPage/drive/WalkController'
import { walkBuildings } from '@/pages/TownPage/drive/walkState'
import { TaxiMarkers } from '@/pages/TownPage/drive/TaxiMarkers'
import { useDriveHud } from '@/pages/TownPage/drive/driveState'
import { FADE_MS, applyNight, isNightNow, nightState } from '@/pages/TownPage/scene/dayNight'
import { attachLamps, installLampShader } from '@/pages/TownPage/scene/lampShader'
import { setCameraFar, warmUpScene } from '@/pages/TownPage/scene/warmup'
import { setupMapControls } from '@/pages/TownPage/scene/controlsSetup'
import { installFastMatrices } from '@/pages/TownPage/scene/fastMatrices'

installLampShader()
installFastMatrices()

const noop = () => {}
const HOME_VIEW = [120, 170, 330, 0, 0, 10]

const SUN = new THREE.Vector3(240, 320, 180)
const C = (hex) => new THREE.Color(hex)

/** The two looks. Night: dark sky, thick black fog so the far countryside disappears, dim
 * blue moonlight, and the town lit by its own lamps and windows. */
const LOOK = {
  day: {
    sun: 3.1,
    moon: 0,
    hemi: 0.42,
    hemiSky: C('#cfe6ff'),
    hemiGround: C('#5b6b3f'),
    fog: C('#cfe1ee'),
    fogNear: 1200,
    fogFar: 4200,
    env: 1,
    exposure: 1.1,
  },
  night: {
    sun: 0,
    // almost no light from the sky — the town's lamps and windows do the lighting
    moon: 0,
    hemi: 0,
    hemiSky: C('#33416a'),
    hemiGround: C('#0c0b10'),
    fog: C('#000000'),
    // fog only far out — unlit places are dark anyway, and from above the whole town with
    // its lamps and windows stays visible
    fogNear: 900,
    fogFar: 3600,
    env: 0,
    exposure: 1,
  },
}

/** Fixed day and night lighting with a 3 s fade between them. Does no per-frame work at all
 * except during a fade. */
/** Where the camera is looking, on the ground. */
const lookRay = new THREE.Raycaster()
const lookHit = new THREE.Vector3()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const CENTER = new THREE.Vector2(0, 0)

/** The sun's shadow box covers about 700 × 500 m. The world is bigger than that, so the box
 * moves to wherever the camera is looking (checked a few times a second), and the shadows
 * are redrawn once when it does. */
function followShadows(state, sun, center, settle) {
  if (!sun) return
  const now = state.clock.elapsedTime
  if (settle) {
    // redraw only after the camera has stopped, never while it moves
    if (center.cam.distanceToSquared(state.camera.position) > 0.04) {
      center.cam.copy(state.camera.position)
      center.moved = now
      return
    }
    if (now - center.moved < 0.35) return
  }
  if (now - center.t < 0.3) return
  center.t = state.clock.elapsedTime
  lookRay.setFromCamera(CENTER, state.camera)
  if (!lookRay.ray.intersectPlane(groundPlane, lookHit)) return
  const x = THREE.MathUtils.clamp(lookHit.x, -720, 720)
  const z = THREE.MathUtils.clamp(lookHit.z, -400, 1170)
  if (Math.hypot(x - center.x, z - center.z) < 120) return
  center.x = x
  center.z = z
  sun.position.set(x + SUN.x, SUN.y, z + SUN.z)
  sun.target.position.set(x, 0, z)
  sun.target.updateMatrixWorld()
  state.gl.shadowMap.needsUpdate = true
}

function DayNightLights({ quality, settle }) {
  const fogScale = quality === 'low' ? 0.75 : 1
  const shadowCenter = useRef({ x: 0, z: 0, t: 0, moved: 0, cam: new THREE.Vector3() })
  const sun = useRef(null)
  const moon = useRef(null)
  const hemi = useRef(null)
  const sky = useRef(null)
  const night = useRef(null) // current blend 0..1 (null = not applied yet)

  useFrame((state, dt) => {
    const target = isNightNow() ? 1 : 0
    const from = night.current ?? target // first frame: jump straight to the right look
    const step = (dt * 1000) / FADE_MS
    const n = from < target ? Math.min(target, from + step) : Math.max(target, from - step)
    const changed = n !== night.current
    night.current = n

    const { scene, gl } = state
    followShadows(state, sun.current, shadowCenter.current, settle)
    const D = LOOK.day
    const N = LOOK.night
    const mix = (a, b) => a + (b - a) * n
    // Re-asserted every frame (a handful of assignments): drei's <Environment> and the
    // canvas reset environment intensity / exposure whenever the scene re-renders, which
    // used to flip the night back to daylight.
    scene.environmentIntensity = mix(D.env, N.env)
    gl.toneMappingExposure = mix(D.exposure, N.exposure)
    if (sun.current) sun.current.intensity = mix(D.sun, N.sun)
    if (moon.current) moon.current.intensity = mix(D.moon, N.moon)
    if (hemi.current) hemi.current.intensity = mix(D.hemi, N.hemi)
    if (!changed) return

    if (sun.current) sun.current.intensity = mix(D.sun, N.sun)
    if (moon.current) moon.current.intensity = mix(D.moon, N.moon)
    if (hemi.current) {
      hemi.current.intensity = mix(D.hemi, N.hemi)
      hemi.current.color.copy(D.hemiSky).lerp(N.hemiSky, n)
      hemi.current.groundColor.copy(D.hemiGround).lerp(N.hemiGround, n)
    }
    if (sky.current) sky.current.visible = n < 0.6
    if (scene.fog) {
      scene.fog.color.copy(D.fog).lerp(N.fog, n)
      scene.fog.near = mix(D.fogNear, N.fogNear) * fogScale
      scene.fog.far = mix(D.fogFar, N.fogFar) * fogScale
    }
    if (scene.background?.isColor) scene.background.copy(D.fog).lerp(N.fog, n)
    scene.environmentIntensity = mix(D.env, N.env)
    gl.toneMappingExposure = mix(D.exposure, N.exposure)
    applyNight(n)
  })

  return (
    <>
      <Sky ref={sky} distance={4800} sunPosition={SUN} turbidity={6} rayleigh={1.4} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <hemisphereLight ref={hemi} args={['#cfe6ff', '#5b6b3f', 0.42]} />
      <directionalLight ref={moon} position={[-120, 140, -60]} intensity={0} color="#9fb6ff" />
      <directionalLight
        ref={sun}
        position={SUN}
        intensity={3.1}
        color="#fff3df"
        castShadow={false}
        shadow-mapSize={quality === 'high' ? [4096, 4096] : [2048, 2048]}
        shadow-camera-left={-360}
        shadow-camera-right={360}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-camera-near={10}
        shadow-camera-far={1100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {/* Soft studio-style light shapes: give glass and car paint something to reflect without
          downloading an HDRI. Dimmed at night through scene.environmentIntensity. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[0, 30, -40]} scale={[120, 30, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ffe2b8" position={[60, 20, 40]} rotation-y={-Math.PI / 3} scale={[60, 20, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#bcd7ff" position={[-60, 20, 40]} rotation-y={Math.PI / 3} scale={[60, 20, 1]} />
        <Lightformer form="circle" intensity={3} color="#ffffff" position={[0, 80, 0]} rotation-x={Math.PI / 2} scale={40} />
        <mesh scale={300}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#9cc3e6" side={THREE.BackSide} />
        </mesh>
      </Environment>
    </>
  )
}

/** Feeds the night amount to the street-lamp shader for this canvas only. */
function LampDriver({ enabled }) {
  const scene = useThree((st) => st.scene)
  useEffect(() => attachLamps(scene, () => (enabled ? nightState.night : 0)), [scene, enabled])
  return null
}


/** "Low" quality: at most 30 frames a second (steadier on weak machines) — the canvas only
 * draws when asked, and this asks 30 times a second. */
function FrameCap({ fps }) {
  const invalidate = useThree((st) => st.invalidate)
  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / fps)
    return () => clearInterval(id)
  }, [invalidate, fps])
  return null
}

/** How far the camera sees: shorter on "low" (the fog hides the edge). */
function ViewDistance({ far }) {
  const camera = useThree((st) => st.camera)
  useEffect(() => setCameraFar(camera, far), [camera, far])
  return null
}

/** Gets the whole scene ready (textures, shaders, merged buildings) and reports when done. */
function Warmup({ onReady }) {
  const gl = useThree((st) => st.gl)
  const scene = useThree((st) => st.scene)
  const camera = useThree((st) => st.camera)
  const done = useRef(onReady)
  useEffect(() => {
    done.current = onReady
  }, [onReady])
  useEffect(() => warmUpScene(gl, scene, camera, () => done.current?.()), [gl, scene, camera])
  return null
}

/** One finger drags the map, two fingers zoom and turn (see setupMapControls). */
function MapControls({ controls }) {
  useEffect(() => {
    if (controls.current) setupMapControls(controls.current)
  }, [controls])
  return null
}

/** While the camera is being moved, nothing under the mouse is looked up (that search over
 * thousands of lots is what makes panning stutter); it resumes when the camera rests. */
function PauseEventsWhileMoving({ controls }) {
  const setEvents = useThree((st) => st.setEvents)
  useEffect(() => {
    const c = controls.current
    if (!c) return undefined
    // pause only once a drag really moves the camera, so a plain click still picks a lot
    let dragging = false
    let paused = false
    const start = () => {
      dragging = true
    }
    const moved = () => {
      if (dragging && !paused) {
        paused = true
        setEvents({ enabled: false })
      }
    }
    const end = () => {
      dragging = false
      if (paused) {
        paused = false
        setEvents({ enabled: true })
      }
    }
    const events = [
      ['controlstart', start],
      ['update', moved],
      ['controlend', end],
      ['rest', end],
      ['sleep', end],
    ]
    for (const [name, fn] of events) c.addEventListener(name, fn)
    return () => {
      for (const [name, fn] of events) c.removeEventListener(name, fn)
      setEvents({ enabled: true })
    }
  }, [controls, setEvents])
  return null
}

/** Plays the fly-in the first time; after a taxi drive, starts above where the car stopped. */
function Intro({ controls, playedRef }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current || !controls.current) return
    done.current = true
    if (playedRef.current) {
      const { x, z } = useDriveHud.getState()
      controls.current.setLookAt(x + 25, 30, z + 35, x, 0, z, false)
      return
    }
    playedRef.current = true
    controls.current.setLookAt(520, 420, 640, 0, 0, 0, false)
    controls.current.setLookAt(...HOME_VIEW, true)
  })
  return null
}

/** Slow orbit for the "join" screen backdrop. */
function Showcase() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.04
    state.camera.position.set(Math.cos(t) * 360, 190, Math.sin(t) * 360)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

export const TownScene = memo(
  forwardRef(function TownScene(
  { town, selectedId, onSelect, quality = 'medium', showcase = false, drive = null, walk = null, onReady },
  ref,
) {
  const controls = useRef(null)
  const introPlayed = useRef(false)
  // drops the resolution a little while the machine struggles, and back up when it copes
  const [dprScale, setDprScale] = useState(1)
  const meId = town?.me?.id
  const [hoveredId, setHoveredId] = useState(null)

  const players = town?.players
  const plots = town?.plots
  const ownedById = useMemo(() => new Map((plots ?? []).map((p) => [p.plotId, p])), [plots])
  const emptyPlots = useMemo(() => TOWN_PLOTS.filter((p) => !p.public && !ownedById.has(p.id)), [ownedById])
  const groundPlots = useMemo(() => emptyPlots.filter((p) => p.row !== 'P'), [emptyPlots])
  // buildings the walking player bumps into and can go inside
  const walkers = useMemo(() => walkBuildings(plots), [plots])

  // Each player's car parks at their lowest-numbered plot.
  const carByPlot = useMemo(() => {
    const map = new Map()
    for (const player of players ?? []) {
      if (!player.car) continue
      if (drive && player.id === meId) continue // it's on the road right now
      const mine = (plots ?? [])
        .filter((p) => p.ownerId === player.id)
        .map((p) => PLOT_BY_ID[p.plotId])
        .sort((a, b) => a.number - b.number)[0]
      if (mine) map.set(mine.id, player.car)
    }
    return map
  }, [players, plots, drive, meId])

  const flyTo = useCallback((plotId) => {
    const plot = PLOT_BY_ID[plotId]
    if (!plot || !controls.current) return
    // the lot's front direction in the world, and a bit to the side of it
    const fx = Math.sin(plot.rotation)
    const fz = Math.cos(plot.rotation)
    controls.current.setLookAt(plot.x + fx * 42 + fz * 18, 26, plot.z + fz * 42 - fx * 18, plot.x, 3, plot.z, true)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      flyTo,
      home: () => controls.current?.setLookAt(...HOME_VIEW, true),
      // a view over the Yangi O'zbekiston district
      tour: () => controls.current?.setLookAt(170, 230, 380, 0, 10, 620, true),
    }),
    [flyTo],
  )

  const select = useCallback(
    (id) => {
      onSelect?.(id)
      flyTo(id)
    },
    [onSelect, flyTo],
  )

  const handleHover = useCallback((id) => {
    setHoveredId(id)
    document.body.style.cursor = id ? 'pointer' : ''
  }, [])

  return (
    <Canvas
      shadows={false}
      dpr={(quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : quality === 'low' ? 0.85 : Math.min(window.devicePixelRatio || 1, 1.5)) * dprScale}
      frameloop={quality === 'low' ? 'demand' : 'always'}
      camera={{ position: [520, 420, 640], fov: 42, near: 1, far: 6000 }}
      gl={{ antialias: quality !== 'low', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      onPointerMissed={() => onSelect?.(null)}
    >
      <color attach="background" args={['#bcd8ef']} />
      <fog attach="fog" args={['#cfe1ee', 1200, 4200]} />
      <DayNightLights quality={quality} settle={!drive && !walk} />
      <Warmup onReady={onReady} />
      <LampDriver enabled={quality !== 'low'} />
      <PerformanceMonitor
        flipflops={4}
        onDecline={() => setDprScale((v) => Math.max(0.8, Math.round((v - 0.1) * 100) / 100))}
        onIncline={() => setDprScale((v) => Math.min(1, Math.round((v + 0.1) * 100) / 100))}
      />
      {quality === 'low' && <FrameCap fps={30} />}
      <ViewDistance far={quality === 'low' ? 2600 : 6000} />

      <Ground />
      <Streets />
      <Overpasses />
      <MetroLine />
      <StreetLamps />
      <TrafficLights />
      <LotSignPosts plots={emptyPlots} />
      <NearSigns plots={emptyPlots} onSelect={showcase || drive || walk ? noop : select} />
      <EmptyLotGrounds plots={groundPlots} onSelect={showcase || drive || walk ? noop : select} onHover={showcase || drive || walk ? noop : handleHover} />
      <Surroundings sparse={quality === 'low'} />
      <PublicPlaces selectedId={selectedId} onSelect={showcase || drive || walk ? noop : select} />
      <NewUzbekistan />
      {/* an empty lot is drawn by the shared ground / posts / signs above; it only needs its
          own piece while it is pointed at or picked (or when it is a paved park lot) */}
      {TOWN_PLOTS.filter((p) => !p.public && (ownedById.has(p.id) || p.row === 'P' || p.id === selectedId || p.id === hoveredId)).map((plot) => {
        const owned = ownedById.get(plot.id) ?? null
        return (
          <Plot
            key={plot.id}
            plot={plot}
            owned={owned}
            car={carByPlot.get(plot.id) ?? null}
            isMine={!!owned && owned.ownerId === town?.me?.id}
            selected={selectedId === plot.id}
            hovered={hoveredId === plot.id}
            onSelect={showcase || drive || walk ? noop : select}
            onHover={showcase || drive || walk ? noop : handleHover}
          />
        )
      })}

      {walk ? (
        <WalkController spawn={walk.spawn} color={walk.color} buildings={walkers} />
      ) : drive ? (
        <>
          <DriveController car={drive.car} spawn={drive.spawn} target={drive.target} onArrive={drive.onArrive} onRedLight={drive.onRedLight} />
          <TaxiMarkers trip={drive.trip} />
        </>
      ) : showcase ? (
        <Showcase />
      ) : (
        <>
          <CameraControls
            ref={controls}
            makeDefault
            minDistance={18}
            maxDistance={2400}
            minPolarAngle={0.15}
            maxPolarAngle={Math.PI / 2.25}
            dollySpeed={0.6}
            smoothTime={0.6}
          />
          <Intro controls={controls} playedRef={introPlayed} />
          <PauseEventsWhileMoving controls={controls} />
          <MapControls controls={controls} />
        </>
      )}
    </Canvas>
  )
}))
