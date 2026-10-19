import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'
import { BarChart3, Radar as RadarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { ChartTooltip } from '@/shared/ui/chart-tooltip'
import { EmptyState } from '@/shared/ui/empty-state'
import { COIN_CATEGORY_LIST, MONTHLY_GOAL } from '@/shared/config/constants'
import { getWeeklyBreakdown, getCategoryBreakdown } from '@/shared/lib/stats'
import { LESSON_MAX_COINS, getStudentMonthlyHistory } from '@/shared/lib/stats/monthlyGoal'
import { formatMonthKey } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'

function MonthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const m = payload[0].payload
  return (
    <div className="glass-panel min-w-[12rem] rounded-xl px-3.5 py-2.5 text-sm shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{m.label}</p>
      <div className="space-y-1 tabular-nums">
        <p className="flex justify-between gap-4">
          <span className="text-muted-foreground">Yig'ildi</span>
          <span className="font-semibold text-foreground">
            {m.earned} / {m.possible} coin
          </span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-muted-foreground">Darslar</span>
          <span className="font-semibold text-foreground">
            {m.totalLessons} ta × {LESSON_MAX_COINS}
          </span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-muted-foreground">Natija</span>
          <span
            className={cn(
              'font-semibold',
              m.reached
                ? 'text-blue-600 dark:text-blue-400'
                : m.halfReached
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400',
            )}
          >
            {Math.round(m.percent)}% — {m.reached ? 'hammasi saqlanadi' : m.halfReached ? 'yarmi saqlanadi' : 'kuyadi'}
          </span>
        </p>
      </div>
    </div>
  )
}

export function StudentCharts({ studentId, coinEntries, lessons, attendance }) {
  const weekly = getWeeklyBreakdown(studentId, coinEntries).slice(-8)
  const monthly = getStudentMonthlyHistory(studentId, { lessons, attendance, coinEntries }).map((m) => ({
    ...m,
    label: formatMonthKey(m.monthKey),
  }))
  const category = getCategoryBreakdown(studentId, coinEntries)
  const categoryData = COIN_CATEGORY_LIST.map((c) => ({ label: c.label, value: category[c.key] }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Oylik progress</CardTitle>
          <CardDescription>
            Kalendar oylari bo'yicha: yig'ilgan coin, oylik jami (haftasiga 3 dars × {LESSON_MAX_COINS}) va {MONTHLY_GOAL.PERCENT}% maqsad
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 pt-0">
          {monthly.length === 0 ? (
            <EmptyState icon={BarChart3} title="Ma'lumot yo'q" description="Hali dars yozuvlari mavjud emas." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  width={36}
                />
                <Tooltip content={<MonthTooltip />} cursor={{ fill: 'var(--accent)' }} />
                <Bar dataKey="possible" name="Oylik jami" fill="#e5e7eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="earned" name="Yig'ildi" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Line
                  dataKey="goalCoins"
                  name={`Maqsad (${MONTHLY_GOAL.PERCENT}%)`}
                  stroke="#ef4444"
                  strokeDasharray="5 4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategoriya profili</CardTitle>
          <CardDescription>Yo'nalishlar bo'yicha kuchli tomonlar</CardDescription>
        </CardHeader>
        <CardContent className="h-64 pt-0">
          {categoryData.every((c) => c.value === 0) ? (
            <EmptyState icon={RadarIcon} title="Ma'lumot yo'q" description="Hali baholanmagan." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={categoryData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Radar
                  dataKey="value"
                  name="Coinlar"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} coin`} />} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Haftalik progress</CardTitle>
          <CardDescription>So'nggi haftalar bo'yicha faollik</CardDescription>
        </CardHeader>
        <CardContent className="h-56 pt-0">
          {weekly.length === 0 ? (
            <EmptyState icon={BarChart3} title="Ma'lumot yo'q" description="Hali haftalik ma'lumot mavjud emas." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  width={32}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} coin`} />} cursor={{ fill: 'var(--accent)' }} />
                <Bar dataKey="total" name="Coinlar" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
