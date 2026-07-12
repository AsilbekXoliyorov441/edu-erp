import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ROUTES } from '@/shared/config/constants'
import { RequireAuth } from '@/app/router/RequireAuth'
import { RequireTeacher } from '@/app/router/RequireTeacher'
import { RequireSuperAdmin } from '@/app/router/RequireSuperAdmin'
import { RequireStudent } from '@/app/router/RequireStudent'
import { HomeRoute } from '@/app/router/HomeRoute'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage/LoginPage'
import { GroupsPage } from '@/pages/GroupsPage/GroupsPage'
import { GroupDetailPage } from '@/pages/GroupDetailPage/GroupDetailPage'
import { StudentProfilePage } from '@/pages/StudentProfilePage/StudentProfilePage'
import { CoinMarketPage } from '@/pages/CoinMarketPage/CoinMarketPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage/LeaderboardPage'
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage'
import { TeachersDashboardPage } from '@/pages/TeachersDashboardPage/TeachersDashboardPage'
import { TeachersManagementPage } from '@/pages/TeachersManagementPage/TeachersManagementPage'
import { LessonTestsPage } from '@/pages/LessonTestsPage/LessonTestsPage'
import { TestsPage } from '@/pages/TestsPage/TestsPage'
import { TakeTestPage } from '@/pages/TakeTestPage/TakeTestPage'
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage'

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
          <Route
            path="darslar/:lessonId/testlar"
            element={
              <RequireTeacher>
                <LessonTestsPage />
              </RequireTeacher>
            }
          />
          <Route
            path="testlar"
            element={
              <RequireStudent>
                <TestsPage />
              </RequireStudent>
            }
          />
          <Route
            path="testlar/:lessonId"
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
