import { Navigate, useLocation } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { ROLES, ROUTES } from '@/shared/config/constants'
import { useAuthStore } from '@/entities/session/model/store'

export function RequireAuth({ children }) {
  const role = useAuthStore((s) => s.role)
  const centerActive = useAuthStore((s) => s.centerActive)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()

  if (!role) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />

  if (role !== ROLES.PLATFORM_ADMIN && !centerActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <ShieldOff className="size-10 text-destructive" />
        <div>
          <p className="text-lg font-semibold">Markazingiz faoliyati to'xtatilgan</p>
          <p className="mt-1 text-sm text-muted-foreground">Obuna muddati tugagan yoki markaz bloklangan. Administratorga murojaat qiling.</p>
        </div>
        <button type="button" onClick={logout} className="text-sm font-medium text-primary underline underline-offset-4">
          Chiqish
        </button>
      </div>
    )
  }

  return children
}
