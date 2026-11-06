import * as THREE from 'three'
import { LAMP_COLS, LAMP_ROWS, LAMP_SPACING } from '@/shared/config/town'
import { LAMP_ARM, LAMP_HEAD_Y, streetLamps } from '@/pages/TownPage/scene/lightSources'

/** Street-lamp lighting for the whole town, done in the shader.
 *
 * The town has a few hundred lamps — far too many for three.js point lights. Instead every
 * lit material gets a small extra term: the light of the lamps near the pixel, with the
 * same falloff a real point light has (intensity 520, cut off at 55 m). Lamps are fixed, so
 * their positions are baked into the shader; rows along the streets are looked up directly
 * (only the 5 nearest lamps of each nearby row are checked), the few others are looped.
 *
 * `lampUniform.value` is the night amount; the town canvas sets it right before it renders
 * and puts it back to 0 after, so other canvases (previews) are never lit by street lamps. */

export const lampUniform = { value: 0 }

const INTENSITY = 520
const CUTOFF = 55
const COLOR = new THREE.Color('#ffc477')

const f = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n))

function buildGlsl() {
  // rows along X: head z, head y, first lamp x, number of lamps
  const rows = LAMP_ROWS.map((r) => `vec4(${f(r.z + r.dir * LAMP_ARM)}, ${f(LAMP_HEAD_Y)}, ${f(r.start)}, ${f(r.count)})`)
  // columns along Z: head x, head y, first lamp z, number of lamps
  const cols = LAMP_COLS.map((c) => `vec4(${f(c.x + c.dir * LAMP_ARM)}, ${f(LAMP_HEAD_Y)}, ${f(c.start)}, ${f(c.count)})`)
  // everything that isn't on a regular row
  const misc = streetLamps().filter((l) => !l.row)
  const miscList = misc.map((l) => `vec3(${f(l.hx)}, ${f(l.hy)}, ${f(l.hz)})`)
  return /* glsl */ `
const vec4 LAMP_ROW[${rows.length}] = vec4[](${rows.join(', ')});
const vec4 LAMP_COL[${cols.length}] = vec4[](${cols.join(', ')});
const vec3 LAMP_MISC[${miscList.length}] = vec3[](${miscList.join(', ')});
const vec3 LAMP_COLOR = vec3(${f(COLOR.r)}, ${f(COLOR.g)}, ${f(COLOR.b)});

float lampOne(vec3 p, vec3 n, vec3 L) {
  vec3 d = L - p;
  float dist2 = dot(d, d);
  if (dist2 > ${f(CUTOFF * CUTOFF)}) return 0.0;
  float dist = sqrt(dist2);
  float ndl = max(dot(n, d / max(dist, 0.001)), 0.0);
  float r = dist / ${f(CUTOFF)};
  float win = clamp(1.0 - r * r * r * r, 0.0, 1.0);
  return ndl * win * win / max(dist2, 0.01);
}

vec3 lampLight(vec3 p, vec3 n) {
  float sum = 0.0;
  for (int r = 0; r < ${rows.length}; r++) {
    vec4 row = LAMP_ROW[r];
    if (abs(p.z - row.x) > ${f(CUTOFF)}) continue;
    if (p.x < row.z - ${f(CUTOFF)} || p.x > row.z + (row.w - 1.0) * ${f(LAMP_SPACING)} + ${f(CUTOFF)}) continue;
    float kc = floor((p.x - row.z) / ${f(LAMP_SPACING)} + 0.5);
    for (int j = -2; j <= 2; j++) {
      float k = kc + float(j);
      if (k < 0.0 || k > row.w - 1.0) continue;
      sum += lampOne(p, n, vec3(row.z + k * ${f(LAMP_SPACING)}, row.y, row.x));
    }
  }
  for (int c = 0; c < ${cols.length}; c++) {
    vec4 col = LAMP_COL[c];
    if (abs(p.x - col.x) > ${f(CUTOFF)}) continue;
    if (p.z < col.z - ${f(CUTOFF)} || p.z > col.z + (col.w - 1.0) * ${f(LAMP_SPACING)} + ${f(CUTOFF)}) continue;
    float kc = floor((p.z - col.z) / ${f(LAMP_SPACING)} + 0.5);
    for (int j = -2; j <= 2; j++) {
      float k = kc + float(j);
      if (k < 0.0 || k > col.w - 1.0) continue;
      sum += lampOne(p, n, vec3(col.x, col.y, col.z + k * ${f(LAMP_SPACING)}));
    }
  }
  for (int i = 0; i < ${miscList.length}; i++) {
    vec3 L = LAMP_MISC[i];
    if (abs(p.x - L.x) > ${f(CUTOFF)} || abs(p.z - L.z) > ${f(CUTOFF)}) continue;
    sum += lampOne(p, n, L);
  }
  return LAMP_COLOR * (sum * ${f(INTENSITY)});
}
`
}

const VERTEX = /* glsl */ `
#include <project_vertex>
vec4 lampW = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  lampW = batchingMatrix * lampW;
#endif
#ifdef USE_INSTANCING
  lampW = instanceMatrix * lampW;
#endif
vLampWorld = ( modelMatrix * lampW ).xyz;
`

const FRAGMENT = /* glsl */ `
#include <lights_fragment_end>
if ( uLampNight > 0.001 ) {
  vec3 lampIrr = uLampNight * lampLight( vLampWorld, inverseTransformDirection( normal, viewMatrix ) );
  reflectedLight.directDiffuse += lampIrr * BRDF_Lambert( material.diffuseColor );
  #ifdef STANDARD
    reflectedLight.directSpecular += lampIrr * material.specularColorBlended * 0.2;
  #endif
}
`

let installed = false

/** Patch every lit material (standard, physical, lambert, phong, toon) once. Materials
 * with their own `onBeforeCompile` keep theirs and simply get no lamp light. */
export function installLampShader() {
  if (installed) return
  installed = true
  const glsl = buildGlsl()
  const proto = THREE.Material.prototype
  const previous = proto.onBeforeCompile
  proto.onBeforeCompile = function onBeforeCompile(shader, renderer) {
    previous.call(this, shader, renderer)
    if (!shader.fragmentShader.includes('#include <lights_fragment_end>')) return
    if (!shader.vertexShader.includes('#include <project_vertex>')) return
    shader.uniforms.uLampNight = lampUniform
    shader.vertexShader = `varying vec3 vLampWorld;\n${shader.vertexShader.replace('#include <project_vertex>', VERTEX)}`
    shader.fragmentShader = `uniform float uLampNight;\nvarying vec3 vLampWorld;\n${glsl}\n${shader.fragmentShader.replace('#include <lights_fragment_end>', FRAGMENT)}`
  }
}

const noop = () => {}

/** Light this scene with the lamps (night amount from `getNight`) while it renders. Returns
 * a cleanup function. */
export function attachLamps(scene, getNight) {
  scene.onBeforeRender = () => {
    lampUniform.value = getNight()
  }
  scene.onAfterRender = () => {
    lampUniform.value = 0
  }
  return () => {
    scene.onBeforeRender = noop
    scene.onAfterRender = noop
  }
}
