import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts'
import { BarChart3, Trophy, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ChartTooltip } from '@/shared/ui/chart-tooltip'
import { ChartLegend } from '@/shared/ui/chart-legend'
import { EmptyState } from '@/shared/ui/empty-state'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useCoinEntryStore } from '@/entities/coin-entry/model/store'
import { getCoinTrend, getGroupComparison, getCategoryDistribution, getLeaderboardByPeriod } from '@/shared/lib/stats'
import { getMonthKey } from '@/shared/lib/stats/monthlyGoal'
import { formatMonthKey } from '@/shared/lib/date'

const CATEGORY_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

function FilterBar({ groups, groupId, setGroupId, monthOptions, month, setMonth }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={groupId} onValueChange={setGroupId}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Guruh" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha guruhlar</SelectItem>
          {groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Oy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha oylar</SelectItem>
          {monthOptions.map((m) => (
            <SelectItem key={m} value={m}>
              {formatMonthKey(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function AnalyticsCharts() {
  const groups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const lessons = useLessonStore((s) => s.items)
  const coinEntries = useCoinEntryStore((s) => s.items)

  const [groupId, setGroupId] = useState('all')
  // Calendar months (Tashkent time); the dashboard opens on the current month so old
  // lessons don't crowd the charts.
  const currentMonth = getMonthKey()
  const [month, setMonth] = useState(currentMonth)

  const monthOptions = useMemo(
    () => [...new Set([currentMonth, ...lessons.map((l) => getMonthKey(l.date))])].sort().reverse(),
    [lessons, currentMonth],
  )

  const scopedGroupId = groupId === 'all' ? undefined : groupId
  const scopedMonth = month === 'all' ? undefined : month

  // Lessons of the chosen period (all groups) — for comparing groups.
  const periodLessons = useMemo(
    () => (scopedMonth ? lessons.filter((l) => getMonthKey(l.date) === scopedMonth) : lessons),
    [lessons, scopedMonth],
  )
  // …narrowed to the chosen group — for every other chart.
  const scopedLessons = useMemo(
    () => (scopedGroupId ? periodLessons.filter((l) => l.groupId === scopedGroupId) : periodLessons),
    [periodLessons, scopedGroupId],
  )
  const scopedEntries = useMemo(() => {
    const ids = new Set(scopedLessons.map((l) => l.id))
    return coinEntries.filter((e) => ids.has(e.lessonId))
  }, [coinEntries, scopedLessons])

  const trend = useMemo(
    () => getCoinTrend(scopedLessons, scopedEntries, { perLesson: !!scopedGroupId }),
    [scopedLessons, scopedEntries, scopedGroupId],
  )

  const leaderboard = useMemo(
    () => getLeaderboardByPeriod(students, scopedEntries, scopedLessons, { groupId: scopedGroupId }).slice(0, 8),
    [students, scopedEntries, scopedLessons, scopedGroupId],
  )

  const categoryDistribution = useMemo(() => getCategoryDistribution(scopedEntries), [scopedEntries])

  const groupComparison = useMemo(() => {
    const ids = new Set(periodLessons.map((l) => l.id))
    return getGroupComparison(
      groups,
      coinEntries.filter((e) => ids.has(e.lessonId)),
      periodLessons,
    )
  }, [groups, coinEntries, periodLessons])

  const periodLabel = scopedMonth ? formatMonthKey(scopedMonth) : 'Barcha oylar'

  return (
    <div className="space-y-4">
      <FilterBar
        groups={groups}
        groupId={groupId}
        setGroupId={setGroupId}
        monthOptions={monthOptions}
        month={month}
        setMonth={setMonth}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChartIcon className="size-4 text-primary" /> Coinlar dinamikasi
            </CardTitle>
            <CardDescription>
              {periodLabel} · {scopedGroupId ? "har bir dars bo'yicha" : "kunlar bo'yicha (barcha guruhlar)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {trend.length === 0 ? (
              <EmptyState icon={LineChartIcon} title="Ma'lumot yo'q" description="Bu filtr bo'yicha darslar topilmadi." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                    width={32}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} coin`} />} cursor={{ stroke: 'var(--border)' }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Coinlar"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-coin-foreground dark:text-coin" /> Top o'quvchilar
            </CardTitle>
            <CardDescription>{periodLabel} · eng ko'p coin yig'ganlar</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {leaderboard.length === 0 ? (
              <EmptyState icon={Trophy} title="Ma'lumot yo'q" description="Bu filtr bo'yicha o'quvchilar topilmadi." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leaderboard.map((e) => ({ id: e.student.id, name: e.student.fullName.split(' ')[0], total: e.total }))}
                  layout="vertical"
                  margin={{ top: 4, right: 28, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={72}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} coin`} />} cursor={{ fill: 'var(--accent)' }} />
                  <Bar dataKey="total" name="Coinlar" radius={[0, 6, 6, 0]} barSize={16}>
                    {leaderboard.map((entry, index) => (
                      <Cell key={entry.student.id} fill={index < 3 ? 'var(--coin)' : 'var(--primary)'} />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="right"
                      style={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="size-4 text-primary" /> Kategoriya bo'yicha taqsimot
            </CardTitle>
            <CardDescription>{periodLabel} · {categoryDistribution.map((c) => c.label).join(' / ')}</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {categoryDistribution.every((c) => c.total === 0) ? (
              <EmptyState
                icon={PieChartIcon}
                title="Ma'lumot yo'q"
                description="Bu filtr bo'yicha coin yozuvlari topilmadi."
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="total"
                      nameKey="label"
                      innerRadius="58%"
                      outerRadius="88%"
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="var(--card)"
                      strokeWidth={2}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={entry.key} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v} coin`} />} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartLegend
                  items={categoryDistribution.map((c, index) => ({
                    label: `${c.label} (${c.total})`,
                    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" /> Guruhlar taqqoslanishi
            </CardTitle>
            <CardDescription>{periodLabel} · har bir guruhda berilgan coinlar</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {groupComparison.every((g) => g.total === 0) ? (
              <EmptyState icon={BarChart3} title="Ma'lumot yo'q" description="Bu davrda guruhlarga coin berilmagan." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupComparison} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="groupName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    width={32}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} coin`} />} cursor={{ fill: 'var(--accent)' }} />
                  <Bar dataKey="total" name="Coinlar" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
