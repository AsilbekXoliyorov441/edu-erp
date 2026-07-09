import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Scale, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { AnimatedNumber } from '@/shared/ui/animated-number'
import { ChartTooltip } from '@/shared/ui/chart-tooltip'
import { ChartLegend } from '@/shared/ui/chart-legend'
import { EmptyState } from '@/shared/ui/empty-state'
import { cn } from '@/shared/lib/utils'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { getFinanceOverview, getFinanceTrend } from '@/shared/lib/stats'
import { COIN_TO_SOM_RATE } from '@/shared/config/constants'

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Kunlik' },
  { value: 'week', label: 'Haftalik' },
  { value: 'month', label: 'Oylik' },
]

const GIVEN_COLOR = 'var(--chart-1)'
const SPENT_COLOR = 'var(--chart-2)'

const somFormatter = (n) => `${Math.round(n).toLocaleString('uz-UZ')} so'm`
const formatCoin = (n) => `${Math.round(n).toLocaleString('uz-UZ')} coin`
const compactSomTick = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)

function MoneyCard({ icon: Icon, label, value, hint, accent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -3 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', accent)}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tabular-nums text-foreground">
              <AnimatedNumber value={value} formatter={somFormatter} />
            </p>
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const PERIOD_ROWS = [
  { key: 'today', label: 'Bugun' },
  { key: 'thisWeek', label: 'Bu hafta' },
  { key: 'thisMonth', label: 'Bu oy' },
  { key: 'total', label: 'Jami' },
]

export function TeachersDashboardPage() {
  const transactions = useTransactionStore((s) => s.items)
  const finance = getFinanceOverview(transactions, COIN_TO_SOM_RATE)

  const [granularity, setGranularity] = useState('day')
  const trendData = getFinanceTrend(transactions, COIN_TO_SOM_RATE, granularity)
  const hasTrendData = trendData.length > 0

  const periodChartData = PERIOD_ROWS.map((row) => ({
    label: row.label,
    given: finance.moneyGiven[row.key],
    spent: finance.moneySpent[row.key],
  }))
  const hasPeriodData = periodChartData.some((row) => row.given > 0 || row.spent > 0)

  const splitChartData = [
    { key: 'outstanding', label: 'Sarflanmagan (majburiyat)', value: finance.outstandingMoney, color: GIVEN_COLOR },
    { key: 'spent', label: "Sarflangan (sovg'aga)", value: finance.moneySpent.total, color: SPENT_COLOR },
  ]
  const hasSplitData = finance.moneyGiven.total > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Teachers Dashboard</h2>
          <p className="text-sm text-muted-foreground">Coinlarning pul qiymati va sovg'alarga sarflangan xarajatlar</p>
        </div>
        <Badge variant="coin">1 coin = {finance.rate} so'm</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MoneyCard
          index={0}
          icon={TrendingUp}
          label="Jami tarqatilgan qiymat"
          value={finance.moneyGiven.total}
          hint={formatCoin(finance.coinsGiven.total)}
          accent="bg-success/15 text-success"
        />
        <MoneyCard
          index={1}
          icon={TrendingDown}
          label="Jami sarflangan pul"
          value={finance.moneySpent.total}
          hint={`${formatCoin(finance.coinsRedeemed.total)} sovg'aga almashtirildi`}
          accent="bg-destructive/15 text-destructive"
        />
        <MoneyCard
          index={2}
          icon={Scale}
          label="Joriy majburiyat (hali sarflanmagan)"
          value={finance.outstandingMoney}
          hint="O'quvchilarda qolgan coinlar qiymati"
          accent="bg-coin/15 text-coin-foreground dark:text-coin"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChartIcon className="size-4 text-primary" /> Coinlar dinamikasi
            </CardTitle>
            <CardDescription>Tarqatilgan qiymat va sarflangan pul vaqt bo'yicha</CardDescription>
          </div>
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRANULARITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="h-72 pt-0">
          {!hasTrendData ? (
            <EmptyState icon={LineChartIcon} title="Ma'lumot yo'q" description="Hali coin berilmagan yoki sovg'a almashtirilmagan." />
          ) : (
            <div className="flex h-full flex-col gap-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                    tickFormatter={compactSomTick}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v) => somFormatter(v)} />} cursor={{ stroke: 'var(--border)' }} />
                  <Line
                    type="monotone"
                    dataKey="given"
                    name="Tarqatilgan qiymat"
                    stroke={GIVEN_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: GIVEN_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    name="Sarflangan pul"
                    stroke={SPENT_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: SPENT_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <ChartLegend
                items={[
                  { label: 'Tarqatilgan qiymat', color: GIVEN_COLOR },
                  { label: 'Sarflangan pul', color: SPENT_COLOR },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" /> Davrlar bo'yicha taqqoslash
            </CardTitle>
            <CardDescription>Tarqatilgan qiymat va sarflangan pul, davrlar kesimida</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {!hasPeriodData ? (
              <EmptyState icon={BarChart3} title="Ma'lumot yo'q" description="Hali coin berilmagan yoki sovg'a almashtirilmagan." />
            ) : (
              <div className="flex h-full flex-col gap-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                      tickFormatter={compactSomTick}
                      width={40}
                    />
                    <Tooltip content={<ChartTooltip formatter={(v) => somFormatter(v)} />} cursor={{ fill: 'var(--accent)' }} />
                    <Bar dataKey="given" name="Tarqatilgan qiymat" fill={GIVEN_COLOR} radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="spent" name="Sarflangan pul" fill={SPENT_COLOR} radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
                <ChartLegend
                  items={[
                    { label: 'Tarqatilgan qiymat', color: GIVEN_COLOR },
                    { label: 'Sarflangan pul', color: SPENT_COLOR },
                  ]}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="size-4 text-primary" /> Sarflangan va sarflanmagan nisbati
            </CardTitle>
            <CardDescription>Tarqatilgan qiymatning qancha qismi sovg'aga ketgani</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {!hasSplitData ? (
              <EmptyState icon={PieChartIcon} title="Ma'lumot yo'q" description="Hali o'quvchilarga coin berilmagan." />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={splitChartData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="58%"
                      outerRadius="88%"
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="var(--card)"
                      strokeWidth={2}
                    >
                      {splitChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v) => somFormatter(v)} />} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartLegend
                  items={splitChartData.map((entry) => ({
                    label: `${entry.label} (${somFormatter(entry.value)})`,
                    color: entry.color,
                  }))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batafsil jadval</CardTitle>
          <CardDescription>Yuqoridagi grafiklarning aniq raqamlari</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-lg text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="py-2.5 font-medium">Davr</th>
                  <th className="py-2.5 font-medium">Tarqatilgan coinlar qiymati</th>
                  <th className="py-2.5 font-medium">Sovg'aga sarflangan pul</th>
                </tr>
              </thead>
              <tbody>
                {PERIOD_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-border/40 last:border-0">
                    <td className="py-3 font-medium text-foreground">{row.label}</td>
                    <td className="py-3">
                      <p className="text-foreground">{somFormatter(finance.moneyGiven[row.key])}</p>
                      <p className="text-xs text-muted-foreground">{formatCoin(finance.coinsGiven[row.key])}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-foreground">{somFormatter(finance.moneySpent[row.key])}</p>
                      <p className="text-xs text-muted-foreground">{formatCoin(finance.coinsRedeemed[row.key])}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
