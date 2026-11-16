import { HTML } from './html'
import { CSS } from './css'
import { JAVASCRIPT } from './javascript'
import { PYTHON } from './python'

/** The whole course question bank, in teaching order: HTML (lessons 1–10), CSS (11–30),
 * JavaScript (topics 1–24), Python (lessons 1–24). Every topic is
 * `{ title, subject, section, questions: [{ text, options, correctIndex, isCode? }] }`. */
export const CURRICULUM = [...HTML, ...CSS, ...JAVASCRIPT, ...PYTHON]
