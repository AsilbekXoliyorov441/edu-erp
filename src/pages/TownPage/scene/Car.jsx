import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { buildCarGeometries } from '@/pages/TownPage/scene/carGeometry'
import { carPaint, getMaterials, plainMaterial } from '@/pages/TownPage/scene/materials'

const BLACK = '#0b0b0c'

/* ------------------------------------------------------------------ wheels ----------- */

const WHEEL_STYLE = {
  sedan: { rim: '#d9dde2', spokes: 10, thick: 0.03, caliper: null },
  executive: { rim: '#e5e7eb', spokes: 10, thick: 0.03, caliper: '#1e3a8a' },
  electric: { rim: '#9aa3ad', spokes: 5, thick: 0.08, caliper: '#0ea5e9' },
  muscle: { rim: '#3f4349', spokes: 5, thick: 0.07, caliper: '#dc2626' },
  supercar: { rim: '#18181b', spokes: 5, thick: 0.08, caliper: '#dc2626' },
  suv: { rim: '#cfd3d8', spokes: 6, thick: 0.06, caliper: null },
  offroad: { rim: '#1c1c1e', spokes: 5, thick: 0.11, caliper: null, tread: true },
}

function Wheel({ geos, x, z, style }) {
  const m = getMaterials()
  const { spec } = geos.shape
  const w = WHEEL_STYLE[style]
  const side = x > 0 ? 1 : -1
  const rim = plainMaterial(w.rim, { metalness: 0.85, roughness: 0.25 })
  const out = geos.tireW / 2
  return (
    <group position={[x, spec.r, z]}>
      <group rotation-z={Math.PI / 2}>
        <mesh geometry={geos.tire} material={m.tire} castShadow />
        <mesh geometry={geos.disc} material={plainMaterial('#5b6168', { metalness: 0.9, roughness: 0.35 })} position-y={-side * (out - 0.07)} />
        {w.caliper && (
          <mesh geometry={geos.caliper} position={[spec.r * 0.3, -side * (out - 0.04), 0.12]}>
            <meshStandardMaterial color={w.caliper} roughness={0.35} metalness={0.3} />
          </mesh>
        )}
        <mesh geometry={geos.rim} material={rim} position-y={-side * (out - 0.02)} />
        {Array.from({ length: w.spokes }, (_, k) => (
          <mesh
            key={k}
            material={rim}
            position-y={-side * (out + 0.01)}
            rotation-y={(k * Math.PI * 2) / w.spokes + (w.spokes === 10 && k % 2 ? 0.12 : 0)}
            rotation-z={Math.PI / 2}
          >
            <boxGeometry args={[w.thick, spec.r * 1.22, 0.05]} />
          </mesh>
        ))}
        <mesh geometry={geos.cap} material={m.chrome} position-y={-side * (out + 0.03)} />
        {w.tread &&
          Array.from({ length: 18 }, (_, k) => {
            const a = (k / 18) * Math.PI * 2
            return (
              <mesh key={k} geometry={geos.tread} material={m.tire} position={[Math.cos(a) * spec.r, 0, Math.sin(a) * spec.r]} rotation-y={-a} />
            )
          })}
      </group>
      <mesh geometry={geos.tireSide} material={m.tire} position-x={side * out} rotation-y={Math.PI / 2} />
    </group>
  )
}

/* ------------------------------------------------------------------ helpers ---------- */

