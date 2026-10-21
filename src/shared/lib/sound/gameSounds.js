import { create } from 'zustand'

/** Game sound effects, synthesized with the Web Audio API — no audio files to ship or load.
 * Browsers only allow audio after a user gesture, so the context is created lazily and
 * resumed on the first click/tap anywhere (see `unlockAudio`). */

const MUTE_KEY = 'coin-system:game-muted'

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export const useSoundStore = create((set, get) => ({
  muted: readMuted(),
  toggleMuted() {
    const muted = !get().muted
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      /* noop */
    }
    set({ muted })
  },
}))

let audioCtx = null
/** Set by the first click/keypress — before that, browsers refuse to start audio and warn
 * in the console, so nothing touches the AudioContext until then. */
let unlocked = false

function getCtx() {
  if (typeof window === 'undefined' || !unlocked) return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

/** Call once from a page that plays sounds: the first user gesture unlocks audio. */
export function unlockAudio() {
  const unlock = () => {
    unlocked = true
    getCtx()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  return unlock
}

/** One note: `freq` Hz for `duration` s, starting `delay` s from now, with a short
 * attack/release envelope so it doesn't click. `slideTo` glides the pitch. */
function tone(ctx, { freq, duration = 0.15, delay = 0, type = 'sine', volume = 0.2, slideTo }) {
  const t0 = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

const SOUNDS = {
  /** Someone joined the lobby. */
  join: (ctx) => {
    tone(ctx, { freq: 660, duration: 0.08, type: 'triangle', volume: 0.15 })
    tone(ctx, { freq: 990, duration: 0.12, delay: 0.07, type: 'triangle', volume: 0.15 })
  },
  /** A game just opened for the student's group. */
  notify: (ctx) => {
    ;[880, 1175, 1568].forEach((f, i) => tone(ctx, { freq: f, duration: 0.3, delay: i * 0.12, type: 'sine', volume: 0.16 }))
  },
  /** 3-2-1 lead-in beat. */
  count: (ctx) => tone(ctx, { freq: 520, duration: 0.12, type: 'square', volume: 0.08 }),
  /** Question opens. */
  go: (ctx) => {
    tone(ctx, { freq: 523, duration: 0.1, type: 'square', volume: 0.08 })
    tone(ctx, { freq: 1046, duration: 0.25, delay: 0.09, type: 'square', volume: 0.1 })
  },
  /** Last seconds of the timer. */
  tick: (ctx) => tone(ctx, { freq: 1200, duration: 0.05, type: 'square', volume: 0.06 }),
  /** Player locked in an answer. */
  lock: (ctx) => tone(ctx, { freq: 880, duration: 0.1, type: 'sine', volume: 0.18, slideTo: 1320 }),
  /** Time ran out. */
  timeUp: (ctx) => {
    tone(ctx, { freq: 440, duration: 0.18, type: 'sawtooth', volume: 0.08 })
    tone(ctx, { freq: 330, duration: 0.3, delay: 0.16, type: 'sawtooth', volume: 0.08 })
  },
  /** Answer revealed (host screen). */
  reveal: (ctx) => {
    ;[784, 988, 1175].forEach((f, i) => tone(ctx, { freq: f, duration: 0.18, delay: i * 0.06, type: 'triangle', volume: 0.12 }))
  },
  correct: (ctx) => {
    ;[523, 659, 784, 1046].forEach((f, i) => tone(ctx, { freq: f, duration: 0.2, delay: i * 0.08, type: 'triangle', volume: 0.18 }))
  },
  wrong: (ctx) => {
    tone(ctx, { freq: 311, duration: 0.22, type: 'sawtooth', volume: 0.1 })
    tone(ctx, { freq: 233, duration: 0.4, delay: 0.18, type: 'sawtooth', volume: 0.1 })
  },
  /** Rank went up. */
  climb: (ctx) => tone(ctx, { freq: 600, duration: 0.25, type: 'sine', volume: 0.12, slideTo: 1400 }),
  /** Game over — winners. */
  fanfare: (ctx) => {
    const notes = [523, 523, 523, 659, 784, 659, 784, 1046]
    const times = [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.9, 1.05]
    notes.forEach((f, i) =>
      tone(ctx, { freq: f, duration: i === notes.length - 1 ? 0.7 : 0.16, delay: times[i], type: 'triangle', volume: 0.18 }),
    )
  },
}

export function playSound(name) {
  if (useSoundStore.getState().muted) return
  const ctx = getCtx()
  if (!ctx || ctx.state !== 'running') return
  try {
    SOUNDS[name]?.(ctx)
  } catch {
    /* audio is decorative — never let it break the game */
  }
}
