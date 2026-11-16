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

/** "Javoblar:" / "Yechimlar:" on its own line: everything after it are the answers. */
const ANSWERS_HEADING = /^[\s#>*_]*(?:javoblar|yechimlar|answers|solutions)\s*[:.]?[\s*_]*$/i
/** "Javob: …" / "Yechim:" inside an exercise: the rest of the exercise is its solution. */
const ANSWER_LINE = /^[\s#>*_-]*(?:to'g'ri\s+)?(?:javob|javobi|yechim|yechimi|answer|solution)\s*[:.\-–]\s*\**\s*/i

/** Numbered blocks of `lines` (see the markers above) plus the text before the first one. */
function numberedBlocks(lines) {
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
  return { items, intro }
}

/** One exercise's lines → its question and (after a "Javob:" line) its solution. */
function splitAnswer(itemLines) {
  let inCode = false
  for (let i = 0; i < itemLines.length; i += 1) {
    const line = itemLines[i]
    if (line.trim().startsWith('```')) inCode = !inCode
    if (!inCode && ANSWER_LINE.test(line)) {
      const first = line.replace(ANSWER_LINE, '')
      return { text: tidy(itemLines.slice(0, i).join('\n')), solution: tidy([first, ...itemLines.slice(i + 1)].join('\n')) }
    }
  }
  return { text: tidy(itemLines.join('\n')), solution: '' }
}

/** Splits pasted questions — with their answers, if given — into exercises
 * `{ text, solution }`. Answers can follow each question ("Javob: …", "Yechim:") or come
 * as a separate numbered "Javoblar:" section at the end. */
export function parseExercises(raw) {
  const lines = (raw ?? '').replace(/\r\n?/g, '\n').split('\n')
  const cut = lines.findIndex((l) => ANSWERS_HEADING.test(l))
  const questionLines = cut >= 0 ? lines.slice(0, cut) : lines
  const { items, intro } = numberedBlocks(questionLines)

  let exercises = items.map(splitAnswer).filter((e) => e.text)
  let introText = tidy(intro.join('\n'))
  if (exercises.length === 0 && introText) {
    // no numbering: one exercise per paragraph
    exercises = introText
      .split(/\n\s*\n/)
      .map((p) => splitAnswer(p.split('\n')))
      .filter((e) => e.text)
    introText = ''
  }

  if (cut >= 0) {
    // a separate answers section, matched to the questions by number
    const answers = numberedBlocks(lines.slice(cut + 1)).items.map((it) => tidy(it.join('\n')))
    exercises = exercises.map((e, i) => ({ ...e, solution: e.solution || answers[i] || '' }))
  }
  return { intro: introText, exercises }
}