function Box({ p, s, mat, r = [0, 0, 0] }) {
  return (
    <mesh position={p} rotation={r} material={mat}>
      <boxGeometry args={s} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ faces ------------ */

function Front({ shape, style }) {
  const m = getMaterials()
  const black = plainMaterial(BLACK, { roughness: 0.45 })
  const { spec, top, under, halfW } = shape
  const z = spec.L / 2
  const yTop = top(0.985)
  const yBot = under(0.995)
  const hw = halfW(0.97)

  if (style === 'offroad') {
    return (
      <group>
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
          <Box key={k} p={[k * 0.1, yTop - 0.22, z + 0.004]} s={[0.05, 0.3, 0.02]} mat={black} />
        ))}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.56, yTop - 0.2, z + 0.01]} rotation-x={Math.PI / 2}>
            <mesh material={m.chrome}>
              <cylinderGeometry args={[0.13, 0.13, 0.03, 24]} />
            </mesh>
            <mesh position-y={0.012} material={m.headlight}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
            </mesh>
          </group>
        ))}
        <RoundedBox args={[spec.W + 0.06, 0.2, 0.26]} radius={0.04} position={[0, yBot + 0.02, z + 0.06]} material={black} />
        {[-0.62, 0.62].map((x) => (
          <Box key={x} p={[x, yBot + 0.02, z + 0.2]} s={[0.12, 0.08, 0.02]} mat={m.headlight} />
        ))}
      </group>
    )
  }

  if (style === 'suv') {
    return (
      <group>
        <Box p={[0, yTop - 0.24, z + 0.004]} s={[1.05, 0.4, 0.03]} mat={black} />
        {[-0.14, -0.02, 0.1].map((dy) => (
          <Box key={dy} p={[0, yTop - 0.24 + dy, z + 0.02]} s={[1.08, 0.045, 0.03]} mat={m.chrome} />
        ))}
        <Box p={[0, yTop - 0.04, z + 0.01]} s={[1.12, 0.04, 0.03]} mat={m.chrome} />
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Box p={[sd * (hw - 0.2), yTop - 0.17, z + 0.002]} s={[0.36, 0.16, 0.03]} mat={m.darkGlass} />
            <Box p={[sd * (hw - 0.2), yTop - 0.2, z + 0.015]} s={[0.3, 0.035, 0.02]} mat={m.headlight} />
            <Box p={[sd * 0.65, yBot + 0.18, z + 0.004]} s={[0.12, 0.07, 0.02]} mat={m.headlight} />
          </group>
        ))}
        <Box p={[0, yBot + 0.06, z + 0.02]} s={[0.9, 0.08, 0.04]} mat={plainMaterial('#a1a1aa', { metalness: 0.7, roughness: 0.3 })} />
      </group>
    )
  }

  if (style === 'supercar') {
    return (
      <group>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * (hw - 0.36), yTop - 0.02, z - 0.01]}>
            <Box p={[0, 0, 0]} s={[0.44, 0.045, 0.04]} mat={m.darkGlass} r={[0, 0, sd * 0.18]} />
            <Box p={[sd * 0.04, 0, 0.025]} s={[0.36, 0.02, 0.02]} mat={m.headlight} r={[0, 0, sd * 0.18]} />
            <Box p={[sd * -0.1, -0.02, 0.025]} s={[0.16, 0.02, 0.02]} mat={m.headlight} r={[0, 0, -sd * 0.5]} />
          </group>
        ))}
        <Box p={[0, 0.11, z - 0.08]} s={[hw * 2 - 0.15, 0.03, 0.22]} mat={black} />
        {[-1, 1].map((sd) => (
          <Box key={sd} p={[sd * (hw - 0.38), yBot + 0.07, z + 0.003]} s={[0.4, 0.1, 0.02]} mat={black} r={[0, 0, -sd * 0.12]} />
        ))}
      </group>
    )
  }

  if (style === 'electric') {
    return (
      <group>
        <Box p={[0, yTop - 0.06, z + 0.003]} s={[hw * 2 - 0.3, 0.03, 0.02]} mat={m.headlight} />
        <Box p={[0, yBot + 0.1, z + 0.003]} s={[0.7, 0.08, 0.02]} mat={black} />
      </group>
    )
  }

  const lights = [-1, 1].map((sd) => (
    <group key={sd} position={[sd * (hw - 0.27), yTop - 0.1, z + 0.003]}>
      <Box p={[0, 0, 0]} s={[0.42, style === 'muscle' ? 0.07 : 0.1, 0.03]} mat={m.darkGlass} r={[0, 0, sd * 0.1]} />
      <Box p={[0, -0.01, 0.018]} s={[0.36, 0.022, 0.02]} mat={m.headlight} r={[0, 0, sd * 0.1]} />
    </group>
  ))

  if (style === 'muscle') {
    return (
      <group>
        {lights}
        <Box p={[0, yTop - 0.1, z + 0.002]} s={[hw * 2 - 0.95, 0.12, 0.02]} mat={black} />
        <RoundedBox args={[spec.W * 0.72, 0.22, 0.05]} radius={0.03} position={[0, yBot + 0.15, z - 0.005]} material={black} />
        <Box p={[0, 0.2, z - 0.04]} s={[spec.W - 0.3, 0.03, 0.12]} mat={black} />
      </group>
    )
  }

  if (style === 'executive') {
    return (
      <group>
        {lights}
        <group position={[0, yTop - 0.22, z + 0.006]}>
          <Box p={[0, 0, 0]} s={[0.8, 0.34, 0.03]} mat={m.chrome} />
          {[-0.3, -0.18, -0.06, 0.06, 0.18, 0.3].map((x) => (
            <Box key={x} p={[x, 0, 0.02]} s={[0.05, 0.28, 0.02]} mat={black} />
          ))}
        </group>
        <Box p={[0, yBot + 0.1, z + 0.003]} s={[spec.W * 0.55, 0.08, 0.02]} mat={black} />
      </group>
    )
  }

  // sedan: twin grille + wide lower intake
  return (
    <group>
      {lights}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 0.17, yTop - 0.17, z + 0.004]}>
          <RoundedBox args={[0.3, 0.2, 0.03]} radius={0.05} material={m.chrome} />
          <RoundedBox args={[0.25, 0.16, 0.03]} radius={0.04} position-z={0.012} material={black} />
        </group>
      ))}
      <RoundedBox args={[spec.W * 0.62, 0.14, 0.04]} radius={0.03} position={[0, yBot + 0.12, z - 0.004]} material={black} />
    </group>
  )
}

