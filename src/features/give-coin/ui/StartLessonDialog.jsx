import { useState } from 'react'
import { Play } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

function todayDateInputValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Turns a `yyyy-MM-dd` date-input value into a full ISO datetime — the calendar date the
 * teacher picked, combined with the current time-of-day so entries within the same day
 * still sort chronologically. */
function toIsoWithCurrentTime(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const now = new Date()
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString()
}

export function StartLessonDialog({ onStart, disabled }) {
  const [open, setOpen] = useState(false)
  const [dateValue, setDateValue] = useState(todayDateInputValue)

  const handleSubmit = (event) => {
    event.preventDefault()
    onStart(toIsoWithCurrentTime(dateValue))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setDateValue(todayDateInputValue()) }}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-1.5">
          <Play className="size-4" /> Darsni boshlash
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Darsni boshlash</DialogTitle>
            <DialogDescription>Dars qaysi sanaga tegishli ekanini tanlang.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-4">
            <Label htmlFor="lesson-date">Sana</Label>
            <Input
              id="lesson-date"
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="gap-1.5">
              <Play className="size-4" /> Boshlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
