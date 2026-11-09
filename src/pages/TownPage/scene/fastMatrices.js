import * as THREE from 'three'

/** The city has tens of thousands of objects, and almost all of them never move. Out of the
 * box three.js rebuilds every object's matrix on every frame anyway, and because a rebuilt
 * matrix marks the object as changed, it also re-multiplies the whole tree under it — that
 * was over half of each frame's time.
 *
 * Here an object's matrix is rebuilt only when its position, rotation or scale actually
 * changed since the last frame (checked by comparing ten numbers, far cheaper than the
 * rebuild). Anything that moves — cars, trains, people, growing buildings — still updates
 * exactly as before; nothing else gets recomputed. Installed once, for the town scene. */

let installed = false

export function installFastMatrices() {
  if (installed) return
  installed = true
  const proto = THREE.Object3D.prototype

  proto.updateMatrixWorld = function updateMatrixWorld(force) {
    if (this.matrixAutoUpdate) {
      const p = this.position
      const q = this.quaternion
      const s = this.scale
      const v = this.pivot
      let c = this.__lastTRS
      if (c === undefined) {
        c = new Float64Array(13).fill(NaN)
        this.__lastTRS = c
      }
      const px = v ? v.x : 0
      const py = v ? v.y : 0
      const pz = v ? v.z : 0
      if (
        c[0] !== p.x || c[1] !== p.y || c[2] !== p.z ||
        c[3] !== q.x || c[4] !== q.y || c[5] !== q.z || c[6] !== q.w ||
        c[7] !== s.x || c[8] !== s.y || c[9] !== s.z ||
        c[10] !== px || c[11] !== py || c[12] !== pz
      ) {
        this.updateMatrix()
        c[0] = p.x; c[1] = p.y; c[2] = p.z
        c[3] = q.x; c[4] = q.y; c[5] = q.z; c[6] = q.w
        c[7] = s.x; c[8] = s.y; c[9] = s.z
        c[10] = px; c[11] = py; c[12] = pz
      }
    }

    // moved under another parent: its place in the world changed even if it did not move
    if (this.__lastParent !== this.parent) {
      this.__lastParent = this.parent
      this.matrixWorldNeedsUpdate = true
    }

    if (this.matrixWorldNeedsUpdate || force) {
      if (this.matrixWorldAutoUpdate === true) {
        if (this.parent === null) this.matrixWorld.copy(this.matrix)
        else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)
      }
      this.matrixWorldNeedsUpdate = false
      force = true
    }

    const children = this.children
    for (let i = 0, l = children.length; i < l; i += 1) {
      const child = children[i]
      // hidden parts (the originals of merged buildings, far LOD levels) are skipped until
      // they show again, unless something above them moved
      if (!force && !child.visible && child.__lastTRS !== undefined) continue
      child.updateMatrixWorld(force)
    }
  }
}