function Rear({ shape, style, paint }) {
  const m = getMaterials()
  const black = plainMaterial(BLACK, { roughness: 0.45 })
  const { spec, top, under, halfW } = shape
  const z = -spec.L / 2
  const yTop = top(0.02)
  const yBot = under(0.01)
  const hw = halfW(0.03)

  return (
    <group>
      {(style === 'electric' || style === 'executive') && (
        <Box p={[0, yTop - 0.13, z - 0.004]} s={[hw * 2 - 0.25, 0.05, 0.02]} mat={m.taillight} />
      )}
      {style === 'supercar' ? (
        <group>
          <Box p={[0, yTop - 0.24, z - 0.004]} s={[hw * 2 - 0.2, 0.3, 0.02]} mat={black} />
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * (hw - 0.3), yTop - 0.1, z - 0.02]}>
              <Box p={[0, 0, 0]} s={[0.4, 0.035, 0.02]} mat={m.taillight} r={[0, 0, sd * 0.25]} />
              <Box p={[sd * 0.05, -0.06, 0]} s={[0.2, 0.035, 0.02]} mat={m.taillight} r={[0, 0, -sd * 0.6]} />
            </group>
          ))}
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[x, yBot + 0.15, z - 0.03]} rotation-x={Math.PI / 2} material={m.chrome}>
              <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
            </mesh>
          ))}
          <Box p={[0, yTop + 0.06, z + 0.3]} s={[spec.W - 0.5, 0.03, 0.28]} mat={black} />
        </group>
      ) : style === 'offroad' ? (
        <group>
          {[-1, 1].map((sd) => (
            <Box key={sd} p={[sd * (hw - 0.12), yBot + 0.32, z - 0.004]} s={[0.12, 0.26, 0.02]} mat={m.taillight} />
          ))}
          <RoundedBox args={[spec.W + 0.04, 0.18, 0.22]} radius={0.04} position={[0, yBot + 0.02, z - 0.05]} material={black} />
          <group position={[0, yBot + 0.55, z - 0.17]} rotation-x={Math.PI / 2}>
            <mesh material={m.tire} castShadow>
              <cylinderGeometry args={[spec.r - 0.02, spec.r - 0.02, 0.3, 28]} />
            </mesh>
            <mesh position-y={-0.16} material={plainMaterial('#1c1c1e', { metalness: 0.6, roughness: 0.4 })}>
              <cylinderGeometry args={[spec.r * 0.6, spec.r * 0.6, 0.03, 24]} />
            </mesh>
          </group>
        </group>
      ) : style === 'suv' ? (
        [-1, 1].map((sd) => (
          <Box key={sd} p={[sd * (hw - 0.1), yTop - 0.25, z - 0.004]} s={[0.16, 0.42, 0.02]} mat={m.taillight} />
        ))
      ) : style === 'electric' || style === 'executive' ? null : (
        [-1, 1].map((sd) => (
          <group key={sd} position={[sd * (hw - 0.27), yTop - 0.13, z - 0.004]}>
            <Box p={[0, 0, 0]} s={[0.42, style === 'muscle' ? 0.11 : 0.09, 0.02]} mat={m.taillight} />
            {style === 'sedan' && <Box p={[sd * 0.15, -0.07, 0]} s={[0.12, 0.08, 0.02]} mat={m.taillight} />}
          </group>
        ))
      )}
      {style === 'muscle' && <Box p={[0, yTop + 0.04, z + 0.12]} s={[spec.W - 0.4, 0.04, 0.16]} mat={paint} r={[-0.2, 0, 0]} />}
      {style !== 'offroad' && style !== 'supercar' && <Box p={[0, yBot + 0.08, z - 0.01]} s={[spec.W * 0.6, 0.1, 0.03]} mat={black} />}
      {style !== 'supercar' && <Box p={[0, yBot + 0.32, z - 0.012]} s={[0.52, 0.11, 0.01]} mat={m.white} />}
    </group>
  )
}

/* ------------------------------------------------------------------ car -------------- */

