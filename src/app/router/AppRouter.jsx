import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ROUTES } from '@/shared/config/constants'
import { RequireAuth } from '@/app/router/RequireAuth'
import { RequireTeacher } from '@/app/router/RequireTeacher'
import { RequireSuperAdmin } from '@/app/router/RequireSuperAdmin'
import { RequirePlatformAdmin } from '@/app/router/RequirePlatformAdmin'
import { RequireStudent } from '@/app/router/RequireStudent'
import { HomeRoute } from '@/app/router/HomeRoute'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage/LoginPage'
import { PlatformAdminPage } from '@/pages/PlatformAdminPage/PlatformAdminPage'
import { GroupsPage } from '@/pages/GroupsPage/GroupsPage'
import { GroupDetailPage } from '@/pages/GroupDetailPage/GroupDetailPage'
import { StudentProfilePage } from '@/pages/StudentProfilePage/StudentProfilePage'
import { CoinMarketPage } from '@/pages/CoinMarketPage/CoinMarketPage'
import { OrdersPage } from '@/pages/OrdersPage/OrdersPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage/LeaderboardPage'
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage'
import { TeachersDashboardPage } from '@/pages/TeachersDashboardPage/TeachersDashboardPage'
import { TeachersManagementPage } from '@/pages/TeachersManagementPage/TeachersManagementPage'
import { TestsPage } from '@/pages/TestsPage/TestsPage'
import { TestDetailPage } from '@/pages/TestDetailPage/TestDetailPage'
import { TakeTestPage } from '@/pages/TakeTestPage/TakeTestPage'
import { GamesPage } from '@/pages/GamesPage/GamesPage'
import { GamePage } from '@/pages/GamePage/GamePage'
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage'

// The 3D town pulls in three.js — load it only when someone opens it.
const TownPage = lazy(() => import('@/pages/TownPage/TownPage'))

export function AppRouter() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<HomeRoute />} />
          <Route
            path="platforma"
            element={
              <RequirePlatformAdmin>
                <PlatformAdminPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="guruhlar"
            element={
              <RequireTeacher>
                <GroupsPage />
              </RequireTeacher>
            }
          />
          <Route
            path="guruhlar/:groupId"
            element={
              <RequireTeacher>
                <GroupDetailPage />
              </RequireTeacher>
            }
          />
          <Route path="oquvchi/:studentId" element={<StudentProfilePage />} />
          <Route path="coin-market" element={<CoinMarketPage />} />
          <Route path="buyurtmalar" element={<OrdersPage />} />
          <Route path="reyting" element={<LeaderboardPage />} />
          <Route
            path="sozlamalar"
            element={
              <RequireTeacher>
                <SettingsPage />
              </RequireTeacher>
            }
          />
          <Route
            path="teachers-dashboard"
            element={
              <RequireTeacher>
                <TeachersDashboardPage />
              </RequireTeacher>
            }
          />
          <Route
            path="ustozlar"
            element={
              <RequireSuperAdmin>
                <TeachersManagementPage />
              </RequireSuperAdmin>
            }
          />
          <Route path="testlar" element={<TestsPage />} />
          <Route path="oyinlar" element={<GamesPage />} />
          <Route
            path="oyinlar/shaharcha"
            element={
              <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Shaharcha yuklanmoqda…</div>}>
                <TownPage />
              </Suspense>
            }
          />
          <Route path="oyinlar/:gameId" element={<GamePage />} />
          <Route
            path="testlar/:testId"
            element={
              <RequireTeacher>
                <TestDetailPage />
              </RequireTeacher>
            }
          />
          <Route
            path="testlar/:testId/yechish"
            element={
              <RequireStudent>
                <TakeTestPage />
              </RequireStudent>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}
