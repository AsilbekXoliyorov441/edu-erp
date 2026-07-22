import { useQuery, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

export function useTeacherStore(selector) {
  const token = useAuthStore((s) => s.token)
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)

  const items = (useQuery(api.teachers.list, isSuperAdmin && token ? { token } : 'skip') ?? []).map(mapId)

  const createAction = useAction(api.teachersActions.createTeacher)
  const createEduAdminAction = useAction(api.teachersActions.createEduAdmin)
  const resetPasswordAction = useAction(api.teachersActions.resetTeacherPassword)
  const setSuperAdminAction = useAction(api.teachersActions.setSuperAdmin)

  return selector({
    items,
    create: (username, password, fullName) => createAction({ token, username, password, fullName }),
    createEduAdmin: (username, password, fullName) => createEduAdminAction({ token, username, password, fullName }),
    resetPassword: (teacherId, newPassword) => resetPasswordAction({ token, teacherId, newPassword }),
    setSuperAdmin: (teacherId, isSuperAdmin) => setSuperAdminAction({ token, teacherId, isSuperAdmin }),
  })
}
