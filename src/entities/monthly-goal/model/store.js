import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useAttendanceStore } from '@/entities/attendance/model/store'
import { useCoinEntryStore } from '@/entities/coin-entry/model/store'
import { mapId } from '@/shared/lib/convex/mapId'
import { computeMonthlyProgress, getMonthKey, isGoalMonth } from '@/shared/lib/stats/monthlyGoal'

/** Frozen results of already-closed months (written by the monthly cron). */
export function useMonthlyGoalResults() {
  const token = useAuthStore((s) => s.token)
  return (useQuery(api.monthlyGoal.listResults, token ? { token } : 'skip') ?? []).map(mapId)
}

/** Live progress for the current month, keyed by studentId. `active` is false before the
 * rule's start month, in which case callers should hide goal UI entirely. */
export function useCurrentMonthGoal() {
  const lessons = useLessonStore((s) => s.items)
  const attendance = useAttendanceStore((s) => s.items)
  const coinEntries = useCoinEntryStore((s) => s.items)
  const monthKey = getMonthKey()

  const progress = useMemo(
    () => computeMonthlyProgress({ monthKey, lessons, attendance, coinEntries }),
    [monthKey, lessons, attendance, coinEntries],
  )

  return { monthKey, active: isGoalMonth(monthKey), progress }
}
