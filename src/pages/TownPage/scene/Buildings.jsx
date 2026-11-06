import { useMemo } from 'react'
import * as THREE from 'three'
import { facadeTexture, signTexture, woodTexture } from '@/pages/TownPage/scene/textures'
import { facadeNightTexture } from '@/pages/TownPage/scene/nightTextures'
import { followNight } from '@/pages/TownPage/scene/dayNight'
import { getMaterials, plainMaterial, storefront, uplight, wallMaterial } from '@/pages/TownPage/scene/materials'
import { House } from '@/pages/TownPage/scene/House'
import { useGrow } from '@/pages/TownPage/scene/useGrow'
import { APT_FLOOR_H, HOTEL_FLOOR_H, HOTEL_PODIUM_H, MALL_FLOOR_H, OFFICE_FLOOR_H, SCHOOL_FLOOR_H, SHOP_FLOOR_H } from '@/pages/TownPage/scene/buildingInfo'

/** All buildings face +z (the street) and stand on their footprint center. */

function Sign({ text, bg, fg, position, w = 6, h = 1.1, glow = 0.25 }) {
  const material = useMemo(() => {
    const tex = signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w) })
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex })
    // signs light up at night
    return followNight(mat, 'emissiveIntensity', Math.max(1.4, glow * 2), glow)
  }, [text, bg, fg, w, h, glow])
  return (
    <mesh position={position} material={material}>
      <planeGeometry args={[w, h]} />
    </mesh>
  )
}

/** A facade material whose texture repeats once per window bay row/column. */
function useFacade(kind, design, cols, rows, opts) {
  return useMemo(() => {
    const tex = facadeTexture(kind, design).clone()
    tex.needsUpdate = true
    tex.repeat.set(cols / 4, rows / 4)
    // at night the lit windows (and people in them) glow through the emissive map
    const glow = facadeNightTexture(kind, design).clone()
    glow.needsUpdate = true
    glow.wrapS = THREE.RepeatWrapping
    glow.wrapT = THREE.RepeatWrapping
    glow.repeat.set(cols / 4, rows / 4)
    const mat =
      kind === 'office'
        ? new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.55, roughness: 0.08, clearcoat: 1, envMapIntensity: 1.8, ...opts })
        : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, ...opts })
    mat.emissive = new THREE.Color('#ffffff')
    mat.emissiveMap = glow
    return followNight(mat, 'emissiveIntensity', kind === 'office' ? 0.35 : 0.65, 0)
  }, [kind, design, cols, rows, opts])
}

/* ---------------------------------------------------------------- modern house / villa */

