import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider } from 'convex/react'
import { Coins } from 'lucide-react'
import { useAuthStore } from '@/entities/session/model/store'
import { useThemeStore } from '@/shared/lib/store/themeStore'
import { convexClient } from '@/shared/lib/convex/client'
import { Toaster } from '@/shared/ui/sonner'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { AppRouter } from '@/app/router/AppRouter'

function SplashScreen() {
  const hydrateError = useAuthStore((s) => s.hydrateError)
  const retry = useAuthStore((s) => s.hydrate)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-gradient bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div
          className={`flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-hover text-primary-foreground shadow-lg ${hydrateError ? '' : 'animate-pulse'}`}
        >
          <Coins className="size-7" />
        </div>
        {hydrateError ? (
          <>
            <p className="font-semibold text-foreground">Serverga ulanib bo'lmadi</p>
            <p className="text-sm text-muted-foreground">Internet aloqasini tekshiring va qayta urinib ko'ring.</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Qayta urinish
              </button>
              <button
                type="button"
                onClick={() => {
                  logout()
                  useAuthStore.setState({ hydrated: true, hydrateError: false })
                }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
              >
                Qayta kirish
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        )}
      </div>
    </div>
  )
}

const App = () => {
  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrateAuth = useAuthStore((s) => s.hydrate)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    setTheme(theme)
    hydrateAuth()
    // Runs once on mount: applies the persisted theme and validates any stored session
    // token against the backend (entity data itself is loaded reactively per-page via
    // Convex's useQuery, so there's nothing else to hydrate up front).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ConvexProvider client={convexClient}>
      {!hydrated ? (
        <SplashScreen />
      ) : (
        <BrowserRouter>
          <TooltipProvider delayDuration={200}>
            <AppRouter />
            <Toaster theme={theme} />
          </TooltipProvider>
        </BrowserRouter>
      )}
    </ConvexProvider>
  )
}

export default App
