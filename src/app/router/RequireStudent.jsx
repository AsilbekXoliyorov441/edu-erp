import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ROLES, ROUTES } from '@/shared/config/constants'
import { useAuthStore } from '@/entities/session/model/store'

export function RequireStudent({ children }) {
  const role = useAuthStore((s) => s.role)

  useEffect(() => {
    if (role === ROLES.TEACHER) {
      toast.error("Bu sahifa faqat o'quvchi uchun mavjud")
    }
  }, [role])

  if (role !== ROLES.STUDENT) return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}
