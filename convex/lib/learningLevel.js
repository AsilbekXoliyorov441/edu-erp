/** Which topics fit a group's level — pure helpers shared by the town's question picker.
 *
 * A group is placed by two facts the app already has: its direction (frontend / python …)
 * and how far it has got (the highest lesson number held so far). A topic is in reach when
 *  - the teacher assigned it to the group (always — the teacher knows best), or
 *  - its title names a lesson ("5-dars", "10-darsgacha") the group has reached, or
 *  - it has no lesson number and its subject is unlocked at the group's lesson
 *    (e.g. JavaScript only after the HTML/CSS stage). */

export const DIRECTION_LABEL = {
  frontend: 'Frontend',
  python: 'Python',
  ai: 'Sun\'iy intellekt',
  cyber: 'Kiberxavfsizlik',
  other: 'Umumiy',
}

/** Subject → the direction it belongs to. */
const SUBJECT_DIRECTION = {
  frontend: 'frontend',
  html: 'frontend',
  css: 'frontend',
  html_css: 'frontend',
  javascript: 'frontend',
  react: 'frontend',
  python: 'python',
}

/** The lesson from which a subject without lesson numbers is fair game. */
const SUBJECT_UNLOCK_LESSON = {
  html: 1,
  frontend: 1,
  css: 4,
  html_css: 6,
  javascript: 30,
  react: 60,
  python: 1,
  other: 1,
}

export function inferSubject(title = '') {
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

export function subjectOf(test) {
  return test.subject && test.subject !== 'other' ? test.subject : inferSubject(test.title)
}

/** "1-dars", "10-darsgacha" → 1, 10 */
export function lessonNumberOf(title = '') {
  const m = /(\d+)\s*-?\s*dars/i.exec(title)
  return m ? Number(m[1]) : null
}

export function groupDirection(group) {
  if (group?.direction && group.direction !== 'other') return group.direction
  const name = (group?.name ?? '').toLowerCase()
  if (/python|\bpy/.test(name)) return 'python'
  if (/front|^f[-\s:]?\d|html|web/.test(name)) return 'frontend'
  return 'other'
}

/** Is this (unassigned) topic within the group's reach? */
export function topicFitsLevel({ subject, lesson }, direction, currentLesson) {
  const dir = SUBJECT_DIRECTION[subject]
  if (direction !== 'other' && dir && dir !== direction) return false
  if (direction !== 'other' && !dir && subject !== 'other') return false
  if (lesson !== null) return lesson <= Math.max(1, currentLesson)
  return (SUBJECT_UNLOCK_LESSON[subject] ?? 1) <= Math.max(1, currentLesson)
}
