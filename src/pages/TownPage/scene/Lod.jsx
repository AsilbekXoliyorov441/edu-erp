import { Children, useLayoutEffect, useRef } from 'react'

/** Shows its first child within `distance` of the camera and its second child beyond it.
 * A plain three.js LOD: the renderer switches it while drawing, so (unlike drei's
 * <Detailed>) it costs no per-frame callback — which matters with thousands of lots. */
export function Lod({ distance, children }) {
  const [near = null, far = null] = Children.toArray(children)
  const lod = useRef(null)
  const a = useRef(null)
  const b = useRef(null)
  useLayoutEffect(() => {
    const l = lod.current
    if (!l || !a.current || !b.current) return
    l.levels.length = 0
    l.addLevel(a.current, 0)
    l.addLevel(b.current, distance)
  }, [distance])
  return (
    <lOD ref={lod}>
      <group ref={a}>{near}</group>
      <group ref={b}>{far}</group>
    </lOD>
  )
}
