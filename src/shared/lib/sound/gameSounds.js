import { create } from 'zustand'

/** Game audio, synthesized live with the Web Audio API — no files to ship or load.
 *
 * Everything goes through one bus: sounds → (dry + reverb send) → compressor → speakers, so
 * effects sit in the same "room" and loud moments don't clip. Drums, coins, buzzers, crowd
 * applause and the background music loops are all built from oscillators and filtered noise.
 *
 * Browsers only allow audio after a user gesture, so the context is created lazily on the
 * first click/tap (see `unlockAudio`). */

const MUTE_KEY = 'coin-system:game-muted'
const MUSIC_KEY = 'coin-system:game-music'

function readFlag(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === '1'
  } catch {
    return fallback
  }
}

function writeFlag(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* noop */
  }
}

export const useSoundStore = create((set, get) => ({
  muted: readFlag(MUTE_KEY, false),
  musicOn: readFlag(MUSIC_KEY, true),
  toggleMuted() {
    const muted = !get().muted
    writeFlag(MUTE_KEY, muted)
    set({ muted })
    syncMusic()
  },
  toggleMusic() {
    const musicOn = !get().musicOn
    writeFlag(MUSIC_KEY, musicOn)
    set({ musicOn })
    syncMusic()
  },
}))

/* ------------------------------------------------------------------ engine ----------- */

let audioCtx = null
let unlocked = false
let bus = null
let noiseBuffer = null

function buildBus(ctx) {
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.knee.value = 10
  comp.ratio.value = 4
  comp.attack.value = 0.004
  comp.release.value = 0.2
  comp.connect(ctx.destination)

  const sfx = ctx.createGain()
  sfx.gain.value = 0.9
  sfx.connect(comp)

  const music = ctx.createGain()
  music.gain.value = 0.32
  music.connect(comp)

  // A short synthetic room: exponentially decaying stereo noise as the impulse response.
  const len = Math.floor(ctx.sampleRate * 1.6)
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch += 1) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  }
  const reverb = ctx.createConvolver()
  reverb.buffer = impulse
  const wet = ctx.createGain()
  wet.gain.value = 0.22
  reverb.connect(wet).connect(comp)

  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const nd = noiseBuffer.getChannelData(0)
  for (let i = 0; i < nd.length; i += 1) nd[i] = Math.random() * 2 - 1

  return { sfx, music, reverb }
}

