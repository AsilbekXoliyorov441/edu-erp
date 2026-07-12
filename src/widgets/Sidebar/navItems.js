import { LayoutDashboard, Users, Store, Trophy, Settings2, Wallet, ShieldCheck, ListChecks } from 'lucide-react'
import { ROLES, ROUTES } from '@/shared/config/constants'

export const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Bosh sahifa', icon: LayoutDashboard, roles: [ROLES.TEACHER] },
  { to: ROUTES.GROUPS, label: 'Guruhlar', icon: Users, roles: [ROLES.TEACHER] },
  { to: ROUTES.COIN_MARKET, label: 'Coin Market', icon: Store, roles: [ROLES.TEACHER, ROLES.STUDENT] },
  { to: ROUTES.LEADERBOARD, label: 'Reyting', icon: Trophy, roles: [ROLES.TEACHER, ROLES.STUDENT] },
  { to: ROUTES.TESTS, label: 'Testlar', icon: ListChecks, roles: [ROLES.STUDENT] },
  { to: ROUTES.TEACHERS_DASHBOARD, label: 'Teachers Dashboard', icon: Wallet, roles: [ROLES.TEACHER] },
  { to: ROUTES.TEACHERS_MANAGEMENT, label: 'Ustozlarni boshqarish', icon: ShieldCheck, roles: [ROLES.TEACHER], superAdminOnly: true },
  { to: ROUTES.SETTINGS, label: 'Sozlamalar', icon: Settings2, roles: [ROLES.TEACHER] },
]
