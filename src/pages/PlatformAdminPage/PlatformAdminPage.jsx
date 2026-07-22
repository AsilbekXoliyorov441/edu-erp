import { motion } from 'framer-motion'
import { Building2, Users2, GraduationCap, Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Switch } from '@/shared/ui/switch'
import { EmptyState } from '@/shared/ui/empty-state'
import { Meter } from '@/shared/ui/meter'
import { AnimatedNumber } from '@/shared/ui/animated-number'
import { cn } from '@/shared/lib/utils'
import { useCenterStore } from '@/entities/center/model/store'
import { CreateCenterDialog } from '@/features/manage-centers/ui/CreateCenterDialog'
import { CreateDirectorDialog } from '@/features/manage-centers/ui/CreateDirectorDialog'
import { RenewSubscriptionDialog } from '@/features/manage-centers/ui/RenewSubscriptionDialog'

const somFormatter = (n) => `${Math.round(n ?? 0).toLocaleString('uz-UZ')} so'm`
const dateFormatter = (iso) => new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

function StatTile({ icon: Icon, label, value, formatter, index }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tabular-nums text-foreground">
              <AnimatedNumber value={value} formatter={formatter} />
            </p>
            <p className="truncate text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TrendBadge({ percent }) {
  if (percent > 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <TrendingUp className="size-3.5" /> +{Math.round(percent)}%
      </span>
    )
  }
  if (percent < -0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <TrendingDown className="size-3.5" /> {Math.round(percent)}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="size-3.5" /> 0%
    </span>
  )
}

export function PlatformAdminPage() {
  const centers = useCenterStore((s) => s.items)
  const updateStatus = useCenterStore((s) => s.updateStatus)

  const totalStudents = centers.reduce((sum, c) => sum + c.studentCount, 0)
  const totalActiveLast30 = centers.reduce((sum, c) => sum + c.activeLast30, 0)
  const totalMonthlyRevenue = centers.reduce((sum, c) => sum + (c.status === 'active' ? c.subscriptionPrice : 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Platforma SuperAdmin</h2>
          <p className="text-sm text-muted-foreground">O'quv markazlar, obuna va foydalanish statistikasi</p>
        </div>
        <CreateCenterDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} icon={Building2} label="Jami markazlar" value={centers.length} />
        <StatTile index={1} icon={GraduationCap} label="Jami faol o'quvchilar" value={totalStudents} />
        <StatTile index={2} icon={Users2} label="Oxirgi 30 kunda faol" value={totalActiveLast30} />
        <StatTile index={3} icon={Wallet} label="Oylik obuna daromadi" value={totalMonthlyRevenue} formatter={somFormatter} />
      </div>

      {centers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Hali markaz yo'q"
          description="Birinchi o'quv markazni qo'shib, unga direktor tayinlang."
          action={<CreateCenterDialog />}
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-5">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="py-2.5 font-medium">Markaz</th>
                  <th className="py-2.5 font-medium">Direktor</th>
                  <th className="py-2.5 font-medium">O'quvchilar</th>
                  <th className="py-2.5 font-medium">Foydalanish</th>
                  <th className="py-2.5 font-medium">Coin narxi</th>
                  <th className="py-2.5 font-medium">Obuna</th>
                  <th className="py-2.5 font-medium">Faol</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody>
                {centers.map((center, index) => (
                  <motion.tr
                    key={center.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/40 last:border-0 align-top"
                  >
                    <td className="py-3">
                      <p className="font-medium text-foreground">{center.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {center.groupCount} guruh · {center.teacherCount} xodim
                      </p>
                    </td>
                    <td className="py-3">
                      {center.directorFullName ? (
                        <div>
                          <p className="text-foreground">{center.directorFullName}</p>
                          <p className="font-mono text-xs text-muted-foreground">{center.directorUsername}</p>
                        </div>
                      ) : (
                        <CreateDirectorDialog centerId={center.id} centerName={center.name} />
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">{center.studentCount}</td>
                    <td className="py-3">
                      <Meter percent={center.usagePercent} className="w-28" />
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{center.activeLast30} faol / 30 kun</span>
                        <TrendBadge percent={center.trendPercent} />
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{center.coinPriceSom ? `${center.coinPriceSom} so'm` : '—'}</td>
                    <td className="py-3">
                      <p className={cn('text-foreground', center.isExpired && 'text-destructive')}>
                        {somFormatter(center.subscriptionPrice)}
                      </p>
                      <p className={cn('text-xs text-muted-foreground', center.isExpired && 'text-destructive')}>
                        {center.isExpired ? "muddati tugagan: " : 'tugash sanasi: '}
                        {dateFormatter(center.subscriptionEndsAt)}
                      </p>
                      <div className="mt-1">
                        <RenewSubscriptionDialog centerId={center.id} centerName={center.name} currentPrice={center.subscriptionPrice} />
                      </div>
                    </td>
                    <td className="py-3">
                      <Switch
                        checked={center.status === 'active'}
                        onCheckedChange={(next) => updateStatus(center.id, next ? 'active' : 'suspended')}
                      />
                    </td>
                    <td className="py-3">
                      {center.isExpired && <Badge variant="destructive">Muddati tugagan</Badge>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
