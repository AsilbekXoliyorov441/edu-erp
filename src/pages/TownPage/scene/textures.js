import * as THREE from 'three'

/** Procedural textures drawn on a 2D canvas — nothing to download, so the town loads even on
 * networks that block asset CDNs. Each one is built once and cached. */

const cache = new Map()

function rand(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function canvasTexture(key, size, draw, { repeat = [1, 1], srgb = true } = {}) {
  const id = `${key}:${repeat.join('x')}`
  if (cache.has(id)) return cache.get(id)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  draw(canvas.getContext('2d'), size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(...repeat)
  tex.anisotropy = 8
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  cache.set(id, tex)
  return tex
}

function speckle(g, size, count, colors, maxR, seed) {
  const r = rand(seed)
  for (let i = 0; i < count; i += 1) {
    g.fillStyle = colors[Math.floor(r() * colors.length)]
    g.globalAlpha = 0.25 + r() * 0.5
    const rad = r() * maxR + 0.3
    g.beginPath()
    g.arc(r() * size, r() * size, rad, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1
}

export function asphaltTexture(repeat) {
  return canvasTexture(
    'asphalt',
    512,
    (g, s) => {
      g.fillStyle = '#3a3c40'
      g.fillRect(0, 0, s, s)
      speckle(g, s, 9000, ['#2a2b2e', '#4a4c51', '#55575c', '#232427'], 1.4, 7)
      // A few cracks / patches.
      const r = rand(99)
      g.strokeStyle = 'rgba(20,20,22,0.35)'
      for (let i = 0; i < 6; i += 1) {
        g.lineWidth = 0.8 + r()
        g.beginPath()
        let x = r() * s
        let y = r() * s
        g.moveTo(x, y)
        for (let k = 0; k < 6; k += 1) {
          x += (r() - 0.5) * 40
          y += (r() - 0.5) * 40
          g.lineTo(x, y)
        }
        g.stroke()
      }
    },
    { repeat },
  )
}

export function grassTexture(repeat) {
  return canvasTexture(
    'grass',
    512,
    (g, s) => {
      g.fillStyle = '#4f7a35'
      g.fillRect(0, 0, s, s)
      speckle(g, s, 5000, ['#3e6a2a', '#5d8b3d', '#6c9a45', '#466f2f', '#7aa64f'], 3, 3)
      const r = rand(11)
      for (let i = 0; i < 14000; i += 1) {
        const x = r() * s
        const y = r() * s
        g.strokeStyle = r() > 0.5 ? 'rgba(120,170,80,0.35)' : 'rgba(40,80,30,0.35)'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4)
        g.stroke()
      }
    },
    { repeat },
  )
}

export function sidewalkTexture(repeat) {
  return canvasTexture(
    'sidewalk',
    256,
    (g, s) => {
      g.fillStyle = '#b9b5ad'
      g.fillRect(0, 0, s, s)
      speckle(g, s, 2500, ['#a8a49c', '#c8c4bc', '#9d998f'], 1, 5)
      g.strokeStyle = '#8f8b83'
      g.lineWidth = 3
      for (let i = 0; i <= 4; i += 1) {
        g.beginPath()
        g.moveTo(0, (i * s) / 4)
        g.lineTo(s, (i * s) / 4)
        g.stroke()
        g.beginPath()
        g.moveTo((i * s) / 4, 0)
        g.lineTo((i * s) / 4, s)
        g.stroke()
      }
    },
    { repeat },
  )
}

export function concreteTexture(repeat) {
  return canvasTexture(
    'concrete',
    256,
    (g, s) => {
      g.fillStyle = '#c9c6c0'
      g.fillRect(0, 0, s, s)
      speckle(g, s, 3000, ['#b5b2ab', '#d8d5cf', '#a9a69f'], 1.2, 21)
    },
    { repeat },
  )
}

export function dirtTexture(repeat) {
  return canvasTexture(
    'dirt',
    256,
    (g, s) => {
      g.fillStyle = '#8b6f4e'
      g.fillRect(0, 0, s, s)
      speckle(g, s, 4000, ['#7a5f40', '#9c8060', '#6b5236', '#a88c6a'], 2, 31)
    },
    { repeat },
  )
}

/** Light plaster noise, tinted by the material color. */
export function plasterTexture() {
  return canvasTexture('plaster', 256, (g, s) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, s, s)
    speckle(g, s, 6000, ['#ececec', '#f6f6f6', '#e2e2e2', '#dadada'], 1.3, 41)
  }, { repeat: [2, 2] })
}

export function brickTexture() {
  return canvasTexture('brick', 256, (g, s) => {
    g.fillStyle = '#d9d2c8'
    g.fillRect(0, 0, s, s)
    const rows = 16
    const h = s / rows
    const r = rand(51)
    for (let y = 0; y < rows; y += 1) {
      const offset = y % 2 ? s / 8 : 0
      for (let x = -1; x < 4; x += 1) {
        const shade = 230 + Math.floor(r() * 25)
        g.fillStyle = `rgb(${shade},${shade},${shade})`
        g.fillRect(x * (s / 4) + offset + 2, y * h + 2, s / 4 - 4, h - 4)
      }
    }
  }, { repeat: [2, 2] })
}

export function woodTexture() {
  return canvasTexture('wood', 256, (g, s) => {
    g.fillStyle = '#7a4e2d'
    g.fillRect(0, 0, s, s)
    const r = rand(61)
    for (let i = 0; i < 120; i += 1) {
      g.strokeStyle = `rgba(${40 + r() * 40},${20 + r() * 20},10,0.35)`
      g.lineWidth = 1 + r() * 2
      g.beginPath()
      const y = r() * s
      g.moveTo(0, y)
      g.bezierCurveTo(s / 3, y + (r() - 0.5) * 10, (2 * s) / 3, y + (r() - 0.5) * 10, s, y)
      g.stroke()
    }
  })
}

export function carpetTexture() {
  return canvasTexture('carpet', 256, (g, s) => {
    g.fillStyle = '#9b1c1c'
    g.fillRect(0, 0, s, s)
    g.strokeStyle = '#f2c14e'
    g.lineWidth = 6
    g.strokeRect(14, 14, s - 28, s - 28)
    g.fillStyle = '#1e3a8a'
    for (let i = 0; i < 3; i += 1) {
      g.save()
      g.translate(s / 2, 60 + i * 68)
      g.rotate(Math.PI / 4)
      g.fillRect(-18, -18, 36, 36)
      g.restore()
    }
  })
}

/** Text sign: `text` on a colored board. Not cached by repeat — keyed by content. */
export function signTexture(text, { bg = '#ffffff', fg = '#111827', sub, width = 512, height = 128, border } = {}) {
  const key = `sign:${text}:${bg}:${fg}:${sub}:${width}x${height}:${border}`
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')
  g.fillStyle = bg
  g.fillRect(0, 0, width, height)
  if (border) {
    g.strokeStyle = border
    g.lineWidth = 8
    g.strokeRect(4, 4, width - 8, height - 8)
  }
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const main = sub ? height * 0.42 : height * 0.6
  g.font = `900 ${main}px "Arial Black", "Segoe UI", sans-serif`
  g.fillText(text, width / 2, sub ? height * 0.36 : height / 2, width - 24)
  if (sub) {
    g.font = `700 ${height * 0.26}px "Segoe UI", sans-serif`
    g.fillText(sub, width / 2, height * 0.76, width - 24)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  cache.set(key, tex)
  return tex
}

/** Facade textures for tall buildings: one tile = `cols × rows` window bays. Repeated over a
 * box, a 100-floor tower is one mesh. Variants: office glass curtain wall, apartment walls. */
export function facadeTexture(kind, design) {
  const key = `facade:${kind}:${design}`
  if (cache.has(key)) return cache.get(key)
  const size = 512
  const cols = 4
  const rows = 4
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  const bw = size / cols
  const bh = size / rows
  const r = rand(kind.length * 97 + design.length * 13)

  if (kind === 'office') {
    const tint = { glass: ['#7fb2d9', '#3b6f9e'], dark: ['#3a4250', '#11161d'], gold: ['#e8c877', '#8a6a24'], stepped: ['#a7c6dc', '#4a6f8c'] }[design] ?? ['#7fb2d9', '#3b6f9e']
    const frame = design === 'dark' ? '#9aa3ad' : design === 'gold' ? '#5b4416' : '#dfe6ec'
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const grad = g.createLinearGradient(0, y * bh, 0, (y + 1) * bh)
        grad.addColorStop(0, tint[0])
        grad.addColorStop(1, tint[1])
        g.fillStyle = grad
        g.fillRect(x * bw, y * bh, bw, bh)
        // a few lit / blinded panes so the wall isn't a perfect mirror
        if (r() < 0.18) {
          g.fillStyle = r() < 0.5 ? 'rgba(255,240,200,0.35)' : 'rgba(255,255,255,0.18)'
          g.fillRect(x * bw + 4, y * bh + 4, bw - 8, bh * (0.4 + r() * 0.5))
        }
      }
    }
    g.strokeStyle = frame
    g.lineWidth = 6
    for (let x = 0; x <= cols; x += 1) {
      g.beginPath()
      g.moveTo(x * bw, 0)
      g.lineTo(x * bw, size)
      g.stroke()
    }
    g.lineWidth = 10
    for (let y = 0; y <= rows; y += 1) {
      g.beginPath()
      g.moveTo(0, y * bh)
      g.lineTo(size, y * bh)
      g.stroke()
    }
  } else {
    const wall = { white: '#f1f2f0', brick: '#a4553b', color: '#e9e4da' }[design] ?? '#f1f2f0'
    g.fillStyle = wall
    g.fillRect(0, 0, size, size)
    if (design === 'brick') {
      g.strokeStyle = 'rgba(60,25,15,0.35)'
      g.lineWidth = 1
      for (let y = 0; y < size; y += 8) {
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(size, y)
        g.stroke()
      }
    } else {
      speckle(g, size, 2500, ['#e2e2df', '#f9f9f7'], 1.2, 71)
    }
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const wx = x * bw + bw * 0.2
        const wy = y * bh + bh * 0.22
        const ww = bw * 0.6
        const wh = bh * 0.55
        g.fillStyle = design === 'brick' ? '#efe6d8' : '#ffffff'
        g.fillRect(wx - 5, wy - 5, ww + 10, wh + 10)
        const grad = g.createLinearGradient(0, wy, 0, wy + wh)
        grad.addColorStop(0, '#9cc3dd')
        grad.addColorStop(1, '#41637d')
        g.fillStyle = grad
        g.fillRect(wx, wy, ww, wh)
        if (r() < 0.25) {
          g.fillStyle = 'rgba(255,230,170,0.55)'
          g.fillRect(wx, wy, ww, wh)
        }
        g.fillStyle = design === 'brick' ? '#efe6d8' : '#d7d7d4'
        g.fillRect(wx + ww / 2 - 2, wy, 4, wh)
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  cache.set(key, tex)
  return tex
}
