import { Link } from 'react-router-dom'
import { ArrowRight, Users2 } from 'lucide-react'
import { StatsOverview } from '@/widgets/StatsOverview/StatsOverview'
import { AnalyticsCharts } from '@/widgets/AnalyticsCharts/AnalyticsCharts'
import { MonthlyGoalOverview } from '@/widgets/MonthlyGoal/MonthlyGoalOverview'
import { Card, CardContent } from '@/shared/ui/card'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { ROUTES, STUDENT_STATUS } from '@/shared/config/constants'

export function DashboardPage() {
  const groups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)

  return (
    <div className="space-y-6">
      <StatsOverview />
      <MonthlyGoalOverview />
      <AnalyticsCharts />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Tezkor havolalar</h2>
          <Link to={ROUTES.GROUPS} className="flex items-center gap-1 text-sm text-primary hover:underline">
            Barchasi <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {groups.map((group) => (
            <Link key={group.id} to={ROUTES.groupDetail(group.id)}>
              <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Users2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {students.filter((s) => s.groupId === group.id && s.status === STUDENT_STATUS.ACTIVE).length} o'quvchi
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
