import { Children, isValidElement, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

/** A drop-in for drei's <Instances>/<Instance> for things that never move once placed
 * (lamps, kerbs, trees, markings…). drei turns every <Instance> into a live object that
 * three.js walks through on every frame — tens of thousands of them across the city. Here the
 * <Instance> children are only read for their placement: it all becomes one InstancedMesh
 * whose matrices are written once, so the scene stays small and the picture is the same. */
export function Instance() {
  return null
}

const obj = new THREE.Object3D()
const tint = new THREE.Color()

function place(p) {
  const pos = p.position ?? [0, 0, 0]
  obj.position.set(pos[0], pos[1], pos[2])
  const r = p.rotation ?? [0, 0, 0]
  obj.rotation.set(p['rotation-x'] ?? r[0], p['rotation-y'] ?? r[1], p['rotation-z'] ?? r[2])
  const s = p.scale ?? 1
  if (typeof s === 'number') obj.scale.setScalar(s)
  else obj.scale.set(s[0], s[1], s[2])
  obj.updateMatrix()
  return obj.matrix
}

/** Writes every instance's placement (and colour, when given) into the mesh. */
function fill(mesh, items) {
  items.forEach((p, i) => {
    mesh.setMatrixAt(i, place(p))
    if (p.color !== undefined) mesh.setColorAt(i, tint.set(p.color))
  })
  mesh.count = items.length
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  // a tight bound lets three.js skip the whole set when it is off screen
  mesh.computeBoundingBox()
  mesh.computeBoundingSphere()
}

// eslint-disable-next-line no-unused-vars -- frames / limit are drei's options, not needed here
export function Instances({ children, frames, limit, ...props }) {
  const ref = useRef(null)
  const all = Children.toArray(children)
  const items = all.filter((c) => isValidElement(c) && c.type === Instance).map((c) => c.props)
  const rest = all.filter((c) => !(isValidElement(c) && c.type === Instance))
  const count = Math.max(1, items.length)
  // a stable key for the placements, so they are only rewritten when they change
  const sig = useMemo(() => JSON.stringify(items), [items])
  useLayoutEffect(() => {
    if (ref.current) fill(ref.current, JSON.parse(sig))
  }, [sig, count])
  return (
    <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]} {...props}>
      {rest}
    </instancedMesh>
  )
}