function getCtx() {
  if (typeof window === 'undefined' || !unlocked) return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) {
    audioCtx = new Ctx()
    bus = buildBus(audioCtx)
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

/** Call once from a page that plays sounds: the first user gesture unlocks audio. */
export function unlockAudio() {
  const unlock = () => {
    unlocked = true
    getCtx()
    syncMusic()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  return unlock
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)

/** One oscillator note with an attack/decay envelope. `to` = output node (default sfx bus),
 * `wet` = how much goes to the reverb. `filter` adds a lowpass with optional sweep. */
function tone(
  ctx,
  { freq, duration = 0.15, delay = 0, type = 'sine', volume = 0.2, slideTo, attack = 0.01, wet = 0.3, to, filter, filterTo, detune = 0, t },
) {
  const t0 = t ?? ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.detune.value = detune
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  let node = osc
  if (filter) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(filter, t0)
    if (filterTo) f.frequency.exponentialRampToValueAtTime(filterTo, t0 + duration)
    f.Q.value = 2
    node.connect(f)
    node = f
  }
  node.connect(gain)
  gain.connect(to ?? bus.sfx)
  if (wet > 0) {
    const send = ctx.createGain()
    send.gain.value = wet
    gain.connect(send).connect(bus.reverb)
  }
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Filtered white noise burst — drums, whooshes, claps, cymbals. */
function noise(
  ctx,
  { duration = 0.2, delay = 0, volume = 0.2, type = 'bandpass', freq = 1000, freqTo, q = 1, attack = 0.002, wet = 0.2, to, t },
) {
  const t0 = t ?? ctx.currentTime + delay
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.setValueAtTime(freq, t0)
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t0 + duration)
  f.Q.value = q
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  src.connect(f).connect(gain).connect(to ?? bus.sfx)
  if (wet > 0) {
    const send = ctx.createGain()
    send.gain.value = wet
    gain.connect(send).connect(bus.reverb)
  }
  src.start(t0, Math.random() * 1.5)
  src.stop(t0 + duration + 0.05)
}

/* --- drum kit --- */
const kick = (ctx, o = {}) => {
  tone(ctx, { freq: 160, slideTo: 42, duration: 0.32, volume: o.volume ?? 0.9, attack: 0.002, wet: 0.05, ...o })
  noise(ctx, { type: 'lowpass', freq: 900, duration: 0.03, volume: (o.volume ?? 0.9) * 0.25, wet: 0, ...o })
}
const snare = (ctx, o = {}) => {
  noise(ctx, { type: 'highpass', freq: 1400, duration: 0.18, volume: o.volume ?? 0.45, wet: 0.3, ...o })
  tone(ctx, { freq: 200, slideTo: 150, type: 'triangle', duration: 0.1, volume: (o.volume ?? 0.45) * 0.7, wet: 0.1, ...o })
}
const hat = (ctx, o = {}) => noise(ctx, { type: 'highpass', freq: 7500, duration: o.open ? 0.22 : 0.045, volume: o.volume ?? 0.12, wet: 0.05, ...o })
const crash = (ctx, o = {}) => {
  noise(ctx, { type: 'highpass', freq: 4000, duration: 1.8, volume: o.volume ?? 0.35, wet: 0.5, ...o })
  noise(ctx, { type: 'bandpass', freq: 6500, q: 0.6, duration: 1.2, volume: (o.volume ?? 0.35) * 0.6, wet: 0.4, ...o })
}
const clap = (ctx, o = {}) => {
  ;[0, 0.012, 0.024].forEach((d) =>
    noise(ctx, {
      type: 'bandpass',
      freq: 1500,
      q: 1.2,
      duration: 0.08,
      volume: o.volume ?? 0.35,
      delay: (o.delay ?? 0) + d,
      wet: 0.35,
      to: o.to,
      t: o.t !== undefined ? o.t + d : undefined,
    }),
  )
}

/** A brass-ish stab: detuned saws through a lowpass that opens then closes. */
function brass(ctx, notes, { delay = 0, duration = 0.3, volume = 0.12 } = {}) {
  notes.forEach((n) =>
    [-9, 9].forEach((detune) =>
      tone(ctx, { freq: midi(n), type: 'sawtooth', detune, duration, delay, volume, attack: 0.03, filter: 3200, filterTo: 700, wet: 0.35 }),
    ),
  )
}

/** Crowd applause: hundreds of tiny random claps over `duration`. */
function applause(ctx, { delay = 0, duration = 2.4, volume = 0.18 } = {}) {
  const count = Math.floor(duration * 90)
  for (let i = 0; i < count; i += 1) {
    const at = delay + Math.random() * duration
    const fade = 1 - (at - delay) / duration
    noise(ctx, {
      type: 'bandpass',
      freq: 900 + Math.random() * 2200,
      q: 1.5,
      duration: 0.03 + Math.random() * 0.04,
      volume: volume * (0.4 + Math.random() * 0.6) * (0.3 + 0.7 * fade),
      delay: at,
      wet: 0.4,
    })
  }
  // The "whoo" of the room under the claps.
  noise(ctx, { type: 'bandpass', freq: 600, q: 0.5, duration, attack: 0.2, volume: volume * 0.4, delay, wet: 0.5 })
}

const SOUNDS = {
  /** Someone joined the lobby — bubbly pop + sparkle. */
  join: (ctx) => {
    tone(ctx, { freq: 320, slideTo: 900, duration: 0.09, type: 'sine', volume: 0.35, wet: 0.1 })
    tone(ctx, { freq: midi(84), duration: 0.18, delay: 0.07, type: 'triangle', volume: 0.18 })
    tone(ctx, { freq: midi(91), duration: 0.25, delay: 0.12, type: 'sine', volume: 0.12 })
  },
  /** A game just opened for the student's group — "ding-ding-ding" alert. */
  notify: (ctx) => {
    ;[76, 81, 88].forEach((n, i) => {
      tone(ctx, { freq: midi(n), duration: 0.45, delay: i * 0.11, type: 'triangle', volume: 0.2 })
      tone(ctx, { freq: midi(n + 12), duration: 0.3, delay: i * 0.11, type: 'sine', volume: 0.08 })
    })
  },
  /** 3-2-1 lead-in beat: tom drum + beep. */
  count: (ctx) => {
    tone(ctx, { freq: 220, slideTo: 110, duration: 0.25, volume: 0.6, attack: 0.002, wet: 0.2 })
    tone(ctx, { freq: midi(72), duration: 0.14, type: 'square', volume: 0.07, filter: 2500, wet: 0.2 })
  },
  /** Question opens — whoosh + kick + bright chord hit. */
  go: (ctx) => {
    noise(ctx, { type: 'bandpass', freq: 400, freqTo: 5000, q: 2, duration: 0.35, volume: 0.25, attack: 0.25, wet: 0.2 })
    kick(ctx, { delay: 0.3 })
    crash(ctx, { delay: 0.3, volume: 0.22 })
    brass(ctx, [72, 76, 79, 84], { delay: 0.3, duration: 0.45, volume: 0.07 })
  },
  /** Clock tick in the last seconds — woodblock. */
  tick: (ctx) => {
    tone(ctx, { freq: 1900, duration: 0.04, type: 'sine', volume: 0.3, attack: 0.001, wet: 0.1 })
    noise(ctx, { type: 'bandpass', freq: 3000, q: 4, duration: 0.02, volume: 0.15, wet: 0 })
  },
  /** Last 3 seconds — heartbeat thump. */
  heartbeat: (ctx) => {
    kick(ctx, { volume: 0.7 })
    kick(ctx, { volume: 0.45, delay: 0.16 })
    tone(ctx, { freq: 2100, duration: 0.05, type: 'sine', volume: 0.25, attack: 0.001, wet: 0.1 })
  },
  /** Player locked in an answer — mechanical click + rising blip. */
  lock: (ctx) => {
    noise(ctx, { type: 'highpass', freq: 3000, duration: 0.025, volume: 0.3, wet: 0 })
    tone(ctx, { freq: 600, slideTo: 1500, duration: 0.12, type: 'square', volume: 0.08, filter: 3000, wet: 0.15 })
  },
  /** UI select (hero picker etc.). */
  select: (ctx) => {
    tone(ctx, { freq: midi(79), duration: 0.07, type: 'square', volume: 0.07, filter: 2800, wet: 0.1 })
    tone(ctx, { freq: midi(86), duration: 0.1, delay: 0.05, type: 'square', volume: 0.07, filter: 2800, wet: 0.15 })
  },
  /** Time ran out — game-show buzzer. */
  timeUp: (ctx) => {
    ;[0, 7, 13].forEach((d) =>
      tone(ctx, { freq: 110, detune: d * 10, duration: 0.8, type: 'sawtooth', volume: 0.12, attack: 0.01, filter: 1200, wet: 0.2 }),
    )
    tone(ctx, { freq: 55, duration: 0.8, type: 'square', volume: 0.08, filter: 400, wet: 0 })
  },
  /** Answer revealed (host screen) — drum hit + cymbal + rising sting. */
  reveal: (ctx) => {
    snare(ctx, { volume: 0.4 })
    kick(ctx)
    crash(ctx, { volume: 0.25 })
    brass(ctx, [67, 71, 74], { duration: 0.2, volume: 0.07 })
    brass(ctx, [72, 76, 79], { delay: 0.16, duration: 0.6, volume: 0.08 })
  },
  /** Correct — coin + bright chime arpeggio + sparkles. */
  correct: (ctx) => {
    tone(ctx, { freq: midi(83), duration: 0.08, type: 'square', volume: 0.1, filter: 4000, wet: 0.1 })
    tone(ctx, { freq: midi(88), duration: 0.5, delay: 0.08, type: 'square', volume: 0.1, filter: 4000, wet: 0.3 })
    ;[72, 76, 79, 84, 88].forEach((n, i) =>
      tone(ctx, { freq: midi(n), duration: 0.35, delay: 0.15 + i * 0.06, type: 'triangle', volume: 0.16 }),
    )
    for (let i = 0; i < 6; i += 1) {
      tone(ctx, { freq: midi(96 + ((i * 5) % 12)), duration: 0.12, delay: 0.45 + i * 0.05, type: 'sine', volume: 0.05, wet: 0.6 })
    }
    applause(ctx, { delay: 0.2, duration: 1.2, volume: 0.08 })
  },
  /** Wrong — descending "wah-wah" trombone. */
  wrong: (ctx) => {
    ;[62, 61, 60].forEach((n, i) =>
      tone(ctx, { freq: midi(n), duration: 0.28, delay: i * 0.3, type: 'sawtooth', volume: 0.13, attack: 0.04, filter: 1400, filterTo: 500 }),
    )
    tone(ctx, { freq: midi(59), slideTo: midi(55), duration: 0.9, delay: 0.9, type: 'sawtooth', volume: 0.13, attack: 0.04, filter: 1400, filterTo: 300 })
  },
  /** Rank went up — whoosh up + chime. */
  climb: (ctx) => {
    noise(ctx, { type: 'bandpass', freq: 500, freqTo: 6000, q: 3, duration: 0.4, volume: 0.15, attack: 0.3 })
    tone(ctx, { freq: 500, slideTo: 1600, duration: 0.35, type: 'triangle', volume: 0.12 })
    tone(ctx, { freq: midi(91), duration: 0.4, delay: 0.35, type: 'sine', volume: 0.12, wet: 0.5 })
  },
  /** Streak ≥ 3 — "ON FIRE": flame roar + power chord rise. */
  fire: (ctx) => {
    noise(ctx, { type: 'lowpass', freq: 300, freqTo: 3000, duration: 0.9, attack: 0.15, volume: 0.35, wet: 0.3 })
    ;[48, 55, 60].forEach((n) =>
      tone(ctx, { freq: midi(n), slideTo: midi(n + 12), duration: 0.7, type: 'sawtooth', volume: 0.07, filter: 800, filterTo: 4000 }),
    )
    crash(ctx, { delay: 0.6, volume: 0.2 })
  },
  /** Power-up activated — classic rising arpeggio. */
  powerUp: (ctx) => {
    ;[60, 64, 67, 72, 76, 79, 84].forEach((n, i) =>
      tone(ctx, { freq: midi(n), duration: 0.09, delay: i * 0.04, type: 'square', volume: 0.07, filter: 3500, wet: 0.2 }),
    )
    tone(ctx, { freq: midi(84), slideTo: midi(96), duration: 0.35, delay: 0.28, type: 'triangle', volume: 0.12, wet: 0.5 })
  },
  /** 50/50 — two "zap" eliminations. */
  zap: (ctx) => {
    ;[0, 0.18].forEach((d) => {
      tone(ctx, { freq: 1600, slideTo: 120, duration: 0.18, delay: d, type: 'sawtooth', volume: 0.1, filter: 5000, wet: 0.2 })
      noise(ctx, { type: 'highpass', freq: 2000, duration: 0.12, delay: d, volume: 0.12 })
    })
  },
  /** Shield saved the streak. */
  shield: (ctx) => {
    tone(ctx, { freq: midi(64), duration: 0.8, type: 'triangle', volume: 0.14, wet: 0.6 })
    tone(ctx, { freq: midi(71), duration: 0.8, delay: 0.05, type: 'triangle', volume: 0.12, wet: 0.6 })
    tone(ctx, { freq: 2400, slideTo: 3200, duration: 0.6, type: 'sine', volume: 0.05, wet: 0.7 })
  },
  /** Emoji reaction bubble. */
  pop: (ctx) => tone(ctx, { freq: 380 + Math.random() * 300, slideTo: 1100, duration: 0.07, type: 'sine', volume: 0.12, wet: 0.1 }),
  /** Snare roll that speeds up into a crash — before the podium. */
  drumroll: (ctx) => {
    let t = 0
    for (let i = 0; i < 32; i += 1) {
      const gap = 0.085 - i * 0.0018
      snare(ctx, { delay: t, volume: 0.08 + (i / 32) * 0.25 })
      t += gap
    }
    kick(ctx, { delay: t })
    crash(ctx, { delay: t, volume: 0.45 })
  },
  /** Town: purchase — cash register "ka-ching" with coins. */
  cash: (ctx) => {
    noise(ctx, { type: 'bandpass', freq: 2500, q: 2, duration: 0.06, volume: 0.25, wet: 0 })
    tone(ctx, { freq: midi(88), duration: 0.6, delay: 0.06, type: 'sine', volume: 0.22, wet: 0.4 })
    tone(ctx, { freq: midi(93), duration: 0.7, delay: 0.1, type: 'sine', volume: 0.16, wet: 0.4 })
    for (let i = 0; i < 7; i += 1) {
      tone(ctx, { freq: 2600 + Math.random() * 1800, duration: 0.07, delay: 0.25 + i * 0.05 + Math.random() * 0.03, type: 'triangle', volume: 0.06, wet: 0.3 })
    }
  },
  /** Town: a floor goes up — hammer hits, then a rising "done" chime. */
  build: (ctx) => {
    ;[0, 0.22, 0.44].forEach((d) => {
      tone(ctx, { freq: 180, slideTo: 90, duration: 0.12, delay: d, volume: 0.5, attack: 0.001, wet: 0.2 })
      noise(ctx, { type: 'bandpass', freq: 3200, q: 3, duration: 0.05, delay: d, volume: 0.3, wet: 0.2 })
    })
    noise(ctx, { type: 'lowpass', freq: 600, duration: 0.8, delay: 0.6, attack: 0.1, volume: 0.15, wet: 0.3 })
    ;[67, 72, 76, 79].forEach((n, i) => tone(ctx, { freq: midi(n), duration: 0.3, delay: 0.75 + i * 0.07, type: 'triangle', volume: 0.12 }))
  },
  /** Town: engine start. */
  engine: (ctx) => {
    tone(ctx, { freq: 40, slideTo: 95, duration: 0.5, type: 'sawtooth', volume: 0.18, filter: 400, wet: 0.05 })
    tone(ctx, { freq: 95, slideTo: 70, duration: 0.9, delay: 0.5, type: 'sawtooth', volume: 0.14, filter: 350, wet: 0.05 })
    noise(ctx, { type: 'lowpass', freq: 300, duration: 1.2, volume: 0.15, wet: 0 })
    tone(ctx, { freq: 420, duration: 0.15, delay: 1.2, type: 'square', volume: 0.06, filter: 1500 })
    tone(ctx, { freq: 420, duration: 0.25, delay: 1.4, type: 'square', volume: 0.06, filter: 1500 })
  },
  /** Town: car horn — two detuned square tones, like a real "beep-beep". */
  horn: (ctx) => {
    ;[0, 0.28].forEach((d) =>
      [415, 523].forEach((f) => tone(ctx, { freq: f, duration: 0.22, delay: d, type: 'square', volume: 0.06, attack: 0.01, filter: 2200, wet: 0.1 })),
    )
  },
  /** Town: hit a curb / wall. */
  bump: (ctx) => {
    kick(ctx, { volume: 0.6 })
    noise(ctx, { type: 'lowpass', freq: 1200, duration: 0.25, volume: 0.3, wet: 0.1 })
    noise(ctx, { type: 'bandpass', freq: 4000, q: 2, duration: 0.12, delay: 0.03, volume: 0.12, wet: 0.1 })
  },
  /** Town: car door shut (passenger in / out). */
  door: (ctx) => {
    noise(ctx, { type: 'lowpass', freq: 700, duration: 0.18, volume: 0.45, attack: 0.003, wet: 0.15 })
    tone(ctx, { freq: 120, slideTo: 70, duration: 0.15, volume: 0.4, attack: 0.002, wet: 0.1 })
    noise(ctx, { type: 'highpass', freq: 3500, duration: 0.04, delay: 0.02, volume: 0.15, wet: 0 })
  },
  /** Game over — brass fanfare, drums and a cheering crowd. */
  fanfare: (ctx) => {
    const seq = [
      [[67], 0, 0.14],
      [[67], 0.15, 0.14],
      [[67], 0.3, 0.14],
      [[64, 72], 0.45, 0.5],
      [[65, 74], 1.0, 0.3],
      [[67, 76], 1.3, 0.3],
      [[72, 76, 79, 84], 1.65, 1.4],
    ]
    seq.forEach(([notes, d, dur]) => brass(ctx, notes, { delay: d, duration: dur, volume: 0.09 }))
    ;[0, 0.15, 0.3, 0.45].forEach((d) => snare(ctx, { delay: d, volume: 0.25 }))
    kick(ctx, { delay: 0.45 })
    kick(ctx, { delay: 1.65 })
    crash(ctx, { delay: 1.65, volume: 0.4 })
    applause(ctx, { delay: 1.5, duration: 3.2, volume: 0.2 })
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

/* ------------------------------------------------------------------ music ------------ */

/** Two loops, sequenced in 16th notes:
 *  - `lobby`: an upbeat pop groove while players join.
 *  - `tension`: a pulsing, driving loop while a question is open; `setMusicIntensity(1)`
 *    doubles the hats and opens the filter for the last seconds. */
const LOOPS = {
  lobby: {
    bpm: 116,
    // Am – F – C – G
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    step(ctx, t, step, chord, out) {
      if (step === 0 || step === 8 || step === 11) kick(ctx, { t, volume: 0.55, to: out })
      if (step === 4 || step === 12) clap(ctx, { t, volume: 0.22, to: out })
      if (step % 2 === 0) hat(ctx, { t, volume: step % 4 === 2 ? 0.09 : 0.05, to: out })
      if ([0, 3, 6, 8, 10, 14].includes(step)) {
        tone(ctx, { t, freq: midi(chord[0] - 12), duration: 0.22, type: 'sawtooth', volume: 0.14, filter: 600, wet: 0, to: out })
      }
      if (step % 2 === 0) {
        const n = chord[(step / 2) % 3] + 12 + (step >= 8 ? 12 : 0)
        tone(ctx, { t, freq: midi(n), duration: 0.16, type: 'triangle', volume: 0.07, wet: 0.4, to: out })
      }
      if (step === 0) chord.forEach((n) => tone(ctx, { t, freq: midi(n), duration: 1.6, type: 'sine', volume: 0.035, attack: 0.3, wet: 0.5, to: out }))
    },
  },
  tension: {
    bpm: 132,
    chords: [[45], [45], [46], [44]],
    step(ctx, t, step, chord, out, intensity) {
      if (step % 4 === 0) kick(ctx, { t, volume: 0.5 + intensity * 0.2, to: out })
      if (intensity > 0 || step % 2 === 1) hat(ctx, { t, volume: 0.05 + intensity * 0.04, to: out })
      tone(ctx, {
        t,
        freq: midi(chord[0] - 12 + (step % 4 === 2 ? 12 : 0)),
        duration: 0.11,
        type: 'sawtooth',
        volume: 0.11,
        filter: 500 + intensity * 1500 + (step % 4) * 120,
        wet: 0,
        to: out,
      })
      if (step === 0 || step === 6 || step === 12) {
        tone(ctx, { t, freq: midi(chord[0] + 24), duration: 0.12, type: 'square', volume: 0.04, filter: 2000, wet: 0.5, to: out })
        tone(ctx, { t, freq: midi(chord[0] + 25), duration: 0.12, type: 'square', volume: 0.03, filter: 2000, wet: 0.5, to: out })
      }
      if (intensity > 0 && step % 4 === 2) snare(ctx, { t, volume: 0.12, to: out })
    },
  },
}

let desiredMusic = null
let musicIntensity = 0
let playing = null // { kind, timer, nextTime, step, out }

function stopPlaying() {
  if (!playing) return
  clearInterval(playing.timer)
  const { out } = playing
  if (audioCtx && out) {
    const now = audioCtx.currentTime
    out.gain.cancelScheduledValues(now)
    out.gain.setValueAtTime(out.gain.value, now)
    out.gain.linearRampToValueAtTime(0, now + 0.4)
    setTimeout(() => out.disconnect(), 600)
  }
  playing = null
}

function syncMusic() {
  const { muted, musicOn } = useSoundStore.getState()
  const want = !muted && musicOn ? desiredMusic : null
  if (playing?.kind === want) return
  stopPlaying()
  if (!want) return
  const ctx = getCtx()
  if (!ctx) return
  const loop = LOOPS[want]
  const out = ctx.createGain()
  out.gain.setValueAtTime(0, ctx.currentTime)
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6)
  out.connect(bus.music)
  const stepDur = 60 / loop.bpm / 4
  const state = { kind: want, out, step: 0, nextTime: ctx.currentTime + 0.1, timer: null }
  // Look-ahead scheduler: every 25 ms, queue the steps falling in the next 120 ms.
  state.timer = setInterval(() => {
    if (ctx.state !== 'running') return
    while (state.nextTime < ctx.currentTime + 0.12) {
      const bar = Math.floor(state.step / 16) % loop.chords.length
      try {
        loop.step(ctx, state.nextTime, state.step % 16, loop.chords[bar], out, musicIntensity)
      } catch {
        /* noop */
      }
      state.nextTime += stepDur
      state.step += 1
    }
  }, 25)
  playing = state
}

/** Ask for a background loop (`'lobby'`, `'tension'`) or silence (`null`). Starts once audio
 * is unlocked and respects the mute / music toggles. */
export function setMusic(kind) {
  desiredMusic = kind
  if (kind !== 'tension') musicIntensity = 0
  syncMusic()
}

export function setMusicIntensity(value) {
  musicIntensity = value
}

/* ------------------------------------------------------------------ engine ----------- */

let engine = null

/** Continuous engine sound for driving: two detuned oscillators through a lowpass, pitch and
 * brightness follow speed and throttle (see `setEngine`). */
export function startEngine() {
  const ctx = getCtx()
  if (!ctx || engine) return
  const out = ctx.createGain()
  out.gain.value = 0
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 350
  filter.Q.value = 3
  const a = ctx.createOscillator()
  a.type = 'sawtooth'
  a.frequency.value = 38
  const b = ctx.createOscillator()
  b.type = 'square'
  b.frequency.value = 76
  b.detune.value = 12
  const bGain = ctx.createGain()
  bGain.gain.value = 0.4
  // A slow wobble so idle sounds like pistons, not a pure tone.
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 9
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 3
  lfo.connect(lfoGain).connect(a.frequency)
  a.connect(filter)
  b.connect(bGain).connect(filter)
  filter.connect(out).connect(bus.sfx)
  a.start()
  b.start()
  lfo.start()
  engine = { ctx, out, filter, a, b, lfo }
  setEngine(0, 0)
}

/** `speed01` 0..1 of top speed, `throttle01` 0..1 pedal. */
export function setEngine(speed01, throttle01) {
  if (!engine) return
  const { ctx, out, filter, a, b, lfo } = engine
  const t = ctx.currentTime
  const muted = useSoundStore.getState().muted
  // Fake gears: pitch climbs, drops a little at each shift, climbs again.
  const gear = Math.min(4, Math.floor(speed01 * 5))
  const inGear = speed01 * 5 - gear
  const base = 38 + gear * 9 + inGear * 34 + throttle01 * 6
  a.frequency.setTargetAtTime(base, t, 0.08)
  b.frequency.setTargetAtTime(base * 2, t, 0.08)
  lfo.frequency.setTargetAtTime(8 + base / 6, t, 0.1)
  filter.frequency.setTargetAtTime(300 + speed01 * 900 + throttle01 * 700, t, 0.1)
  out.gain.setTargetAtTime(muted ? 0 : 0.07 + throttle01 * 0.05 + speed01 * 0.04, t, 0.1)
}

export function stopEngine() {
  if (!engine) return
  const { ctx, out, a, b, lfo } = engine
  out.gain.setTargetAtTime(0, ctx.currentTime, 0.1)
  const stopAt = ctx.currentTime + 0.6
  a.stop(stopAt)
  b.stop(stopAt)
  lfo.stop(stopAt)
  engine = null
}
