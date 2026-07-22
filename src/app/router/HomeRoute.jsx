import { Navigate } from 'react-router-dom'
import { ROLES, ROUTES } from '@/shared/config/constants'
import { useAuthStore } from '@/entities/session/model/store'
import { DashboardPage } from '@/pages/DashboardPage/DashboardPage'

export function HomeRoute() {
  const role = useAuthStore((s) => s.role)
  if (role === ROLES.PLATFORM_ADMIN) return <Navigate to={ROUTES.PLATFORM_ADMIN} replace />
  if (role === ROLES.STUDENT) return <Navigate to={ROUTES.LEADERBOARD} replace />
  return <DashboardPage />
}
