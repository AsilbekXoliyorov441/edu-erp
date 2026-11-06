import * as THREE from 'three'

/** Night-time textures, drawn on a canvas once and cached. */

const cache = new Map()

function rand(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function make(key, w, h, draw, srgb = true) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}

/** A person silhouette: head + shoulders/torso. */
function person(g, x, y, s, color = '#2a1a10') {
  g.fillStyle = color
  g.beginPath()
  g.arc(x, y, 9 * s, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.moveTo(x - 17 * s, y + 46 * s)
  g.quadraticCurveTo(x - 17 * s, y + 12 * s, x, y + 11 * s)
  g.quadraticCurveTo(x + 17 * s, y + 12 * s, x + 17 * s, y + 46 * s)
  g.closePath()
  g.fill()
}

function room(g, w, h, top, bottom) {
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, top)
  grad.addColorStop(1, bottom)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  // ceiling lamp glow
  const glow = g.createRadialGradient(w / 2, 6, 2, w / 2, 6, w * 0.7)
  glow.addColorStop(0, 'rgba(255,250,220,0.9)')
  glow.addColorStop(1, 'rgba(255,250,220,0)')
  g.fillStyle = glow
  g.fillRect(0, 0, w, h)
}

function curtains(g, w, h, color) {
  g.fillStyle = color
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(w * 0.2, 0)
  g.quadraticCurveTo(w * 0.1, h * 0.5, w * 0.16, h)
  g.lineTo(0, h)
  g.fill()
  g.beginPath()
  g.moveTo(w, 0)
  g.lineTo(w * 0.8, 0)
  g.quadraticCurveTo(w * 0.9, h * 0.5, w * 0.84, h)
  g.lineTo(w, h)
  g.fill()
}

/** Lit house windows, six kinds of rooms. */
export const WINDOW_VARIANTS = 6

export function nightWindowTexture(variant) {
  return make(`nightwin:${variant}`, 128, 128, (g, w, h) => {
    switch (variant) {
      case 0: // someone standing at the window
        room(g, w, h, '#ffd27a', '#e88b3a')
        curtains(g, w, h, 'rgba(150,60,30,0.55)')
        person(g, 64, 52, 1.5)
        break
      case 1: // family watching TV — blue glow
        room(g, w, h, '#7aa7ff', '#3046a8')
        g.fillStyle = 'rgba(180,220,255,0.6)'
        g.fillRect(70, 50, 40, 26)
        person(g, 34, 70, 1, '#0f1530')
        person(g, 56, 74, 0.9, '#0f1530')
        g.fillStyle = '#121a3a'
        g.fillRect(14, 100, 70, 28)
        break
      case 2: // two people talking
        room(g, w, h, '#ffe39a', '#f0a24a')
        person(g, 42, 58, 1.2)
        person(g, 88, 62, 1.1, '#3a2010')
        break
      case 3: // empty cosy room with a lamp and a plant
        room(g, w, h, '#ffdca0', '#d9783a')
        curtains(g, w, h, 'rgba(120,40,40,0.5)')
        g.fillStyle = '#5a3418'
        g.fillRect(84, 70, 6, 50)
        g.fillStyle = '#fff1b8'
        g.beginPath()
        g.moveTo(74, 72)
        g.lineTo(100, 72)
        g.lineTo(92, 56)
        g.lineTo(82, 56)
        g.fill()
        g.fillStyle = '#2f5a24'
        g.beginPath()
        g.arc(30, 96, 16, 0, Math.PI * 2)
        g.fill()
        break
      case 4: // kid at a desk with a laptop
        room(g, w, h, '#fff0c0', '#e9a752')
        g.fillStyle = '#3b2a1c'
        g.fillRect(20, 92, 90, 8)
        g.fillStyle = 'rgba(190,230,255,0.85)'
        g.fillRect(56, 74, 26, 18)
        person(g, 50, 60, 0.9)
        break
      default: // drawn curtains, just glow
        room(g, w, h, '#ffcf80', '#f19a45')
        g.fillStyle = 'rgba(200,110,60,0.45)'
        for (let x = 0; x < w; x += 12) g.fillRect(x, 0, 6, h)
    }
  })
}

/** Emissive mask for apartment / office facades: black walls, warm lit windows (some with
 * people), laid out on the same 4×4 bay grid as `facadeTexture`. */
export function facadeNightTexture(kind, design) {
  return make(`facadenight:${kind}:${design}`, 512, 512, (g, size) => {
    g.fillStyle = '#000000'
    g.fillRect(0, 0, size, size)
    const r = rand(kind.length * 131 + design.length * 17)
    const bw = size / 4
    const bh = size / 4
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        if (r() < (kind === 'office' ? 0.72 : 0.38)) continue // dark window
        const warm = r() < 0.8
        if (kind === 'office') {
          g.fillStyle = warm ? '#fff3cf' : '#cfe6ff'
          g.fillRect(x * bw + 4, y * bh + 6, bw - 8, bh - 12)
        } else {
          const wx = x * bw + bw * 0.2
          const wy = y * bh + bh * 0.22
          const ww = bw * 0.6
          const wh = bh * 0.55
          g.fillStyle = warm ? '#ffd27a' : '#8fb4ff'
          g.fillRect(wx, wy, ww, wh)
          if (r() < 0.45) {
            g.save()
            g.translate(wx + ww * (0.3 + r() * 0.4), wy + wh * 0.25)
            person(g, 0, 0, 0.55, '#2a1a10')
            g.restore()
          }
        }
      }
    }
  })
}

/** Soft round pool of light for the ground under a street lamp. */
export function lightPoolTexture() {
  return make(
    'lightpool',
    128,
    128,
    (g, w) => {
      const grad = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      grad.addColorStop(0, 'rgba(255,220,150,1)')
      grad.addColorStop(0.5, 'rgba(255,200,120,0.45)')
      grad.addColorStop(1, 'rgba(255,190,110,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, w, w)
    },
    true,
  )
}

/** Light washing up a wall from the ground: bright at the bottom, fading upward. */
export function uplightTexture() {
  return make(
    'uplight',
    64,
    256,
    (g, w, h) => {
      const grad = g.createLinearGradient(0, h, 0, 0)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.35, 'rgba(255,255,255,0.45)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
    },
    true,
  )
}
