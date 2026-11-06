/** Sets how far the camera sees. */
export function setCameraFar(camera, far) {
  camera.far = far
  camera.updateProjectionMatrix()
}

/** Sets how close to the camera things are still drawn (small indoors, so walls a step away
 * don't get cut off). */
export function setCameraNear(camera, near) {
  camera.near = near
  camera.updateProjectionMatrix()
}

/** Getting the whole city ready before play, so nothing hitches later:
 *  - every texture is uploaded to the GPU,
 *  - every shader is compiled — including the ones of objects that only appear up close or
 *    far away (LOD levels), which would otherwise compile the first time you fly there,
 *  - and some time is left for buildings to be merged (<Baked>).
 * Calls `onDone` when finished. Returns a cancel function. */
export function warmUpScene(gl, scene, camera, onDone, minMs = 3500) {
  let cancelled = false
  const start = performance.now()
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const run = async () => {
    await wait(300) // let everything mount
    if (cancelled) return
    const textures = new Set()
    const lodLevels = []
    scene.traverse((o) => {
      if (o.isLOD) for (const l of o.levels) lodLevels.push([l.object, l.object.visible])
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []
      for (const m of mats) {
        for (const key of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'aoMap']) {
          if (m[key]) textures.add(m[key])
        }
      }
    })
    for (const t of textures) gl.initTexture(t)
    // show every LOD level while compiling; the next frame puts them back
    for (const [obj] of lodLevels) obj.visible = true
    try {
      if (gl.compileAsync) await gl.compileAsync(scene, camera)
      else gl.compile(scene, camera)
    } catch {
      gl.compile(scene, camera)
    }
    for (const [obj, visible] of lodLevels) obj.visible = visible
    await wait(Math.max(0, minMs - (performance.now() - start)))
    if (!cancelled) onDone()
  }
  run()
  return () => {
    cancelled = true
  }
}
