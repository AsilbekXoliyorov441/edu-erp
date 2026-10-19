import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { getIsoWeekKey } from '@/shared/lib/date'

export function getCategoryBreakdown(studentId, coinEntries) {
  const breakdown = Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, 0]))
  coinEntries
    .filter((e) => e.studentId === studentId)
    .forEach((e) => {
      breakdown[e.category] = (breakdown[e.category] ?? 0) + e.value
    })
  return breakdown
}

export function getWeeklyBreakdown(studentId, coinEntries) {
  const byWeek = new Map()
  coinEntries
    .filter((e) => e.studentId === studentId)
    .forEach((e) => {
      const key = getIsoWeekKey(e.givenAt)
      byWeek.set(key, (byWeek.get(key) ?? 0) + e.value)
    })
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, total]) => ({ week, total }))
}
