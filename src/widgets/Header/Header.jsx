import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, LogOut, User } from 'lucide-react'
import { Button } from '@/shared/ui/button'
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
import { useAuthStore } from '@/entities/session/model/store'
import { ROLES, ROUTES } from '@/shared/config/constants'

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: 'Bosh sahifa',
  [ROUTES.GROUPS]: 'Guruhlar',
  [ROUTES.COIN_MARKET]: 'Coin Market',
  [ROUTES.LEADERBOARD]: 'Reyting',
  [ROUTES.SETTINGS]: 'Sozlamalar',
  [ROUTES.TESTS]: 'Testlar',
}

function resolveTitle(pathname) {
  if (pathname.startsWith('/guruhlar/')) return 'Guruh'
  if (pathname.startsWith('/oquvchi/')) return "O'quvchi profili"
  if (pathname.endsWith('/yechish')) return 'Test topshirish'
  if (pathname.startsWith('/testlar/')) return 'Mavzu'
  return PAGE_TITLES[pathname] ?? 'Coin System'
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const role = useAuthStore((s) => s.role)
  const fullName = useAuthStore((s) => s.fullName)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <AnimatePresence mode="wait">
        <motion.h1
          key={resolveTitle(location.pathname)}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="text-lg font-semibold text-foreground sm:text-xl"
        >
          {resolveTitle(location.pathname)}
        </motion.h1>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="size-4" />
              <span className="hidden sm:inline">{fullName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col gap-1.5">
              <span className="text-foreground">{fullName}</span>
              <Badge variant={role === ROLES.TEACHER ? 'default' : 'secondary'} className="w-fit">
                {role === ROLES.TEACHER ? "O'qituvchi" : "O'quvchi"}
              </Badge>
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
