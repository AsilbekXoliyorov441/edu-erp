import { TEST_SUBJECTS } from '@/shared/config/constants'

const BY_KEY = new Map(TEST_SUBJECTS.map((s) => [s.key, s]))

/** Best guess for topics created before subjects existed, from the title alone. */
export function inferTestSubject(title = '') {
  const t = title.toLowerCase()
  const html = /\bhtml\b|\baria\b|semantik/.test(t)
  const css = /\bcss\b|flexbox|responsive/.test(t)
  if (html && css) return 'html_css'
  if (/frontend|\bweb\b|sayt/.test(t)) return 'frontend'
  if (/python|\bpy\b/.test(t)) return 'python'
  if (/react|jsx/.test(t)) return 'react'
  if (/javascript|\bjs\b|\bdom\b/.test(t)) return 'javascript'
  if (css) return 'css'
  if (html) return 'html'
  return 'other'
}

/** The topic's subject: the one the teacher picked, or a guess from its title. */
export function getTestSubject(test) {
  return BY_KEY.get(test.subject) ?? BY_KEY.get(inferTestSubject(test.title))
}

/** "1-dars", "10-darsgacha" → 1, 10 — so lesson topics sort 1, 2, …, 10 instead of 1, 10, 2. */
function lessonNumberOf(title) {
  const match = /(\d+)\s*-?\s*dars/i.exec(title)
  return match ? Number(match[1]) : null
}

export function compareTests(a, b) {
  const na = lessonNumberOf(a.title)
  const nb = lessonNumberOf(b.title)
  if (na !== null && nb !== null && na !== nb) return na - nb
  if (na !== null && nb === null) return -1
  if (na === null && nb !== null) return 1
  return a.title.localeCompare(b.title, 'uz', { numeric: true })
}

export const DEFAULT_SECTION = 'Umumiy'

/** The topic's inner section inside its subject; topics without one sit in "Umumiy". */
export function getTestSection(test) {
  return test.section?.trim() || DEFAULT_SECTION
}

/** A subject's topics grouped by inner section: named sections in natural order
 * ("1-modul" … "10-modul"), "Umumiy" last; topics inside each sorted like lessons. */
export function groupTestsBySection(tests) {
  const buckets = new Map()
  tests.forEach((test) => {
    const name = getTestSection(test)
    if (!buckets.has(name)) buckets.set(name, [])
    buckets.get(name).push(test)
  })
  return [...buckets.entries()]
    .sort(([a], [b]) => {
      if (a === DEFAULT_SECTION) return 1
      if (b === DEFAULT_SECTION) return -1
      return a.localeCompare(b, 'uz', { numeric: true })
    })
    .map(([name, sectionTests]) => ({ name, tests: sectionTests.sort(compareTests) }))
}

/** Topics grouped into subject sections (in `TEST_SUBJECTS` order), each sorted. */
export function groupTestsBySubject(tests) {
  const buckets = new Map(TEST_SUBJECTS.map((s) => [s.key, []]))
  tests.forEach((test) => buckets.get(getTestSubject(test).key).push(test))
  return TEST_SUBJECTS.map((subject) => ({ subject, tests: buckets.get(subject.key).sort(compareTests) })).filter(
    (section) => section.tests.length > 0,
  )
}
