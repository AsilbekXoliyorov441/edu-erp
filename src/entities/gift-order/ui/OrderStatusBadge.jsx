import { CheckCircle2, Clock3, PackageCheck, Ban, XCircle } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { ORDER_STATUS_META } from '@/entities/gift-order/model/status'

const ICONS = { pending: Clock3, ordered: CheckCircle2, delivered: PackageCheck, rejected: XCircle, cancelled: Ban }

export function OrderStatusBadge({ status, className }) {
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.pending
  const Icon = ICONS[status] ?? Clock3
  return (
    <Badge variant={meta.tone} className={className}>
      <Icon className="size-3" /> {meta.label}
    </Badge>
  )
}
