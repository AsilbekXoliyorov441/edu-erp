/** What graphics hardware is this? Looked up once, from a throw-away WebGL context.
 *
 *  - `software`: no real graphics card — the browser draws 3D on the CPU (SwiftShader,
 *    llvmpipe, "Microsoft Basic Render Driver"…), or refuses a context without a big
 *    performance penalty. Such machines get low quality and no night.
 *  - `tier`: a suggested quality — 'low', 'medium' or 'high'. */
let cached = null

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|gdi generic/i
const INTEGRATED = /intel|mali|adreno|powervr|vivante|videocore|uhd|iris|apple m|apple gpu|radeon\(tm\) graphics|vega \d graphics/i

export function detectGpu() {
  if (cached) return cached
  let renderer = ''
  let software
  try {
    const canvas = document.createElement('canvas')
    // a context that refuses to start if it would be slow (software) tells us directly
    const strict = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) || canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    const gl = strict || document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')
    if (!gl) {
      software = true
    } else {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '')
      software = !strict || SOFTWARE.test(renderer)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    software = true
  }
  const tier = software ? 'low' : INTEGRATED.test(renderer) ? 'medium' : 'high'
  cached = { software, renderer, tier }
  return cached
}
