import { useMemo } from 'react'
import * as THREE from 'three'
import { brickTexture } from '@/pages/TownPage/scene/textures'
import { useGrow } from '@/pages/TownPage/scene/useGrow'
import { HOUSE_STYLES } from '@/shared/config/town'
import { getMaterials, nightPane, plainMaterial, wallMaterial } from '@/pages/TownPage/scene/materials'
import { WINDOW_VARIANTS } from '@/pages/TownPage/scene/nightTextures'

export const HOUSE_W = 10
export const HOUSE_D = 9
export const FLOOR_H = 3.2
const PLINTH = 0.45

/** Which lit room (if any) a window shows at night — stable per house and window. */
function paneVariant(seed, x, y, z) {
  const n = Math.abs(Math.round(seed * 97 + x * 13 + y * 7 + z * 29)) % 100
  if (n < 22) return null // nobody home in this room
  return n % WINDOW_VARIANTS
}

function Window({ x, y, z, w = 1.6, h = 1.6, rotY = 0, trim, seed = 0 }) {
  const m = getMaterials()
  const variant = paneVariant(seed, x, y, z)
  return (
    <group position={[x, y, z]} rotation-y={rotY}>
      <mesh material={trim} castShadow>
        <boxGeometry args={[w + 0.24, h + 0.24, 0.12]} />
      </mesh>
      <mesh position-z={0.04} material={m.glass}>
        <boxGeometry args={[w, h, 0.1]} />
      </mesh>
      {variant !== null && (
        <mesh position-z={0.1} material={nightPane(variant)}>
          <planeGeometry args={[w, h]} />
        </mesh>
      )}
      {/* mullion */}
      <mesh position-z={0.1} material={trim}>
        <boxGeometry args={[0.07, h, 0.04]} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.16, 0.12]} material={trim} castShadow>
        <boxGeometry args={[w + 0.4, 0.08, 0.3]} />
      </mesh>
    </group>
  )
}

function Floor({ index, style, isTop, wallOverride, seed = 0 }) {
  const ref = useGrow(index * 0.15)
  const m = getMaterials()
  const wall = wallOverride ?? wallMaterial(style.wall)
  const trim = plainMaterial(style.trim, { roughness: 0.5 })
  const y0 = PLINTH + index * FLOOR_H
  const midY = FLOOR_H / 2 + 0.2
  const fz = HOUSE_D / 2 + 0.05
  const sx = HOUSE_W / 2 + 0.05

  return (
    <group ref={ref} position-y={y0}>
      <mesh position-y={FLOOR_H / 2} material={wall} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_W, FLOOR_H, HOUSE_D]} />
      </mesh>
      {/* cornice band */}
      <mesh position-y={FLOOR_H - 0.1} material={trim} castShadow>
        <boxGeometry args={[HOUSE_W + 0.25, 0.22, HOUSE_D + 0.25]} />
      </mesh>

      {/* front */}
      {index === 0 ? (
        <>
          <group position={[-2.6, 0, fz]}>
            <mesh position-y={1.2} material={m.wood} castShadow>
              <boxGeometry args={[1.25, 2.4, 0.14]} />
            </mesh>
            <mesh position={[0.4, 1.2, 0.1]} material={m.chrome}>
              <sphereGeometry args={[0.06, 8, 8]} />
            </mesh>
            {/* canopy over the door */}
            <mesh position={[0, 2.7, 0.55]} material={trim} castShadow>
              <boxGeometry args={[2, 0.12, 1.2]} />
            </mesh>
            <mesh position={[0, 3.0, 0.08]} material={m.lamp}>
              <boxGeometry args={[0.25, 0.25, 0.12]} />
            </mesh>
          </group>
          <Window x={1.6} y={midY} z={fz} w={3} h={1.7} trim={trim} seed={seed + index} />
        </>
      ) : (
        <>
          <Window x={-3} y={midY} z={fz} trim={trim} seed={seed + index} />
          <Window x={0} y={midY} z={fz} w={1.2} trim={trim} seed={seed + index} />
          <Window x={3} y={midY} z={fz} trim={trim} seed={seed + index} />
          {index === 1 && (
            <group position={[0, 0.05, fz + 0.7]}>
              <mesh material={trim} castShadow receiveShadow>
                <boxGeometry args={[4.4, 0.18, 1.4]} />
              </mesh>
              <mesh position={[0, 0.55, 0.66]} material={m.glass}>
                <boxGeometry args={[4.4, 0.9, 0.05]} />
              </mesh>
              <mesh position={[0, 1.02, 0.66]} material={m.chrome}>
                <boxGeometry args={[4.45, 0.05, 0.08]} />
              </mesh>
            </group>
          )}
        </>
      )}

      {/* sides and back */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Window x={s * sx} y={midY} z={-1.8} rotY={(s * Math.PI) / 2} trim={trim} seed={seed + index} />
          <Window x={s * sx} y={midY} z={1.8} rotY={(s * Math.PI) / 2} w={1.2} trim={trim} seed={seed + index} />
        </group>
      ))}
      <Window x={-2.5} y={midY} z={-fz} rotY={Math.PI} trim={trim} seed={seed + index} />
      <Window x={2.5} y={midY} z={-fz} rotY={Math.PI} trim={trim} seed={seed + index} />

      {isTop && index > 0 && (
        // AC unit on the side of the top floor
        <mesh position={[sx + 0.3, midY - 1, 0]} material={m.white} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.9]} />
        </mesh>
      )}
    </group>
  )
}

