import { create } from 'zustand'

/** Pressed controls — written by keyboard / touch handlers, read every frame by the car.
 * A plain mutable object (not React state) so input never causes re-renders. */
export const driveInput = { up: false, down: false, left: false, right: false, brake: false, run: false }

export function resetDriveInput() {
  for (const k of Object.keys(driveInput)) driveInput[k] = false
}

/** Car telemetry for the HUD, published ~10× a second. */
export const useDriveHud = create(() => ({ speed: 0, x: 0, z: 0, heading: 0, dist: null }))
