import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

/** Balance and coins-per-month for every student the caller can see, as a Map keyed by
 * studentId. Small (one row per student) — use it instead of the full coin history
 * whenever you only need totals or ranks. */
export function useStudentStats() {
  const token = useAuthStore((s) => s.token)
  const rows = useQuery(api.studentStats.list, token ? { token } : 'skip')
  return useMemo(() => new Map((rows ?? []).map((r) => [r.studentId, r])), [rows])
}
