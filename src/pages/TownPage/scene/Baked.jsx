import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Turns a static group of many small meshes into a few big ones — one per material — so it
 * costs a few draw calls instead of hundreds. Children render normally first (so grow
 * animations play); `delay` ms later they are merged and hidden. Whenever `bakeKey` changes
 * the originals come back, animate, and get merged again. Instanced meshes, multi-material
 * meshes and anything under an object with `userData.live` are left alone. */
export function Baked({ bakeKey, delay = 1800, children }) {
  const root = useRef(null)
  const [merged, setMerged] = useState(null)

  useEffect(() => {
    const hidden = []
    let meshes = []
    let id = 0
    const bake = () => {
      const group = root.current
      if (!group) return
      // wait for grow animations to finish (on a slow computer they take longer)
      let growing = false
      group.traverse((o) => {
        if (o.userData?.growing) growing = true
      })
      if (growing) {
        id = setTimeout(bake, 400)
        return
      }
      group.updateWorldMatrix(true, true)
      const inverse = group.matrixWorld.clone().invert()
      const buckets = new Map()
      const visit = (o) => {
        if (o.userData?.live || !o.visible) return
        if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.geometry?.attributes?.position) {
          const key = `${o.material.uuid}:${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`
          let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
          for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
          if (!g.attributes.normal) g.computeVertexNormals()
          if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
          g.clearGroups()
          g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld))
          if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, receive: o.receiveShadow, geos: [] })
          buckets.get(key).geos.push(g)
          hidden.push(o)
          return
        }
        for (const c of o.children) visit(c)
      }
      for (const c of group.children) visit(c)
      meshes = []
      for (const b of buckets.values()) {
        const geo = mergeGeometries(b.geos, false)
        for (const g of b.geos) g.dispose()
        if (!geo) continue
        const mesh = new THREE.Mesh(geo, b.material)
        mesh.castShadow = b.cast
        mesh.receiveShadow = b.receive
        meshes.push(mesh)
      }
      for (const o of hidden) o.visible = false
      setMerged(meshes)
    }
    id = setTimeout(bake, delay)
    return () => {
      clearTimeout(id)
      for (const o of hidden) o.visible = true
      for (const m of meshes) m.geometry.dispose()
      setMerged(null)
    }
  }, [bakeKey, delay])

  return (
    <>
      <group ref={root}>{children}</group>
      {merged && merged.map((mesh) => <primitive key={mesh.uuid} object={mesh} />)}
    </>
  )
}
