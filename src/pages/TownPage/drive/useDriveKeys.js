import { useEffect, useState } from 'react'
import { playSound } from '@/shared/lib/sound/gameSounds'
import { driveInput, resetDriveInput } from '@/pages/TownPage/drive/driveState'

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'brake',
}

/** Keyboard controls while driving: WASD / arrows, Space = handbrake, H = horn. */
export function useDriveKeys(active) {
  useEffect(() => {
    if (!active) return undefined
    const down = (e) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'KeyH' && !e.repeat) playSound('horn')
      const key = KEYMAP[e.code]
      if (!key) return
      e.preventDefault()
      driveInput[key] = true
    }
    const up = (e) => {
      const key = KEYMAP[e.code]
      if (key) driveInput[key] = false
    }
    const blur = () => resetDriveInput()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      resetDriveInput()
    }
  }, [active])
}

export function useIsTouch() {
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)
  return touch
}
