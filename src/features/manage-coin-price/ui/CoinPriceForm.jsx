import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAuthStore } from '@/entities/session/model/store'

/** Director/EduSuperAdmin only: sets this center's "1 coin = X so'm" conversion rate, used
 * purely for the finance dashboard's money figures — never gates gift redemption. */
export function CoinPriceForm() {
  const coinPriceSom = useAuthStore((s) => s.coinPriceSom)
  const updateCoinPrice = useAuthStore((s) => s.updateCoinPrice)
  const [value, setValue] = useState(String(coinPriceSom ?? ''))
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const price = Number(value)
    if (!Number.isFinite(price) || price < 0) return

    setSubmitting(true)
    try {
      await updateCoinPrice(price)
      toast.success('Coin narxi yangilandi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="coin-price">1 coin narxi (so'm)</Label>
        <Input id="coin-price" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="130" />
      </div>
      <Button type="submit" disabled={submitting} className="gap-1.5">
        <Save className="size-4" /> Saqlash
      </Button>
    </form>
  )
}