/** Two-sided (gable) roof: an extruded triangle along the house depth. */
function GableRoof({ floors, style }) {
  const ref = useGrow(floors * 0.15 + 0.3, 0.7)
  const roof = plainMaterial(style.roof, { roughness: 0.65 })
  const shape = useMemo(() => {
    const sh = new THREE.Shape()
    const w = (HOUSE_W + 1.2) / 2
    sh.moveTo(-w, 0)
    sh.lineTo(w, 0)
    sh.lineTo(0, 3)
    sh.closePath()
    return sh
  }, [])
  return (
    <group ref={ref} position-y={PLINTH + floors * FLOOR_H}>
      <mesh position-z={-(HOUSE_D + 1.2) / 2} material={roof} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: HOUSE_D + 1.2, bevelEnabled: false }]} />
      </mesh>
      <mesh position={[2.4, 2.2, -1.5]} material={plainMaterial('#7c3a2a')} castShadow>
        <boxGeometry args={[0.7, 2.4, 0.7]} />
      </mesh>
    </group>
  )
}

function Roof({ floors, style }) {
  const ref = useGrow(floors * 0.15 + 0.3, 0.7)
  const roof = plainMaterial(style.roof, { roughness: 0.65 })
  const trim = plainMaterial(style.trim, { roughness: 0.5 })
  const y = PLINTH + floors * FLOOR_H
  return (
    <group ref={ref} position-y={y}>
      <group scale={[(HOUSE_W + 1.2) / Math.SQRT2, 2.6, (HOUSE_D + 1.2) / Math.SQRT2]} position-y={1.3}>
        <mesh rotation-y={Math.PI / 4} material={roof} castShadow receiveShadow>
          <coneGeometry args={[1, 1, 4, 1]} />
        </mesh>
      </group>
      <mesh position={[2.6, 1.9, -1.5]} material={trim} castShadow>
        <boxGeometry args={[0.7, 2, 0.7]} />
      </mesh>
    </group>
  )
}

/** Foundation only (0 floors): concrete slab + a pile of bricks, "under construction". */
function Foundation() {
  const m = getMaterials()
  const brick = plainMaterial('#a5512f', { roughness: 0.9 })
  return (
    <group>
      <mesh position-y={PLINTH / 2} material={m.stone} receiveShadow castShadow>
        <boxGeometry args={[HOUSE_W, PLINTH, HOUSE_D]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-2 + i * 0.1, PLINTH + 0.25 + i * 0.5, 0]} material={brick} castShadow>
          <boxGeometry args={[2.2 - i * 0.5, 0.5, 1.2]} />
        </mesh>
      ))}
      {/* barrier poles */}
      {[
        [-HOUSE_W / 2, HOUSE_D / 2],
        [HOUSE_W / 2, HOUSE_D / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z + 0.6]} material={plainMaterial('#f97316')} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 1, HOUSE_D / 2 + 0.6]} material={plainMaterial('#fbbf24')}>
        <boxGeometry args={[HOUSE_W, 0.12, 0.05]} />
      </mesh>
    </group>
  )
}

export function House({ floors, styleId, variant = 'classic', seed = 0 }) {
  const style = HOUSE_STYLES.find((s) => s.id === styleId) ?? HOUSE_STYLES[0]
  const cottage = variant === 'cottage'
  const brickWall = useMemo(
    () => (cottage ? new THREE.MeshStandardMaterial({ map: brickTexture(), color: '#b85c3e', roughness: 0.9 }) : null),
    [cottage],
  )
  const m = getMaterials()
  if (floors <= 0) return <Foundation />
  return (
    <group>
      <mesh position-y={PLINTH / 2} material={m.stone} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_W + 0.4, PLINTH, HOUSE_D + 0.4]} />
      </mesh>
      {/* front steps */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[-2.6, 0.12 + i * 0.15, HOUSE_D / 2 + 0.9 - i * 0.3]} material={m.stone} receiveShadow castShadow>
          <boxGeometry args={[2, 0.24 + i * 0.06, 0.8]} />
        </mesh>
      ))}
      {Array.from({ length: floors }, (_, i) => (
        <Floor key={i} index={i} style={style} isTop={i === floors - 1} wallOverride={brickWall} seed={seed} />
      ))}
      {cottage ? (
        <GableRoof key={`roof-${floors}`} floors={floors} style={style} />
      ) : (
        <Roof key={`roof-${floors}`} floors={floors} style={style} />
      )}
    </group>
  )
}
