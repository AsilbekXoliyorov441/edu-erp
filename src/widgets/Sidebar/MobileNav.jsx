import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAuthStore } from '@/entities/session/model/store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { NAV_ITEMS } from '@/widgets/Sidebar/navItems'

/** Bottom bar fits at most this many tabs before the rest collapse into "Yana" — keeps
 * icons legible instead of squeezing everything (e.g. once "Testlar" joined the teacher
 * nav, 7 items were being crammed into one unreadable row). */
const MAX_VISIBLE = 4

function isItemActive(pathname, item) {
  if (item.to === '/') return pathname === '/'
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function NavTab({ item, isActive }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className="flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-muted-foreground transition-colors"
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl transition-colors',
          isActive ? 'bg-secondary text-primary' : 'text-muted-foreground',
        )}
      >
        <item.icon className="size-5 shrink-0" />
      </span>
      <span className={cn('max-w-full truncate text-[10px] font-medium leading-tight', isActive ? 'text-primary' : 'text-muted-foreground')}>
        {item.label}
      </span>
    </NavLink>
  )
}

export function MobileNav() {
  const role = useAuthStore((s) => s.role)
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)
  const { pathname } = useLocation()

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role) && (!item.superAdminOnly || isSuperAdmin))
  const sorted = [...items].sort((a, b) => (a.mobilePriority ?? Infinity) - (b.mobilePriority ?? Infinity))
  const overflowing = items.length > MAX_VISIBLE
  const visible = overflowing ? sorted.slice(0, MAX_VISIBLE) : sorted
  const rest = overflowing ? sorted.slice(MAX_VISIBLE) : []
  const isRestActive = rest.some((item) => isItemActive(pathname, item))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border/60 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Asosiy navigatsiya"
    >
      {visible.map((item) => (
        <NavTab key={item.to} item={item} isActive={isItemActive(pathname, item)} />
      ))}

      {rest.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex flex-1 flex-col items-center gap-1 px-1 py-2.5" aria-label="Yana">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl transition-colors',
                  isRestActive ? 'bg-secondary text-primary' : 'text-muted-foreground',
                )}
              >
                <MoreHorizontal className="size-5 shrink-0" />
              </span>
              <span className={cn('text-[10px] font-medium leading-tight', isRestActive ? 'text-primary' : 'text-muted-foreground')}>
                Yana
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={10} className="min-w-44">
            {rest.map((item) => {
              const isActive = isItemActive(pathname, item)
              return (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink to={item.to} className={cn('gap-2.5', isActive && 'bg-secondary text-primary')}>
                    <item.icon className="size-4" />
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  )
}
