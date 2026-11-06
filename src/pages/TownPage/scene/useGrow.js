import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** Grows from flat to full height when it mounts — so a freshly built floor "rises". */
export function useGrow(delay = 0, duration = 0.9) {
  const ref = useRef(null)
  const start = useRef(null)
  const done = useRef(false)
  useFrame((state) => {
    // nothing to do once grown (thousands of buildings may be on screen)
    if (done.current || !ref.current) return
    if (start.current === null) start.current = state.clock.elapsedTime + delay
    const t = Math.min(1, Math.max(0, (state.clock.elapsedTime - start.current) / duration))
    // ease-out-back for a little bounce at the end
    const c = 1.4
    const e = t === 0 ? 0.001 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
    ref.current.scale.y = Math.max(0.001, e)
    // lets <Baked> know not to merge this yet
    ref.current.userData.growing = t < 1
    if (t >= 1) {
      ref.current.scale.y = 1
      done.current = true
    }
  })
  return ref
}
