import { CameraControlsImpl } from '@react-three/drei'

/** Map-style camera: on a phone one finger drags the map across the ground (truck moves
 * over the ground plane) and two fingers pinch to zoom and twist to turn; the mouse wheel
 * zooms towards the pointer. */
export function setupMapControls(controls) {
  const A = CameraControlsImpl.ACTION
  controls.touches.one = A.TOUCH_TRUCK
  controls.touches.two = A.TOUCH_DOLLY_ROTATE
  controls.touches.three = A.TOUCH_TRUCK
  controls.dollyToCursor = true
}
