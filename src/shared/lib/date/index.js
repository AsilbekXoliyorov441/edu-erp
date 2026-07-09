import { LESSONS_PER_MONTH } from '@/shared/config/constants'

const UZ_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
]

const UZ_WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

export function formatUzDate(isoString, { withTime = false } = {}) {
  const date = new Date(isoString)
  const base = `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
  if (!withTime) return base
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${base} ${hh}:${mm}`
}

export function formatUzWeekday(isoString) {
  return UZ_WEEKDAYS[new Date(isoString).getDay()]
}

export function formatRelativeUz(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'hozirgina'
  if (minutes < 60) return `${minutes} daqiqa oldin`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} kun oldin`
  return formatUzDate(isoString)
}

/** 12 lessons = 1 "oy" (month), shared across dashboard and student-profile stats. */
export function getMonthFromLessonNumber(lessonNumber) {
  return Math.ceil(lessonNumber / LESSONS_PER_MONTH)
}

export function getMonthLabel(monthIndex) {
  return `${monthIndex}-oy`
}

/** Real calendar month name (e.g. "Iyul"), for stats scoped to the actual current month. */
export function getCurrentCalendarMonthLabel() {
  return UZ_MONTHS[new Date().getMonth()]
}

export function formatUzMonthYear(year, monthIndex0) {
  return `${UZ_MONTHS[monthIndex0]} ${year}`
}

export function getIsoWeekKey(isoString) {
  const date = new Date(isoString)
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
