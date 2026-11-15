import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Clock3, Coins, Landmark, ShieldCheck, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { useDecideClaim, useTownClaims } from '@/entities/town/model/store'
import { formatMoney } from '@/shared/config/town'
import { formatUzDate } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'

const STATUS = {
  pending: { label: "Ko'rib chiqilmoqda", tone: 'warning', icon: Clock3 },
  approved: { label: "To'landi", tone: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rad etildi', tone: 'destructive', icon: XCircle },
}

function Tile({ icon: Icon, label, value, tone, hint }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function DecideDialog({ claim, approve, trigger }) {
  const decide = useDecideClaim()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await decide(claim._id, approve, note)
      toast.success(approve ? `${formatMoney(claim.amount)} to'landi` : "Da'vo rad etildi")
      setOpen(false)
    } catch (err) {
      toast.error(err.data ?? 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setNote('') }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{approve ? "Sug'urtani to'lash" : "Da'voni rad etish"}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1.5 text-sm">
              <p>
                <b className="text-foreground">@{claim.nickname}</b>
                {claim.ownerName ? ` (${claim.ownerName})` : ''} — {claim.label}
              </p>
              <p>
                Sug'urta qiymati {formatMoney(claim.insuredValue)}, sotilgan narx {formatMoney(claim.salePrice)} (@{claim.buyerName}).
              </p>
              {approve ? (
                <p>
                  O'quvchiga <b className="text-foreground">{formatMoney(claim.amount)}</b> o'tkaziladi. Fond yetmasa, farqini shaharcha qoplaydi.
                </p>
              ) : (
                <p>Pul to'lanmaydi, o'quvchiga sababi bilan xabar boradi.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={`note-${claim._id}`}>Izoh (ixtiyoriy)</Label>
          <Textarea
            id={`note-${claim._id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder={approve ? "Masalan: bozor narxidan past sotilgan" : "Masalan: do'stiga ataylab arzon sotilgan"}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Bekor qilish
          </Button>
          <Button variant={approve ? 'default' : 'destructive'} onClick={submit} disabled={busy}>
            {approve ? "Ha, to'lash" : 'Rad etish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClaimCard({ claim }) {
  const st = STATUS[claim.status]
  const lossPct = claim.insuredValue ? Math.round((claim.amount / claim.insuredValue) * 100) : 0
  return (
    <Card className={cn(claim.status === 'pending' && 'border-l-4 border-l-warning')}>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{claim.label}</p>
            <Badge variant={st.tone}>
              <st.icon className="size-3" /> {st.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Egasi <b className="text-foreground">@{claim.nickname}</b>
            {claim.ownerName ? ` (${claim.ownerName})` : ''} → xaridor <b className="text-foreground">@{claim.buyerName}</b> •{' '}
            {formatUzDate(claim.createdAt, { withTime: true })}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Sug'urta qiymati: <b className="tabular-nums text-foreground">{formatMoney(claim.insuredValue)}</b></span>
            <span>Sotilgan: <b className="tabular-nums text-foreground">{formatMoney(claim.salePrice)}</b></span>
            <span>
              Zarar: <b className="tabular-nums text-destructive">{formatMoney(claim.amount)}</b> ({lossPct}%)
            </span>
          </div>
          {lossPct >= 50 && claim.status === 'pending' && (
            <p className="text-xs font-medium text-warning">
              ⚠️ Juda arzon sotilgan — do'stiga ataylab sotib, sug'urtadan pul olishga urinish bo'lishi mumkin.
            </p>
          )}
          {claim.status !== 'pending' && (
            <p className="text-xs text-muted-foreground">
              {claim.decidedByName ?? 'Admin'} • {claim.decidedAt ? formatUzDate(claim.decidedAt, { withTime: true }) : ''}
              {claim.note ? ` — ${claim.note}` : ''}
            </p>
          )}
        </div>
        {claim.status === 'pending' && (
          <div className="flex shrink-0 gap-2">
            <DecideDialog claim={claim} approve trigger={<Button size="sm" className="gap-1.5"><CheckCircle2 /> To'lash</Button>} />
            <DecideDialog
              claim={claim}
              approve={false}
              trigger={<Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive"><XCircle /> Rad etish</Button>}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Center admins review insurance claims from the town game. */
export function InsuranceClaimsPage() {
  const data = useTownClaims()
  if (data === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    )
  }
  const { claims, company } = data
  const pending = claims.filter((c) => c.status === 'pending')
  const done = claims.filter((c) => c.status !== 'pending')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Clock3} label="Kutilayotgan da'volar" value={pending.length} tone="bg-warning/15 text-warning" />
        <Tile icon={Landmark} label="Sug'urta fondi" value={formatMoney(company.pool)} tone="bg-primary/10 text-primary" />
        <Tile icon={Coins} label="Yig'ilgan badallar" value={formatMoney(company.premiums)} tone="bg-coin/15 text-coin-foreground dark:text-coin" />
        <Tile
          icon={ShieldCheck}
          label="To'langan zararlar"
          value={formatMoney(company.paid)}
          tone="bg-success/15 text-success"
          hint={company.subsidy ? `shundan shaharcha qoplagan: ${formatMoney(company.subsidy)}` : undefined}
        />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Ko'rib chiqilishi kerak</h3>
        {pending.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Yangi da'vo yo'q" description="Sug'urtalangan hovli sug'urta qiymatidan arzonga sotilsa, da'vo shu yerda paydo bo'ladi." />
        ) : (
          pending.map((c) => <ClaimCard key={c._id} claim={c} />)
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Tarix</h3>
          {done.map((c) => <ClaimCard key={c._id} claim={c} />)}
        </section>
      )}
    </div>
  )
}
