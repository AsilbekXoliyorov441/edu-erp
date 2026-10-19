import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/widgets/Sidebar/Sidebar'
import { MobileNav } from '@/widgets/Sidebar/MobileNav'
import { Header } from '@/widgets/Header/Header'
import { PageTransition } from '@/app/layout/PageTransition'
import { LiveGameBanner } from '@/widgets/LiveGameBanner/LiveGameBanner'
import { SilentBoundary } from '@/shared/ui/silent-boundary'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-[28px] lg:pb-[24px] lg:pt-[24px]">
            <SilentBoundary>
              <LiveGameBanner />
            </SilentBoundary>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
