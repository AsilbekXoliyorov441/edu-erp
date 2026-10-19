import { Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Moon, Sun, LogOut } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useThemeStore } from '@/shared/lib/store/themeStore'
import { useBreadcrumbStore } from '@/shared/lib/store/breadcrumbStore'
import { useAuthStore } from '@/entities/session/model/store'
import { getInitials } from '@/entities/student/lib/getInitials'
import { ROLES, ROUTES, TENANT_ROLES } from '@/shared/config/constants'

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: 'Bosh sahifa',
  [ROUTES.PLATFORM_ADMIN]: 'Markazlar',
  [ROUTES.GROUPS]: 'Guruhlar',
  [ROUTES.COIN_MARKET]: 'Coin Market',
  [ROUTES.LEADERBOARD]: 'Reyting',
  [ROUTES.SETTINGS]: 'Sozlamalar',
  [ROUTES.TESTS]: 'Testlar',
  [ROUTES.GAMES]: "O'yinlar",
}

const TENANT_ROLE_LABELS = {
  [TENANT_ROLES.DIRECTOR]: 'Direktor',
  [TENANT_ROLES.EDU_ADMIN]: 'EduSuperAdmin',
  [TENANT_ROLES.TEACHER]: "O'qituvchi",
}

function resolveTitle(pathname) {
  if (pathname.startsWith('/guruhlar/')) return 'Guruh'
  if (pathname.startsWith('/oquvchi/')) return "O'quvchi profili"
  if (pathname.endsWith('/yechish')) return 'Test topshirish'
  if (pathname.startsWith('/testlar/')) return 'Mavzu'
  if (pathname.startsWith('/oyinlar/')) return "Jonli o'yin"
  return PAGE_TITLES[pathname] ?? 'Coin System'
}

/** Breadcrumb items as `{ label, to? }`. Group detail pages link back to "Guruhlar" and append
 * whatever trail the page pushed (group name, grading session); every other page is one crumb. */
function resolveCrumbs(pathname, trail) {
  if (pathname.startsWith('/guruhlar/')) {
    return [{ label: 'Guruhlar', to: ROUTES.GROUPS }, ...(trail?.length ? trail : ['Guruh']).map((label) => ({ label }))]
  }
  return [{ label: resolveTitle(pathname) }]
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const trail = useBreadcrumbStore((s) => s.trail)
  const role = useAuthStore((s) => s.role)
  const tenantRole = useAuthStore((s) => s.tenantRole)
  const fullName = useAuthStore((s) => s.fullName)
  const logout = useAuthStore((s) => s.logout)
  const centerName = useAuthStore((s) => s.centerName)

  const roleLabel =
    role === ROLES.PLATFORM_ADMIN
      ? 'Platforma SuperAdmin'
      : role === ROLES.STUDENT
        ? "O'quvchi"
        : (TENANT_ROLE_LABELS[tenantRole] ?? "O'qituvchi")

  const crumbs = resolveCrumbs(location.pathname, trail)

  return (
    <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 border-b border-[var(--cs-border)] bg-[var(--cs-surface)] px-4 py-[10px] sm:px-6 lg:px-[28px]">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-[8px] text-[14px] text-[var(--cs-muted)]">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            return (
              <Fragment key={`${index}-${crumb.label}`}>
                {index > 0 && (
                  <li aria-hidden="true" className="flex shrink-0">
                    <ChevronRight size={16} />
                  </li>
                )}
                <li className={isLast ? 'min-w-0 truncate font-bold text-[var(--cs-text)]' : 'shrink-0'}>
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to} className="cs-focus rounded-[4px] hover:text-[var(--cs-text)]">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-[8px]">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Mavzuni almashtirish"
          className="cs-focus flex size-[40px] cursor-pointer items-center justify-center rounded-[10px] border border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-3)] transition-colors hover:bg-[var(--cs-hover)]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cs-focus flex h-[40px] cursor-pointer items-center gap-[8px] rounded-full border border-[var(--cs-border)] bg-[var(--cs-surface)] pr-[14px] pl-[5px] transition-colors hover:bg-[var(--cs-hover)]"
            >
              <span className="flex size-[30px] items-center justify-center rounded-full bg-[var(--cs-avatar-bg)] text-[12px] font-extrabold text-[var(--cs-avatar-text)]">
                {getInitials(fullName) || '?'}
              </span>
              <span className="hidden text-[14px] font-semibold text-[var(--cs-text)] sm:inline">{fullName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col gap-1.5">
              <span className="text-foreground">{fullName}</span>
              <Badge variant={role === ROLES.STUDENT ? 'secondary' : 'default'} className="w-fit">
                {roleLabel}
              </Badge>
              {centerName && <span className="text-xs font-normal text-muted-foreground">{centerName}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate(ROUTES.LOGIN, { replace: true })
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
