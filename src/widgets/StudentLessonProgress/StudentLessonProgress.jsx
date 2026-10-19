import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { CalendarDays, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { ChartTooltip } from '@/shared/ui/chart-tooltip'
import { EmptyState } from '@/shared/ui/empty-state'
import { getLessonProgress, getStudentLessonScores } from '@/shared/lib/stats'
import { LESSON_MAX_COINS } from '@/shared/lib/stats/monthlyGoal'
import { formatUzDate } from '@/shared/lib/date'

export function StudentLessonProgress({ studentId, group, lessons, coinEntries }) {
  const progress = getLessonProgress(group, lessons)
  const scores = getStudentLessonScores(studentId, group, lessons, coinEntries).map((point) => ({
    ...point,
    label: `${point.lessonNumber}-dars`,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-primary" /> Darslik progressi
        </CardTitle>
        <CardDescription>Har darsda olingan coin, dars maksimumiga nisbatan foizda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {progress.totalLessons === 0 ? (
          <EmptyState icon={BookOpen} title="Ma'lumot yo'q" description="Hali dars o'tkazilmagan." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Jami darslar</p>
                <p className="mt-1 text-lg font-bold text-foreground">{progress.totalLessons}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" /> Oxirgi dars
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {progress.lastLessonDate ? formatUzDate(progress.lastLessonDate) : "Hali yo'q"}
                </p>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scores} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    width={44}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    allowDataOverflow
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(v) => `${Math.round(v)}% (${Math.round((v / 100) * LESSON_MAX_COINS)}/${LESSON_MAX_COINS} coin)`}
                      />
                    }
                    cursor={{ stroke: 'var(--border)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percent"
                    name="Natija"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Har bir nuqta shu darsda olingan coinni ko'rsatadi: 0% — 0 coin, 100% — dars maksimumi ({LESSON_MAX_COINS} coin)
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
