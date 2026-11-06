/** Weekly tracks a group can follow (see `LESSON_WEEKDAYS` for the weekday numbers). */
export const GROUP_SCHEDULES = [
  { key: 'odd', label: 'Toq kunlar', days: 'Du · Chor · Juma' },
  { key: 'even', label: 'Juft kunlar', days: 'Se · Pay · Shan' },
]

export const GROUP_DIRECTIONS = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'python', label: 'Python' },
  { key: 'ai', label: "Sun'iy intellekt" },
  { key: 'cyber', label: 'Kiberxavfsizlik' },
  { key: 'other', label: 'Boshqa' },
]

export const DEFAULT_GROUP_FORM = {
  name: '',
  schedule: 'odd',
  startTime: '14:00',
  endTime: '16:00',
  direction: 'frontend',
}

export function getScheduleOption(key) {
  return GROUP_SCHEDULES.find((s) => s.key === key) ?? null
}

export function getDirectionOption(key) {
  return GROUP_DIRECTIONS.find((d) => d.key === key) ?? GROUP_DIRECTIONS.at(-1)
}

/** "Juft kunlar · 14:00–16:00", or null when the group has no schedule set yet. */
export function formatGroupSchedule(group) {
  const schedule = getScheduleOption(group?.schedule)
  if (!schedule) return null
  const time = group.startTime && group.endTime ? ` · ${group.startTime}–${group.endTime}` : ''
  return `${schedule.label}${time}`
}

/** Validates the form; returns an error message or null. */
export function validateGroupForm(form) {
  if (!form.name.trim()) return 'Guruh nomini kiriting'
  if (!form.schedule) return 'Dars kunlarini tanlang'
  if (!form.startTime || !form.endTime) return 'Dars vaqtini kiriting'
  if (form.endTime <= form.startTime) return "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak"
  return null
}
