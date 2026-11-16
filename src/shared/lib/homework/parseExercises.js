/** Splits a block of pasted questions (often straight from an AI chat) into numbered
 * exercises. An exercise starts at a line like "1. …", "2) …", "**3.** …", "### 4. …",
 * "5-masala: …" or "Masala 6: …" — but only when its number is the next one expected, so a
 * numbered list *inside* an exercise (it restarts at 1) stays part of that exercise. Text
 * before the first exercise is returned as `intro`. With no numbering at all, blank-line
 * separated paragraphs become the exercises. Markdown bold / heading marks are dropped;
 * code blocks are kept as they are. */

const WORD = '(?:masala|mashq|topshiriq|savol|vazifa|task|exercise|question)'
const MARKERS = [
  // "1. text", "1) text", "**1.** text", "### 1. text"
  new RegExp('^[\\s#>*_]*(\\d{1,2})\\s*[.)]\\**\\s*(?=\\S|$)', 'i'),
  // "1-masala: text", "1 - mashq. text"
  new RegExp(`^[\\s#>*_]*(\\d{1,2})\\s*-?\\s*${WORD}\\b[\\s.:)*_-]*`, 'i'),
  // "Masala 1: text", "Savol №1. text"
  new RegExp(`^[\\s#>*_]*${WORD}\\s*№?\\s*(\\d{1,2})\\b[\\s.:)*_-]*`, 'i'),
]

function markerOf(line) {
  for (const re of MARKERS) {
    const m = line.match(re)
    if (m) return { number: Number(m[1]), rest: line.slice(m[0].length) }
  }
  return null
}

/** Drops markdown emphasis and heading marks outside code blocks. */
function tidy(text) {
  let inCode = false
  return text
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('```')) {
        inCode = !inCode
        return line
      }
      if (inCode) return line
      return line.replace(/^\s*#{1,6}\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/\*\*/g, '')
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function parseExercises(raw) {
  const lines = (raw ?? '').replace(/\r\n?/g, '\n').split('\n')
  const items = []
  const intro = []
  let expected = 1
  let inCode = false
  for (const line of lines) {
    if (line.trim().startsWith('```')) inCode = !inCode
    const m = !inCode && markerOf(line)
    if (m && m.number === expected) {
      items.push([m.rest])
      expected += 1
    } else if (items.length) {
      items[items.length - 1].push(line)
    } else {
      intro.push(line)
    }
  }

  let exercises = items.map((it) => tidy(it.join('\n'))).filter(Boolean)
  let introText = tidy(intro.join('\n'))
  if (exercises.length === 0 && introText) {
    // no numbering: one exercise per paragraph
    exercises = introText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    introText = ''
  }
  return { intro: introText, exercises }
}
