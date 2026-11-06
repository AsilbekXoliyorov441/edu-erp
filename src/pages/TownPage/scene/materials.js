import * as THREE from 'three'
import { plasterTexture, woodTexture } from '@/pages/TownPage/scene/textures'
import { MATTE_COLORS } from '@/shared/config/town'
import { followNight } from '@/pages/TownPage/scene/dayNight'
import { lightPoolTexture, nightWindowTexture, uplightTexture } from '@/pages/TownPage/scene/nightTextures'

/** Shared materials, built once. Glass and car paint are physical materials so they pick up
 * reflections from the environment light. */

let mats = null

export function getMaterials() {
  if (mats) return mats
  mats = {
    glass: new THREE.MeshPhysicalMaterial({
      color: '#9fb7c9',
      metalness: 0.85,
      roughness: 0.06,
      envMapIntensity: 1.6,
      clearcoat: 1,
    }),
    darkGlass: new THREE.MeshPhysicalMaterial({
      color: '#22323f',
      metalness: 0.95,
      roughness: 0.04,
      envMapIntensity: 2,
      clearcoat: 1,
    }),
    tire: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 }),
    rim: new THREE.MeshStandardMaterial({ color: '#dfe3e8', metalness: 0.85, roughness: 0.22 }),
    carGlass: new THREE.MeshPhysicalMaterial({
      color: '#2b3a48',
      metalness: 0.35,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.6,
    }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e5e7eb', metalness: 1, roughness: 0.15 }),
    headlight: new THREE.MeshStandardMaterial({ color: '#fffbe6', emissive: '#fff4c2', emissiveIntensity: 0.6 }),
    taillight: new THREE.MeshStandardMaterial({ color: '#7f1d1d', emissive: '#ef4444', emissiveIntensity: 0.5 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75 }),
    metalDark: new THREE.MeshStandardMaterial({ color: '#2b2f36', metalness: 0.7, roughness: 0.4 }),
    white: new THREE.MeshStandardMaterial({ color: '#f5f5f4', roughness: 0.6 }),
    stone: new THREE.MeshStandardMaterial({ color: '#d6d0c4', map: plasterTexture(), roughness: 0.85 }),
    hedge: new THREE.MeshStandardMaterial({ color: '#3d6b2c', roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: '#5b4030', roughness: 1 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a8', emissiveIntensity: 1.2 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#4aa3c7',
      metalness: 0.1,
      roughness: 0.05,
      // no `transmission`: it makes three.js draw the whole town a second time every frame
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.5,
      clearcoat: 1,
    }),
    lineWhite: new THREE.MeshStandardMaterial({ color: '#f1f1ee', roughness: 0.7 }),
    lineYellow: new THREE.MeshStandardMaterial({ color: '#e8b923', roughness: 0.7 }),
    curb: new THREE.MeshStandardMaterial({ color: '#9a978f', roughness: 0.9 }),
  }
  // At night: windows glow warm, street lamps and headlights light up.
  mats.glass.emissive = new THREE.Color('#ffc978')
  followNight(mats.glass, 'emissiveIntensity', 0, 0)
  followNight(mats.lamp, 'emissiveIntensity', 6, 0.3)
  followNight(mats.headlight, 'emissiveIntensity', 3, 0.5)
  return mats
}

const wallCache = new Map()

/** Plaster wall material tinted to a house style color. */
export function wallMaterial(color) {
  if (!wallCache.has(color)) {
    wallCache.set(color, new THREE.MeshStandardMaterial({ color, map: plasterTexture(), roughness: 0.9 }))
  }
  return wallCache.get(color)
}

const plainCache = new Map()

export function plainMaterial(color, { roughness = 0.7, metalness = 0 } = {}) {
  const key = `${color}:${roughness}:${metalness}`
  if (!plainCache.has(key)) plainCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }))
  return plainCache.get(key)
}

const paintCache = new Map()

export function carPaint(color) {
  if (!paintCache.has(color)) {
    const matte = MATTE_COLORS.includes(color)
    paintCache.set(
      color,
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: matte ? 0.2 : 0.65,
        roughness: matte ? 0.55 : 0.22,
        clearcoat: matte ? 0.05 : 1,
        clearcoatRoughness: 0.03,
        // pearl white gets a soft sheen
        sheen: color === '#f8fafc' ? 0.6 : 0,
        sheenColor: new THREE.Color('#fdf2f8'),
        sheenRoughness: 0.4,
        envMapIntensity: matte ? 0.6 : 1.5,
      }),
    )
  }
  return paintCache.get(color)
}

const paneCache = new Map()

/** A lit room seen through a window at night (people, TV glow, lamps…). Invisible by day. */
export function nightPane(variant) {
  if (!paneCache.has(variant)) {
    const mat = new THREE.MeshBasicMaterial({ map: nightWindowTexture(variant), transparent: true, depthWrite: false, toneMapped: false })
    followNight(mat, 'opacity', 1, 0)
    paneCache.set(variant, mat)
  }
  return paneCache.get(variant)
}

const glowCache = new Map()

function additive(map, color, max) {
  const mat = new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
  return followNight(mat, 'opacity', max, 0)
}

/** Night glow spilling onto the ground around a building, tinted per building type. */
export function glowPool(color, max = 0.8) {
  const key = `pool:${color}:${max}`
  if (!glowCache.has(key)) glowCache.set(key, additive(lightPoolTexture(), color, max))
  return glowCache.get(key)
}

/** Night light washing up a façade from the ground. */
export function uplight(color, max = 0.7) {
  const key = `up:${color}:${max}`
  if (!glowCache.has(key)) glowCache.set(key, additive(uplightTexture(), color, max))
  return glowCache.get(key)
}

/** Shop window that lights up bright at night. */
export function storefront(color = '#fff1d0') {
  const key = `front:${color}`
  if (!glowCache.has(key)) {
    const mat = getMaterials().glass.clone()
    mat.emissive = new THREE.Color(color)
    glowCache.set(key, followNight(mat, 'emissiveIntensity', 1.6, 0))
  }
  return glowCache.get(key)
}