function ModernHouse({ floors, villa }) {
  const ref = useGrow(0, 1)
  const m = getMaterials()
  const W = villa ? 13.5 : 10
  const D = 9
  const H = 3.3
  const white = wallMaterial('#f3f3f0')
  const wood = useMemo(() => {
    const t = woodTexture().clone()
    t.needsUpdate = true
    t.rotation = Math.PI / 2
    return new THREE.MeshStandardMaterial({ map: t, color: '#c08552', roughness: 0.7 })
  }, [])
  const dark = plainMaterial('#2b2f36', { roughness: 0.5, metalness: 0.3 })

  return (
    <group>
      <group ref={ref}>
        {Array.from({ length: floors }, (_, i) => {
          // upper floors cantilever a little — the signature "modern" look
          const shift = i % 2 ? 0.9 : 0
          return (
            <group key={i} position={[shift, 0.3 + i * H, i % 2 ? 0.6 : 0]}>
              <mesh position-y={H / 2} material={white} castShadow receiveShadow>
                <boxGeometry args={[W, H, D]} />
              </mesh>
              {/* wood-clad block */}
              <mesh position={[-W / 2 + 1.6, H / 2, D / 2 + 0.03]} material={wood} castShadow>
                <boxGeometry args={[3.2, H - 0.2, 0.08]} />
              </mesh>
              {/* floor-to-ceiling glass */}
              <mesh position={[1.4, H / 2, D / 2 + 0.04]} material={m.glass}>
                <boxGeometry args={[W - 4.6, H - 0.5, 0.08]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[sd * (W / 2 + 0.04), H / 2, -0.5]} material={m.glass} rotation-y={Math.PI / 2}>
                  <boxGeometry args={[D - 3, 1.4, 0.08]} />
                </mesh>
              ))}
              <mesh position={[0, H / 2, -D / 2 - 0.04]} material={m.glass}>
                <boxGeometry args={[W - 3, 1.4, 0.08]} />
              </mesh>
              <mesh position-y={H} material={dark} castShadow>
                <boxGeometry args={[W + 0.3, 0.18, D + 0.3]} />
              </mesh>
            </group>
          )
        })}
        {/* roof parapet + glass railing terrace */}
        <group position-y={0.3 + floors * H}>
          <mesh position={[floors % 2 ? 0 : 0.9, 0.35, 0]} material={white} castShadow>
            <boxGeometry args={[W * 0.45, 0.7, D * 0.6]} />
          </mesh>
          <mesh position={[0, 0.5, D / 2 - 0.1]} material={m.glass}>
            <boxGeometry args={[W, 1, 0.05]} />
          </mesh>
        </group>
      </group>
      {villa && (
        <group>
          {/* pergola terrace on the side + pool in the back yard */}
          <group position={[-W / 2 - 0.2, 0, 3.6]}>
            {[0, 2.4].map((z) =>
              [0, -2.8].map((x) => (
                <mesh key={`${x}${z}`} position={[x, 1.4, z]} material={wood} castShadow>
                  <boxGeometry args={[0.15, 2.8, 0.15]} />
                </mesh>
              )),
            )}
            {Array.from({ length: 7 }, (_, k) => (
              <mesh key={k} position={[-1.4, 2.85, -0.1 + k * 0.42]} material={wood} castShadow>
                <boxGeometry args={[3.2, 0.1, 0.12]} />
              </mesh>
            ))}
          </group>
          <group position={[0, 0, -D / 2 - 2.3]}>
            <mesh position-y={0.12} material={plainMaterial('#e7e5e4')} receiveShadow>
              <boxGeometry args={[8, 0.24, 3.6]} />
            </mesh>
            <mesh position-y={0.25} rotation-x={-Math.PI / 2} material={m.water}>
              <planeGeometry args={[7, 2.8]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}

/* ---------------------------------------------------------------- shop ---------------- */

const SHOP_LOOK = {
  market: { sign: 'MARKET', signBg: '#15803d', fg: '#ffffff', awning: ['#16a34a', '#f8fafc'], wall: '#f5f0e6' },
  cafe: { sign: 'KAFE', signBg: '#7c2d12', fg: '#fde68a', awning: ['#dc2626', '#fff7ed'], wall: '#f3e8da' },
  flowers: { sign: 'GULLAR', signBg: '#db2777', fg: '#ffffff', awning: ['#f472b6', '#fdf2f8'], wall: '#fdf2f8' },
  tech: { sign: 'GADGET', signBg: '#0f172a', fg: '#22d3ee', awning: ['#111827', '#1f2937'], wall: '#1f2937' },
}

function Awning({ colors, w }) {
  const stripes = 10
  return (
    <group position={[0, SHOP_FLOOR_H - 1.15, 4.5 + 0.9]} rotation-x={0.35}>
      {Array.from({ length: stripes }, (_, k) => (
        <mesh key={k} position={[-w / 2 + (w / stripes) * (k + 0.5), 0, 0]} castShadow>
          <boxGeometry args={[w / stripes, 0.06, 1.9]} />
          <meshStandardMaterial color={colors[k % 2]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Shop({ floors, design }) {
  const ref = useGrow(0, 0.9)
  const m = getMaterials()
  const look = SHOP_LOOK[design] ?? SHOP_LOOK.market
  const W = 12
  const D = 9
  const wall = wallMaterial(look.wall)
  return (
    <group>
      <group ref={ref}>
        {Array.from({ length: floors }, (_, i) => (
          <group key={i} position-y={0.3 + i * SHOP_FLOOR_H}>
            <mesh position-y={SHOP_FLOOR_H / 2} material={wall} castShadow receiveShadow>
              <boxGeometry args={[W, SHOP_FLOOR_H, D]} />
            </mesh>
            {i === 0 ? (
              <>
                <mesh position={[0, 1.4, D / 2 + 0.04]} material={storefront(design === 'tech' ? '#7dd3fc' : '#fff1d0')}>
                  <boxGeometry args={[W - 1.4, 2.6, 0.08]} />
                </mesh>
                <mesh position={[0, 1.4, D / 2 + 0.1]} material={plainMaterial('#d6d3d1', { metalness: 0.6, roughness: 0.3 })}>
                  <boxGeometry args={[1.8, 2.7, 0.05]} />
                </mesh>
              </>
            ) : (
              [-3.5, 0, 3.5].map((x) => (
                <mesh key={x} position={[x, SHOP_FLOOR_H / 2, D / 2 + 0.04]} material={m.glass}>
                  <boxGeometry args={[2.2, 1.6, 0.08]} />
                </mesh>
              ))
            )}
          </group>
        ))}
        <mesh position-y={0.3 + floors * SHOP_FLOOR_H + 0.15} material={plainMaterial('#44403c')} castShadow>
          <boxGeometry args={[W + 0.3, 0.3, D + 0.3]} />
        </mesh>
      </group>
      <Sign text={look.sign} bg={look.signBg} fg={look.fg} position={[0, SHOP_FLOOR_H - 0.25, D / 2 + 0.06]} w={6} h={0.8} glow={design === 'tech' ? 0.9 : 0.3} />
      <Awning colors={look.awning} w={W - 0.6} />
      {/* street-side props */}
      {design === 'market' &&
        [-4, -2.6, 2.6, 4].map((x, k) => (
          <mesh key={x} position={[x, 0.45, D / 2 + 1.7]} castShadow>
            <boxGeometry args={[1.1, 0.6, 0.8]} />
            <meshStandardMaterial color={['#ef4444', '#f59e0b', '#84cc16', '#f97316'][k]} roughness={0.8} />
          </mesh>
        ))}
      {design === 'cafe' &&
        [-3.5, 3.5].map((x) => (
          <group key={x} position={[x, 0, D / 2 + 2.6]}>
            <mesh position-y={0.75} material={m.white} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 0.05, 16]} />
            </mesh>
            <mesh position-y={0.38} material={m.metalDark}>
              <cylinderGeometry args={[0.05, 0.05, 0.75, 6]} />
            </mesh>
          </group>
        ))}
      {design === 'flowers' &&
        [-4.2, -3, 3, 4.2].map((x, k) => (
          <group key={x} position={[x, 0, D / 2 + 1.5]}>
            <mesh position-y={0.25} material={plainMaterial('#9a3412')}>
              <cylinderGeometry args={[0.3, 0.22, 0.5, 10]} />
            </mesh>
            <mesh position-y={0.7} castShadow>
              <sphereGeometry args={[0.42, 10, 8]} />
              <meshStandardMaterial color={['#f472b6', '#f43f5e', '#fbbf24', '#c084fc'][k]} roughness={0.9} />
            </mesh>
          </group>
        ))}
      {design === 'tech' && (
        <mesh position={[0, 0.3 + SHOP_FLOOR_H * floors - 0.1, D / 2 + 0.07]}>
          <boxGeometry args={[W, 0.06, 0.04]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/* ---------------------------------------------------------------- apartment ----------- */

const BALCONY = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c']

function Apartment({ floors, design }) {
  const ref = useGrow(0, 1.1)
  const m = getMaterials()
  const W = 12
  const D = 10
  const H = floors * APT_FLOOR_H
  const facade = useFacade('apartment', design, 6, floors)
  const trim = plainMaterial(design === 'brick' ? '#efe6d8' : '#d6d3d1')
  return (
    <group>
      <group ref={ref}>
        <mesh position-y={0.3} material={plainMaterial('#78716c')} receiveShadow>
          <boxGeometry args={[W + 0.4, 0.6, D + 0.4]} />
        </mesh>
        <mesh position-y={0.6 + H / 2} material={facade} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
        </mesh>
        {/* balconies on the street side */}
        {Array.from({ length: floors - 1 }, (_, i) =>
          [-3.6, 3.6].map((x, k) => (
            <group key={`${i}${x}`} position={[x, 0.6 + (i + 1) * APT_FLOOR_H, D / 2 + 0.6]}>
              <mesh material={trim} castShadow receiveShadow>
                <boxGeometry args={[3.2, 0.15, 1.2]} />
              </mesh>
              <mesh position={[0, 0.5, 0.58]} material={design === 'color' ? plainMaterial(BALCONY[(i + k * 3) % BALCONY.length]) : design === 'white' ? m.glass : trim}>
                <boxGeometry args={[3.2, 0.9, 0.05]} />
              </mesh>
            </group>
          )),
        )}
        {/* roof: parapet, water tank, lift room */}
        <group position-y={0.6 + H}>
          <mesh position-y={0.4} material={trim} castShadow>
            <boxGeometry args={[W + 0.2, 0.8, D + 0.2]} />
          </mesh>
          <mesh position={[2.5, 1.2, -1.5]} material={plainMaterial('#a8a29e')} castShadow>
            <boxGeometry args={[2.5, 1.8, 2.5]} />
          </mesh>
          <mesh position={[-3, 1.3, -2]} material={m.white} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 1.6, 16]} />
          </mesh>
        </group>
      </group>
      {/* entrance canopy */}
      <mesh position={[0, 3, D / 2 + 1]} material={plainMaterial('#44403c')} castShadow>
        <boxGeometry args={[3.4, 0.15, 2]} />
      </mesh>
      <mesh position={[0, 1.3, D / 2 + 0.03]} material={m.darkGlass}>
        <boxGeometry args={[2.2, 2.4, 0.06]} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------- office tower -------- */

function Office({ floors, design }) {
  const ref = useGrow(0, 1.4)
  const m = getMaterials()
  const lobbyH = 5
  // stepped: three tiers that narrow on the way up
  const tiers =
    design === 'stepped'
      ? [
          { f: Math.ceil(floors * 0.5), w: 12 },
          { f: Math.ceil(floors * 0.3), w: 9.5 },
          { f: floors - Math.ceil(floors * 0.5) - Math.ceil(floors * 0.3), w: 7 },
        ].filter((t) => t.f > 0)
      : [{ f: floors, w: 12 }]
  const fin = plainMaterial(design === 'gold' ? '#6b5016' : '#cbd5e1', { metalness: 0.8, roughness: 0.3 })
  const totalH = lobbyH + floors * OFFICE_FLOOR_H
  const topW = tiers[tiers.length - 1].w

  return (
    <group>
      {/* double-height glass lobby + canopy */}
      <mesh position-y={lobbyH / 2} material={m.glass} castShadow receiveShadow>
        <boxGeometry args={[11.4, lobbyH, 11.4]} />
      </mesh>
      <mesh position={[0, lobbyH - 0.4, 6.6]} material={fin} castShadow>
        <boxGeometry args={[7, 0.25, 2.4]} />
      </mesh>
      {/* cool white light washing up the tower from the ground */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[Math.sin((k * Math.PI) / 2) * 6.08, 13, Math.cos((k * Math.PI) / 2) * 6.08]} rotation-y={(k * Math.PI) / 2} material={uplight(design === 'gold' ? '#ffe2a8' : '#d6e8ff', 0.75)}>
          <planeGeometry args={[12, 26]} />
        </mesh>
      ))}
      <group ref={ref} position-y={lobbyH}>
        {tiers.map((t, i) => {
          const y0 = tiers.slice(0, i).reduce((s, x) => s + x.f, 0) * OFFICE_FLOOR_H
          return <Tier key={i} floors={t.f} w={t.w} y0={y0} design={design} fin={fin} />
        })}
      </group>
      {/* crown */}
      <group position-y={totalH}>
        <mesh position-y={0.6} material={fin} castShadow>
          <boxGeometry args={[topW * 0.7, 1.2, topW * 0.7]} />
        </mesh>
        {design === 'gold' ? (
          <mesh position-y={10} material={fin} castShadow>
            <coneGeometry args={[0.6, 18, 12]} />
          </mesh>
        ) : design === 'dark' ? (
          [-1.5, 1.5].map((x) => (
            <mesh key={x} position={[x, 5, 0]} material={m.metalDark}>
              <cylinderGeometry args={[0.12, 0.12, 9, 6]} />
            </mesh>
          ))
        ) : (
          <group position-y={1.25}>
            <mesh rotation-x={-Math.PI / 2}>
              <circleGeometry args={[topW * 0.3, 24]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <Sign text="H" bg="#374151" fg="#facc15" position={[0, 0.02, 0]} w={2} h={2} glow={0.4} />
          </group>
        )}
        <mesh position-y={design === 'gold' ? 19.5 : 2} material={m.taillight}>
          <sphereGeometry args={[0.25, 8, 8]} />
        </mesh>
      </group>
    </group>
  )
}

function Tier({ floors, w, y0, design, fin }) {
  const facade = useFacade('office', design, Math.round(w / 3), floors)
  const h = floors * OFFICE_FLOOR_H
  return (
    <group position-y={y0}>
      <mesh position-y={h / 2} material={facade} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
      </mesh>
      {/* vertical fins on the corners */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], k) => (
        <mesh key={k} position={[(sx * w) / 2, h / 2, (sz * w) / 2]} material={fin} castShadow>
          <boxGeometry args={[0.35, h, 0.35]} />
        </mesh>
      ))}
      {design === 'dark' &&
        [-w / 4, 0, w / 4].map((x) => (
          <mesh key={x} position={[x, h / 2, w / 2 + 0.12]} material={fin}>
            <boxGeometry args={[0.12, h, 0.25]} />
          </mesh>
        ))}
      <mesh position-y={h} material={fin}>
        <boxGeometry args={[w + 0.4, 0.4, w + 0.4]} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------- hotel --------------- */

const HOTEL_LOOK = {
  resort: { facade: ['apartment', 'white'], podium: '#e7e5e4', accent: '#0ea5e9', sign: '#0369a1', fg: '#ffffff' },
  grand: { facade: ['apartment', 'brick'], podium: '#efe6d8', accent: '#b45309', sign: '#7c2d12', fg: '#fde68a' },
  sky: { facade: ['office', 'dark'], podium: '#1f2937', accent: '#a855f7', sign: '#111827', fg: '#f0abfc' },
}

function Hotel({ floors, design }) {
  const look = HOTEL_LOOK[design] ?? HOTEL_LOOK.resort
  const ref = useGrow(0, 1.1)
  const m = getMaterials()
  const W = 16
  const D = 11
  const H = floors * HOTEL_FLOOR_H
  const facade = useFacade(look.facade[0], look.facade[1], 8, floors)
  const podium = wallMaterial(look.podium)
  const accent = plainMaterial(look.accent, { roughness: 0.4, metalness: 0.3 })
  return (
    <group>
      {/* podium: lobby with a glowing glass front, canopy on columns */}
      <mesh position-y={HOTEL_PODIUM_H / 2} material={podium} castShadow receiveShadow>
        <boxGeometry args={[W + 1, HOTEL_PODIUM_H, D + 1]} />
      </mesh>
      <mesh position={[0, 2.1, (D + 1) / 2 + 0.04]} material={storefront('#ffe7b8')}>
        <boxGeometry args={[W - 2, 3.4, 0.08]} />
      </mesh>
      <mesh position={[0, 3.7, D / 2 + 2.4]} material={accent} castShadow>
        <boxGeometry args={[7, 0.3, 3.4]} />
      </mesh>
      {[-3.1, 3.1].map((x) => (
        <mesh key={x} position={[x, 1.85, D / 2 + 3.8]} material={design === 'grand' ? plainMaterial('#d4a537', { metalness: 0.7, roughness: 0.3 }) : m.white} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 3.7, 12]} />
        </mesh>
      ))}
      <Sign text="HOTEL" bg={look.sign} fg={look.fg} position={[0, HOTEL_PODIUM_H - 0.6, (D + 1) / 2 + 0.07]} w={5} h={0.9} glow={0.5} />
      <group ref={ref} position-y={HOTEL_PODIUM_H}>
        <mesh position-y={H / 2} material={facade} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
        </mesh>
        {design === 'sky'
          ? [-W / 2 + 0.1, -W / 4, 0, W / 4, W / 2 - 0.1].map((x) => (
              <mesh key={x} position={[x, H / 2, D / 2 + 0.12]}>
                <boxGeometry args={[0.14, H, 0.2]} />
                <meshStandardMaterial color={look.accent} emissive={look.accent} emissiveIntensity={0.8} toneMapped={false} />
              </mesh>
            ))
          : Array.from({ length: floors }, (_, i) => (
              <group key={i} position={[0, i * HOTEL_FLOOR_H + 0.1, D / 2 + 0.55]}>
                <mesh material={plainMaterial(look.podium)} castShadow receiveShadow>
                  <boxGeometry args={[W - 1, 0.14, 1.1]} />
                </mesh>
                <mesh position={[0, 0.5, 0.52]} material={design === 'resort' ? m.glass : accent}>
                  <boxGeometry args={[W - 1, 0.9, 0.05]} />
                </mesh>
              </group>
            ))}
        {/* roof: parapet, lift room and a big sign that lights up at night */}
        <group position-y={H}>
          <mesh position-y={0.4} material={podium} castShadow>
            <boxGeometry args={[W + 0.2, 0.8, D + 0.2]} />
          </mesh>
          <mesh position={[3, 1.4, -2]} material={plainMaterial('#a8a29e')} castShadow>
            <boxGeometry args={[3, 2, 3]} />
          </mesh>
          <Sign text="HOTEL" bg={look.sign} fg={look.fg} position={[0, 2.1, D / 2 - 0.4]} w={9} h={2.4} glow={design === 'sky' ? 0.9 : 0.4} />
        </group>
      </group>
    </group>
  )
}

/* ---------------------------------------------------------------- learning centre ----- */

const PANEL_COLORS = ['#f59e0b', '#0ea5e9', '#22c55e', '#ef4444', '#8b5cf6']

function School({ floors, design }) {
  const ref = useGrow(0, 1)
  const m = getMaterials()
  const W = 16
  const D = 12
  const H = floors * SCHOOL_FLOOR_H
  const brick = design === 'brick'
  const campus = design === 'campus'
  const wall = wallMaterial(brick ? '#a4553b' : '#f4f4f1')
  const trim = plainMaterial(brick ? '#f3efe6' : '#334155')
  const windowMat = storefront('#fff3c4')
  return (
    <group>
      <group ref={ref}>
        <mesh position-y={0.2} material={plainMaterial('#9ca3af')} receiveShadow>
          <boxGeometry args={[W + 0.6, 0.4, D + 0.6]} />
        </mesh>
        <mesh position-y={0.4 + H / 2} material={campus ? m.glass : wall} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
        </mesh>
        {Array.from({ length: floors }, (_, i) => {
          const y = 0.4 + i * SCHOOL_FLOOR_H
          return (
            <group key={i} position-y={y}>
              {/* floor slab line */}
              <mesh position-y={SCHOOL_FLOOR_H} material={campus ? m.white : trim} castShadow>
                <boxGeometry args={[W + 0.25, 0.22, D + 0.25]} />
              </mesh>
              {brick &&
                [-6, -3, 3, 6].map((x) => (
                  <group key={x} position={[x, SCHOOL_FLOOR_H / 2 + 0.1, D / 2 + 0.04]}>
                    <mesh material={trim}>
                      <boxGeometry args={[2, 2.2, 0.06]} />
                    </mesh>
                    <mesh position-z={0.02} material={windowMat}>
                      <boxGeometry args={[1.7, 1.9, 0.06]} />
                    </mesh>
                  </group>
                ))}
              {design === 'modern' && (
                <>
                  <mesh position={[0, SCHOOL_FLOOR_H / 2 + 0.3, D / 2 + 0.04]} material={windowMat}>
                    <boxGeometry args={[W - 1.2, 1.8, 0.06]} />
                  </mesh>
                  <mesh position={[-W / 2 + 2, SCHOOL_FLOOR_H / 2 + 0.3, D / 2 + 0.08]} material={plainMaterial(PANEL_COLORS[i % PANEL_COLORS.length])}>
                    <boxGeometry args={[2.6, 2.2, 0.08]} />
                  </mesh>
                </>
              )}
            </group>
          )
        })}
        {/* roof */}
        <group position-y={0.4 + H}>
          {campus ? (
            <>
              <mesh position-y={0.25} material={m.hedge} receiveShadow>
                <boxGeometry args={[W - 1, 0.5, D - 1]} />
              </mesh>
              {[
                [-4, -2],
                [3, 2],
                [5, -3],
              ].map(([x, z]) => (
                <mesh key={x} position={[x, 1.4, z]} material={plainMaterial('#4b7d31', { roughness: 0.95 })} castShadow>
                  <icosahedronGeometry args={[1.1, 1]} />
                </mesh>
              ))}
            </>
          ) : (
            <mesh position-y={0.35} material={trim} castShadow>
              <boxGeometry args={[W + 0.3, 0.7, D + 0.3]} />
            </mesh>
          )}
          {brick && (
            // clock tower
            <group position-y={0.7}>
              <mesh position-y={2.5} material={wall} castShadow>
                <boxGeometry args={[3, 5, 3]} />
              </mesh>
              <mesh position={[0, 3.2, 1.52]} rotation-x={0} material={m.white}>
                <circleGeometry args={[1, 24]} />
              </mesh>
              <mesh position={[0, 3.5, 1.54]} material={m.metalDark}>
                <boxGeometry args={[0.08, 0.7, 0.02]} />
              </mesh>
              <mesh position={[0.25, 3.2, 1.54]} rotation-z={-Math.PI / 2} material={m.metalDark}>
                <boxGeometry args={[0.08, 0.5, 0.02]} />
              </mesh>
              <mesh position-y={6} rotation-y={Math.PI / 4} material={plainMaterial('#334155')} castShadow>
                <coneGeometry args={[2.4, 2.2, 4]} />
              </mesh>
            </group>
          )}
        </group>
      </group>
      {/* entrance: columns and a sign; flag on the side */}
      <mesh position={[0, 3.2, D / 2 + 1.4]} material={trim} castShadow>
        <boxGeometry args={[6, 0.35, 2.8]} />
      </mesh>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 1.6, D / 2 + 2.6]} material={m.white} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 3.2, 12]} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, D / 2 + 0.05]} material={m.darkGlass}>
        <boxGeometry args={[2.6, 2.6, 0.06]} />
      </mesh>
      <Sign text="O'QUV MARKAZI" bg={brick ? '#7c2d12' : '#1d4ed8'} fg="#ffffff" position={[0, 3.75, D / 2 + 2.82]} w={5.6} h={0.75} glow={0.4} />
      <group position={[W / 2 + 1.5, 0, D / 2 + 1]}>
        <mesh position-y={4} material={m.metalDark}>
          <cylinderGeometry args={[0.06, 0.08, 8, 8]} />
        </mesh>
        {['#0ea5e9', '#f8fafc', '#16a34a'].map((c, k) => (
          <mesh key={c} position={[0.9, 7.6 - k * 0.4, 0]} castShadow>
            <boxGeometry args={[1.7, 0.4, 0.03]} />
            <meshStandardMaterial color={c} roughness={0.8} side={2} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------------------------------------------------------------- shopping mall ------- */

const MALL_LOOK = {
  glass: { wall: '#dbe4ea', sign: '#0369a1', fg: '#ffffff', neon: null },
  stone: { wall: '#efe9df', sign: '#7c2d12', fg: '#fde68a', neon: null },
  neon: { wall: '#111827', sign: '#111827', fg: '#f472b6', neon: ['#f472b6', '#22d3ee'] },
}

function Mall({ floors, design }) {
  const look = MALL_LOOK[design] ?? MALL_LOOK.glass
  const ref = useGrow(0, 1)
  const m = getMaterials()
  const W = 30
  const D = 16
  const H = floors * MALL_FLOOR_H
  const wall = wallMaterial(look.wall)
  return (
    <group>
      <group ref={ref}>
        <mesh position-y={0.3 + H / 2} material={wall} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
        </mesh>
        {Array.from({ length: floors }, (_, i) => (
          <group key={i} position-y={0.3 + i * MALL_FLOOR_H}>
            {i === 0 ? (
              <mesh position={[0, 2, D / 2 + 0.04]} material={storefront(design === 'neon' ? '#f5d0fe' : '#fff1d0')}>
                <boxGeometry args={[W - 2, 3.4, 0.08]} />
              </mesh>
            ) : design === 'stone' ? (
              [-11, -6.5, 6.5, 11].map((x) => (
                <mesh key={x} position={[x, MALL_FLOOR_H / 2, D / 2 + 0.04]} material={m.glass}>
                  <boxGeometry args={[3, 2.6, 0.08]} />
                </mesh>
              ))
            ) : (
              <mesh position={[0, MALL_FLOOR_H / 2, D / 2 + 0.04]} material={design === 'neon' ? m.darkGlass : m.glass}>
                <boxGeometry args={[W - 1, MALL_FLOOR_H - 1.4, 0.08]} />
              </mesh>
            )}
            {look.neon && (
              <mesh position={[0, MALL_FLOOR_H - 0.2, D / 2 + 0.1]}>
                <boxGeometry args={[W, 0.12, 0.06]} />
                <meshStandardMaterial color={look.neon[i % 2]} emissive={look.neon[i % 2]} emissiveIntensity={2} toneMapped={false} />
              </mesh>
            )}
          </group>
        ))}
        {design === 'stone' &&
          [-13.5, -9, 9, 13.5].map((x) => (
            <mesh key={x} position={[x, 0.3 + H / 2, D / 2 + 0.5]} material={m.white} castShadow>
              <cylinderGeometry args={[0.45, 0.5, H, 14]} />
            </mesh>
          ))}
        {/* roof: parapet and air-conditioning units */}
        <group position-y={0.3 + H}>
          <mesh position-y={0.4} material={plainMaterial('#6b7280')} castShadow>
            <boxGeometry args={[W + 0.3, 0.8, D + 0.3]} />
          </mesh>
          {[-10, -6, 7, 11].map((x, k) => (
            <mesh key={x} position={[x, 1.3, k % 2 ? -3 : 2]} material={plainMaterial('#d1d5db', { metalness: 0.4, roughness: 0.5 })} castShadow>
              <boxGeometry args={[2.4, 1.2, 2.4]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* glass atrium in the middle of the front, taller than the rest */}
      <mesh position={[0, 0.3 + (H + 3) / 2, D / 2 - 0.5]} material={m.glass} castShadow>
        <boxGeometry args={[9, H + 3, 3]} />
      </mesh>
      <mesh position={[0, 1.4, D / 2 + 1.05]} material={m.darkGlass}>
        <boxGeometry args={[3.2, 2.8, 0.06]} />
      </mesh>
      <Sign text="SAVDO MARKAZI" bg={look.sign} fg={look.fg} position={[0, 0.3 + H + 1.6, D / 2 + 1.04]} w={8.6} h={1.6} glow={design === 'neon' ? 0.9 : 0.4} />
      <mesh position={[0, 3.9, D / 2 + 2.2]} material={plainMaterial('#374151', { metalness: 0.5, roughness: 0.4 })} castShadow>
        <boxGeometry args={[10, 0.25, 2.4]} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------- stall --------------- */

const STALL_LOOK = {
  icecream: { sign: 'MUZQAYMOQ', bg: '#db2777', fg: '#ffffff', awning: ['#f472b6', '#fdf2f8'], goods: ['#fbcfe8', '#fde68a', '#a7f3d0', '#c4b5fd'] },
  somsa: { sign: 'SOMSA', bg: '#92400e', fg: '#fde68a', awning: ['#b45309', '#fef3c7'], goods: ['#d97706', '#f59e0b', '#b45309', '#fbbf24'] },
  juice: { sign: 'SHARBAT', bg: '#15803d', fg: '#ffffff', awning: ['#22c55e', '#f0fdf4'], goods: ['#f97316', '#ef4444', '#facc15', '#84cc16'] },
  souvenir: { sign: 'SUVENIR', bg: '#1d4ed8', fg: '#fde68a', awning: ['#3b82f6', '#eff6ff'], goods: ['#1e3a8a', '#0f766e', '#be123c', '#a16207'] },
}

/** A small market stall (rasta) in the Uzbek style: a stone platform, carved wooden
 * columns, a turquoise-tiled pyramid roof with a gold finial, a striped awning over the
 * counter, hanging lanterns that glow at night, and goods on display. */
function Stall({ design }) {
  const ref = useGrow(0, 0.7)
  const look = STALL_LOOK[design] ?? STALL_LOOK.icecream
  const W = 6
  const D = 4.5
  const H = 3.1
  const wood = plainMaterial('#7c4a1e', { roughness: 0.6 })
  const carved = plainMaterial('#a16207', { roughness: 0.5 })
  const tile = plainMaterial('#0f9aa8', { roughness: 0.3, metalness: 0.25 })
  const gold = plainMaterial('#d4a537', { metalness: 0.9, roughness: 0.22 })
  const marble = plainMaterial('#ece6da', { roughness: 0.5 })
  const lantern = useMemo(() => followNight(new THREE.MeshStandardMaterial({ color: '#ffe7b0', emissive: '#ffb84d', toneMapped: false }), 'emissiveIntensity', 3.5, 0.15), [])
  return (
    <group ref={ref}>
      {/* stone platform with a step */}
      <mesh position-y={0.18} material={marble} castShadow receiveShadow>
        <boxGeometry args={[W + 1.4, 0.36, D + 1.4]} />
      </mesh>
      <mesh position={[0, 0.09, D / 2 + 1.1]} material={marble} receiveShadow>
        <boxGeometry args={[W * 0.6, 0.18, 0.8]} />
      </mesh>
      <group position-y={0.36}>
        {/* carved columns with capitals */}
        {[
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[(sx * W) / 2, 0, (sz * D) / 2]}>
            <mesh position-y={H / 2} material={wood} castShadow>
              <cylinderGeometry args={[0.13, 0.17, H, 12]} />
            </mesh>
            {[0.6, 1.4, 2.2].map((y) => (
              <mesh key={y} position-y={y} material={carved}>
                <torusGeometry args={[0.16, 0.04, 6, 16]} />
              </mesh>
            ))}
            <mesh position-y={H - 0.15} material={carved} castShadow>
              <boxGeometry args={[0.45, 0.3, 0.45]} />
            </mesh>
          </group>
        ))}
        {/* back wall: wooden panels with a tiled band */}
        <mesh position={[0, H / 2, -D / 2 + 0.1]} material={wood} castShadow>
          <boxGeometry args={[W - 0.3, H, 0.16]} />
        </mesh>
        <mesh position={[0, H - 0.6, -D / 2 + 0.2]} material={tile}>
          <boxGeometry args={[W - 0.5, 0.35, 0.04]} />
        </mesh>
        {/* counter: wood top, tiled and lit front */}
        <mesh position={[0, 0.5, D / 2 - 0.6]} material={wood} castShadow receiveShadow>
          <boxGeometry args={[W - 0.6, 1, 0.8]} />
        </mesh>
        <mesh position={[0, 1.03, D / 2 - 0.6]} material={marble}>
          <boxGeometry args={[W - 0.4, 0.07, 1]} />
        </mesh>
        <mesh position={[0, 0.5, D / 2 - 0.19]} material={tile}>
          <boxGeometry args={[W - 0.8, 0.7, 0.03]} />
        </mesh>
        <mesh position={[0, 0.88, D / 2 - 0.17]} material={storefront('#fff1d0')}>
          <boxGeometry args={[W - 0.8, 0.12, 0.03]} />
        </mesh>
        {/* goods on the counter */}
        {look.goods.map((c, k) => (
          <mesh key={k} position={[-2 + k * 1.3, 1.3, D / 2 - 0.6]} castShadow>
            {design === 'juice' || design === 'souvenir' ? <boxGeometry args={[0.35, 0.5, 0.35]} /> : <sphereGeometry args={[0.28, 10, 8]} />}
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        ))}
        {/* eaves, tiled pyramid roof, finial */}
        <mesh position-y={H + 0.12} material={carved} castShadow>
          <boxGeometry args={[W + 0.9, 0.24, D + 0.9]} />
        </mesh>
        <mesh position-y={H + 1.05} rotation-y={Math.PI / 4} scale={[1, 1, D / W]} material={tile} castShadow>
          <coneGeometry args={[(W + 1.2) / Math.SQRT2, 1.7, 4]} />
        </mesh>
        <mesh position-y={H + 2.05} material={gold}>
          <sphereGeometry args={[0.18, 12, 8]} />
        </mesh>
        <mesh position-y={H + 2.4} material={gold}>
          <cylinderGeometry args={[0.03, 0.05, 0.6, 6]} />
        </mesh>
        {/* striped awning over the counter */}
        <group position={[0, H - 0.35, D / 2 + 0.5]} rotation-x={0.42}>
          {Array.from({ length: 8 }, (_, k) => (
            <mesh key={k} position={[-W / 2 + (W / 8) * (k + 0.5), 0, 0]} castShadow>
              <boxGeometry args={[W / 8, 0.06, 1.4]} />
              <meshStandardMaterial color={look.awning[k % 2]} roughness={0.8} />
            </mesh>
          ))}
        </group>
        {/* hanging lanterns */}
        {[-W / 2 + 0.6, W / 2 - 0.6].map((x) => (
          <group key={x} position={[x, H - 0.55, D / 2 + 0.15]}>
            <mesh position-y={0.3} material={gold}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
            </mesh>
            <mesh material={lantern}>
              <sphereGeometry args={[0.2, 12, 10]} />
            </mesh>
          </group>
        ))}
      </group>
      <Sign text={look.sign} bg={look.bg} fg={look.fg} position={[0, H + 0.36 + 0.75, D / 2 + 0.5]} w={3.8} h={0.75} glow={0.4} />
    </group>
  )
}

/* ---------------------------------------------------------------- dispatcher ---------- */

export function Building({ kind = 'house', design, floors, styleId, seed = 0 }) {
  if (kind === 'office' && floors > 0) return <Office floors={floors} design={design ?? 'glass'} />
  if (kind === 'hotel' && floors > 0) return <Hotel floors={floors} design={design ?? 'resort'} />
  if (kind === 'school' && floors > 0) return <School floors={floors} design={design ?? 'brick'} />
  if (kind === 'mall' && floors > 0) return <Mall floors={floors} design={design ?? 'glass'} />
  if (kind === 'stall' && floors > 0) return <Stall design={design ?? 'icecream'} />
  if (kind === 'apartment' && floors > 0) return <Apartment floors={floors} design={design ?? 'white'} />
  if (kind === 'shop' && floors > 0) return <Shop floors={floors} design={design ?? 'market'} />
  if (kind === 'house' && floors > 0 && (design === 'modern' || design === 'villa')) {
    return <ModernHouse floors={floors} villa={design === 'villa'} />
  }
  return <House floors={floors} styleId={styleId} variant={design === 'cottage' ? 'cottage' : 'classic'} seed={seed} />
}
