import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
import { TownScene } from '@/pages/TownPage/scene/TownScene'
import { TOWN_PLOTS, BUILDING_KINDS } from '@/shared/config/town'

// capture renderer + scene + camera for measurement: a probe mesh tells us on render
const origUMW = THREE.Scene.prototype.updateMatrixWorld
THREE.Scene.prototype.updateMatrixWorld = function (force) {
  if (!this.userData.__hooked && this.children.length > 20) {
    this.userData.__hooked = true
    window.__scene = this
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -999, 0, 0, -999, 0, 0, -999, 0], 3))
    const probe = new THREE.Mesh(g, new THREE.MeshBasicMaterial())
    probe.frustumCulled = false
    probe.userData.probe = true
    probe.onBeforeRender = (renderer, scene, camera) => {
      if (camera.isPerspectiveCamera) { window.__gl = renderer; window.__camera = camera }
    }
    this.add(probe)
  }
  return origUMW.call(this, force)
}

const params = new URLSearchParams(location.search)
const quality = params.get('q') || 'medium'
const nOwned = Number(params.get('owned') ?? 120)
const kinds = Object.keys(BUILDING_KINDS)
const free = TOWN_PLOTS.filter((p) => !p.public)
const players = Array.from({ length: 30 }, (_, i) => ({ id: 'p' + i, nickname: 'u' + i, color: '#3b82f6', car: i % 2 ? { model: ['sedan','suv','supercar','electric'][i % 4], color: '#ef4444' } : null, taxiTrips: 0, learnCorrect: 0 }))
const plots = free.slice(0, nOwned).map((p, i) => {
  const kind = kinds[i % kinds.length]
  const k = BUILDING_KINDS[kind]
  return { plotId: p.id, ownerId: 'p' + (i % 30), ownerName: 'u', ownerColor: '#3b82f6', floors: Math.min(k.maxFloors, k.step * (1 + (i % 4))), style: 0, kind, design: k.designs[i % k.designs.length].id, builtAt: null, lastCollectAt: null, salePrice: null }
})
window.__ready = false
createRoot(document.getElementById('root')).render(
  <div style={{ width: '100vw', height: '100vh' }}>
    <TownScene town={{ players, plots, me: null }} quality={quality} onReady={() => (window.__ready = true)} />
  </div>,
)