/** A procedural car, front toward +z. */
export function Car({ model = 'sedan', color = '#1d4ed8' }) {
  const geos = useMemo(() => buildCarGeometries(model), [model])
  const { shape } = geos
  const { spec, top, halfW, tOf, zOf } = shape
  const style = spec.style
  const m = getMaterials()
  const paint = carPaint(color)
  const black = plainMaterial(BLACK, { roughness: 0.5 })
  const roofMat = spec.cabin.roofColor ? plainMaterial(spec.cabin.roofColor, { roughness: 0.6 }) : paint
  const cabinMats = useMemo(() => [roofMat, m.carGlass], [roofMat, m.carGlass])
  const t1 = spec.cabin.t1
  const mirrorZ = zOf(t1) - 0.12
  const mirrorX = halfW(t1) * 0.82 + 0.1
  const doorZs = style === 'supercar' || style === 'muscle' ? [zOf(0.42)] : [zOf(0.38), zOf(0.56)]

  return (
    <group>
      <mesh geometry={geos.body} material={paint} castShadow receiveShadow />
      <mesh geometry={geos.cabin} material={cabinMats} castShadow />

      {/* dark wheel wells so you can't see through the arches */}
      {spec.axle.map((az) => {
        // stays under the hood even where the hood dips between the fenders
        const ta = tOf(az)
        const wellTop = Math.min(spec.r * 2 + 0.05, top(ta) - shape.crown(ta) - 0.06)
        return (
          <mesh key={az} position={[0, (wellTop + 0.12) / 2, az]} material={black}>
            <boxGeometry args={[spec.W - geos.tireW * 2 - 0.12, wellTop - 0.12, spec.r * 2.1]} />
          </mesh>
        )
      })}

      <Front shape={shape} style={style} />
      <Rear shape={shape} style={style} paint={paint} />

      {/* mirrors + door handles */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <RoundedBox args={[0.2, 0.12, 0.1]} radius={0.03} position={[sd * mirrorX, top(t1) + 0.1, mirrorZ]} material={style === 'offroad' ? black : paint} castShadow />
          <Box p={[sd * (mirrorX - 0.1), top(t1) + 0.07, mirrorZ]} s={[0.08, 0.03, 0.04]} mat={black} />
          {doorZs.map((dz) => (
            <Box key={dz} p={[sd * (halfW(tOf(dz)) * 0.99 + 0.004), top(tOf(dz)) - 0.12, dz]} s={[0.02, 0.03, 0.16]} mat={style === 'executive' ? m.chrome : black} />
          ))}
        </group>
      ))}

      {/* style extras */}
      {style === 'muscle' && (
        <>
          <RoundedBox args={[0.7, 0.07, 1.1]} radius={0.03} position={[0, top(0.83) + 0.02, zOf(0.83)]} material={paint} castShadow />
          {[-1, 1].map((sd) => (
            <Box key={sd} p={[sd * 0.17, top(0.86) + 0.065, zOf(0.86)]} s={[0.1, 0.012, 0.6]} mat={black} />
          ))}
        </>
      )}
      {style === 'executive' &&
        [-1, 1].map((sd) => (
          <Box key={sd} p={[sd * (halfW(0.42) * 0.83 + 0.005), top(0.42) - 0.035, zOf(0.42)]} s={[0.02, 0.025, (spec.cabin.t1 - spec.cabin.t0) * spec.L - 0.2]} mat={m.chrome} />
        ))}
      {(style === 'suv' || style === 'offroad') &&
        [-1, 1].map((sd) => (
          <Box
            key={`step${sd}`}
            p={[sd * (halfW(0.5) + 0.06), spec.r * 0.95, (spec.axle[0] + spec.axle[1]) / 2]}
            s={[0.22, 0.05, spec.axle[1] - spec.axle[0] - spec.r * 2.2]}
            mat={black}
          />
        ))}
      {style === 'suv' &&
        [-1, 1].map((sd) => (
          <Box key={`rail${sd}`} p={[sd * (halfW(0.35) * 0.6), shape.roof(0.35) + 0.07, zOf(0.35)]} s={[0.05, 0.05, spec.L * 0.5]} mat={m.metalDark} />
        ))}
      {style === 'offroad' &&
        spec.axle.flatMap((az) =>
          [-1, 1].map((sd) => (
            <mesh key={`${az}${sd}`} position={[sd * (halfW(tOf(az)) + 0.05), spec.r, az]} rotation-y={Math.PI / 2} material={black} castShadow>
              <torusGeometry args={[spec.r + 0.12, 0.08, 6, 18, Math.PI]} />
            </mesh>
          )),
        )}
      {style === 'supercar' &&
        [-1, 1].map((sd) => (
          <Box key={`intake${sd}`} p={[sd * (halfW(0.36) * 0.99), top(0.36) - 0.3, zOf(0.36)]} s={[0.05, 0.32, 0.7]} mat={black} r={[0.25, 0, 0]} />
        ))}

      {/* wheels */}
      {spec.axle.flatMap((az) =>
        [-1, 1].map((sd) => {
          const x = sd * (halfW(tOf(az)) * 0.97 - geos.tireW / 2 + 0.03)
          return <Wheel key={`${az}${sd}`} geos={geos} x={x} z={az} style={style} />
        }),
      )}
    </group>
  )
}
