import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ROLES, ROUTES } from '@/shared/config/constants'
import { useAuthStore } from '@/entities/session/model/store'

export function RequirePlatformAdmin({ children }) {
  const role = useAuthStore((s) => s.role)

  useEffect(() => {
    if (role !== ROLES.PLATFORM_ADMIN) {
      toast.error('Bu sahifa faqat platforma SuperAdmin uchun mavjud')
    }
  }, [role])

  if (role !== ROLES.PLATFORM_ADMIN) return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}
