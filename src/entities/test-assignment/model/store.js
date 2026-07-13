import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** Teacher-side: which of their own groups a topic is attached to, with attach/detach —
 * backs the topic's "Guruhlar" tab (the "mavzuni guruhga ulash" step). */
export function useGroupAssignmentsForTest(testId) {
  const token = useAuthStore((s) => s.token)
  const groupIds = useQuery(api.testAssignments.listGroupIdsForTest, token && testId ? { token, testId } : 'skip') ?? []
  const assignMutation = useMutation(api.testAssignments.assign)
  const unassignMutation = useMutation(api.testAssignments.unassign)

  return {
    groupIds,
    assign: (groupId) => assignMutation({ token, testId, groupId }),
    unassign: (groupId) => unassignMutation({ token, testId, groupId }),
  }
}

/** Teacher-side: every topic attached to one group — the group detail page's read-only
 * "Testlar" tab. */
export function useTestsForGroup(groupId) {
  const token = useAuthStore((s) => s.token)
  return (useQuery(api.testAssignments.listForGroup, token && groupId ? { token, groupId } : 'skip') ?? []).map(mapId)
}

/** Student-side: every topic attached to the caller's own group. */
export function useMyAssignedTests() {
  const token = useAuthStore((s) => s.token)
  return (useQuery(api.testAssignments.listForMyGroup, token ? { token } : 'skip') ?? []).map(mapId)
}
