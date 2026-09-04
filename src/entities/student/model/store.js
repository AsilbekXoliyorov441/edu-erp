import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'
import { ROLES } from '@/shared/config/constants'

export function useStudentStore(selector) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)

  const publicItems = useQuery(api.students.list, role === ROLES.STUDENT && token ? { token } : 'skip')
  const teacherItems = useQuery(api.students.listForTeacher, role === ROLES.TEACHER && token ? { token } : 'skip')
  const items = (teacherItems ?? publicItems ?? []).map(mapId)

  const createAction = useAction(api.studentsActions.create)
  const updateStatusMutation = useMutation(api.students.updateStatus)
  const transferMutation = useMutation(api.students.transfer)

  return selector({
    items,
    create: (groupId, fullName) => createAction({ token, groupId, fullName }),
    updateStatus: (id, status) => updateStatusMutation({ token, id, status }),
    transfer: (targetGroupId, studentIds, merges) =>
      transferMutation({ token, targetGroupId, studentIds, merges }),
  })
}
