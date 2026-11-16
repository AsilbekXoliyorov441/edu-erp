/** Helpers for writing the course question bank by hand.
 *
 * A question is written as `q(text, right, [wrong, wrong, wrong])` — the right answer first,
 * so it is easy to check — and `build` puts it at a fixed spot picked from the question text,
 * so the right answers are spread over A–D but never move between deploys. `c(...)` is the
 * same for a code question: its whole text is shown as code, the question itself in a comment. */

export const q = (text, right, wrong) => ({ text, right, wrong })
export const c = (text, right, wrong) => ({ text, right, wrong, isCode: true })

function hash(text) {
  let h = 7
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return h
}

function build(item) {
  const at = hash(item.text) % 4
  const options = [...item.wrong]
  options.splice(at, 0, item.right)
  return { text: item.text, options, correctIndex: at, ...(item.isCode ? { isCode: true } : {}) }
}

/** One lesson's test: "5-dars. Ro'yxatlar" (or "JS 5-mavzu. …" — see `javascript.js`). */
export function topic(title, subject, section, items) {
  return { title, subject, section, questions: items.map(build) }
}
