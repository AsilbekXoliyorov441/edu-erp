import { useMemo, useState } from 'react'
import { Plus, PenLine, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { GiftGrid } from '@/widgets/GiftGrid/GiftGrid'
import { GiftFormDialog } from '@/features/manage-gifts/ui/GiftFormDialog'
import { DeleteGiftDialog } from '@/features/manage-gifts/ui/DeleteGiftDialog'
import { useAuthStore } from '@/entities/session/model/store'
import { useGiftStore } from '@/entities/gift/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useTransactionStore } from '@/entities/transaction/model/store'
import { getStudentBalance } from '@/shared/lib/stats'
import { ROLES } from '@/shared/config/constants'

export function CoinMarketPage() {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const gifts = useGiftStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const transactions = useTransactionStore((s) => s.items)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('none')

  const isTeacher = role === ROLES.TEACHER
  const currentStudent = !isTeacher ? students.find((s) => s.id === userId) : null
  const balance = currentStudent ? getStudentBalance(currentStudent.id, transactions) : null

  const categories = useMemo(() => [...new Set(gifts.map((g) => g.category).filter(Boolean))].sort(), [gifts])

  const visibleGifts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = gifts.filter((gift) => {
      const matchesSearch = !query || gift.name.toLowerCase().includes(query)
      const matchesCategory = category === 'all' || gift.category === category
      return matchesSearch && matchesCategory
    })
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price)
    return filtered
  }, [gifts, search, category, sort])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isTeacher ? `${visibleGifts.length} ta mahsulot` : balance != null ? `Balansingiz: ${balance} coin` : ''}
        </p>
        {isTeacher && (
          <GiftFormDialog
            trigger={
              <Button className="gap-1.5">
                <Plus className="size-4" /> Sovg'a qo'shish
              </Button>
            }
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sovg'a qidirish..." className="pl-10" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Saralash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Saralashsiz</SelectItem>
            <SelectItem value="price-asc">Narx: arzondan qimmatga</SelectItem>
            <SelectItem value="price-desc">Narx: qimmatdan arzonga</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-5">
          <GiftGrid
            gifts={visibleGifts}
            balance={isTeacher ? null : balance}
            actions={
              isTeacher
                ? (gift) => (
                    <div className="flex items-center justify-center gap-1">
                      <GiftFormDialog
                        gift={gift}
                        trigger={
                          <Button size="icon" variant="ghost" className="size-8" aria-label="Tahrirlash">
                            <PenLine className="size-4" />
                          </Button>
                        }
                      />
                      <DeleteGiftDialog gift={gift} />
                    </div>
                  )
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
