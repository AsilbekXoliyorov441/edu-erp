import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useAuthStore } from '@/entities/session/model/store'
import { NAV_ITEMS } from '@/widgets/Sidebar/navItems'

function LogoMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

export function Sidebar() {
  const role = useAuthStore((s) => s.role)
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role) && (!item.superAdminOnly || isSuperAdmin))

  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col gap-[24px] border-r border-[var(--cs-border)] bg-[var(--cs-surface)] px-[14px] py-[20px] lg:flex">
      <div className="flex items-center gap-[12px] px-[8px] py-[4px]">
        <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--cs-accent)] text-white">
          <LogoMark />
        </div>
        <div>
          <p className="text-[15px] leading-tight font-bold text-[var(--cs-text)]">Coin System</p>
          <p className="text-[12.5px] text-[var(--cs-muted)]">PDP Frontend</p>
        </div>
      </div>

      <nav className="flex flex-col gap-[2px]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'cs-focus flex h-[44px] items-center gap-[12px] rounded-[10px] px-[12px] text-[14.5px] transition-colors',
                isActive
                  ? 'bg-[var(--cs-accent-soft)] font-bold text-[var(--cs-accent-dark)]'
                  : 'font-medium text-[var(--cs-text-3)] hover:bg-[var(--cs-hover)]',
              )
            }
          >
            <item.icon size={18} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-[8px] text-[12px] text-[var(--cs-muted)]">© {new Date().getFullYear()} Coin System</div>
    </aside>
  )
}
