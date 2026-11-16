/** Answer options in a different order for every run, so a student can't learn "it's B" by
 * heart. The order comes from a seed (e.g. `${attemptId}:${index}`), so it is the same on every
 * read of that question and needs no storage. `order[shown] = stored index`. */

function hash(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function optionOrder(seed, count) {
  const order = Array.from({ length: count }, (_, i) => i)
  let h = hash(seed)
  for (let i = count - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
    const j = h % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/** The options as the student sees them. */
export function shuffledOptions(options, seed) {
  return optionOrder(seed, options.length).map((i) => options[i])
}

/** The stored index of the option the student picked (`shown` -1 = no answer stays -1). */
export function storedIndex(shown, seed, count) {
  return shown < 0 ? shown : (optionOrder(seed, count)[shown] ?? -1)
}

/** Where the stored correct answer appears for the student. */
export function shownIndex(stored, seed, count) {
  return optionOrder(seed, count).indexOf(stored)
}
