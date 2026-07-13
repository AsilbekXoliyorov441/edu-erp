import { LayoutDashboard, Users, Store, Trophy, Settings2, Wallet, ShieldCheck, ListChecks } from 'lucide-react'
import { ROLES, ROUTES } from '@/shared/config/constants'

/** `mobilePriority` (lower = shown first) picks the bottom-nav order on mobile independent
 * of the sidebar order above — items without it collapse into the "Yana" overflow menu once
 * more than `MAX_VISIBLE` items apply to the current role (see MobileNav). */
export const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Bosh sahifa', icon: LayoutDashboard, roles: [ROLES.TEACHER], mobilePriority: 1 },
  { to: ROUTES.GROUPS, label: 'Guruhlar', icon: Users, roles: [ROLES.TEACHER], mobilePriority: 2 },
  { to: ROUTES.TESTS, label: 'Testlar', icon: ListChecks, roles: [ROLES.TEACHER, ROLES.STUDENT], mobilePriority: 3 },
  { to: ROUTES.COIN_MARKET, label: 'Coin Market', icon: Store, roles: [ROLES.TEACHER, ROLES.STUDENT], mobilePriority: 4 },
  { to: ROUTES.LEADERBOARD, label: 'Reyting', icon: Trophy, roles: [ROLES.TEACHER, ROLES.STUDENT], mobilePriority: 5 },
  { to: ROUTES.TEACHERS_DASHBOARD, label: 'Teachers Dashboard', icon: Wallet, roles: [ROLES.TEACHER] },
  { to: ROUTES.TEACHERS_MANAGEMENT, label: 'Ustozlarni boshqarish', icon: ShieldCheck, roles: [ROLES.TEACHER], superAdminOnly: true },
  { to: ROUTES.SETTINGS, label: 'Sozlamalar', icon: Settings2, roles: [ROLES.TEACHER] },
]
