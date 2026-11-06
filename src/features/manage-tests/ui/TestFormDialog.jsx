import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useTopics } from '@/entities/test/model/store'
import { DEFAULT_SECTION, getTestSection, getTestSubject, inferTestSubject } from '@/entities/test/lib/subject'
import { TEST_SUBJECTS } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'

/** Mounted only while the dialog is open, so its field state always starts fresh from `test`. */
function TestFormBody({ test, defaultSubject, defaultSection, onDone }) {
  const isEdit = Boolean(test)
  const [title, setTitle] = useState(test?.title ?? '')
  // null = not picked yet → follows the title ("CSS flexbox" → CSS) until the teacher picks.
  const [picked, setPicked] = useState(test?.subject ?? defaultSubject ?? null)
  const subject = picked ?? inferTestSubject(title)
  const [section, setSection] = useState(test?.section ?? defaultSection ?? '')
  const { items: topics, create, update } = useTopics()

  // Sections already used in the chosen subject — one tap to reuse, so names stay identical.
  const knownSections = [
    ...new Set(
      topics
        .filter((t) => getTestSubject(t).key === subject)
        .map(getTestSection)
        .filter((name) => name !== DEFAULT_SECTION),
    ),
  ].sort((a, b) => a.localeCompare(b, 'uz', { numeric: true }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    if (isEdit) {
      await update(test.id, trimmed, subject, section.trim())
      toast.success('Mavzu yangilandi')
    } else {
      await create(trimmed, subject, section.trim())
      toast.success("Mavzu qo'shildi")
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Mavzuni tahrirlash' : "Yangi mavzu qo'shish"}</DialogTitle>
        <DialogDescription>
          Mavzu nomini kiriting, so'ng unga savollar qo'shib, xohlagan guruhlaringizga ulashingiz mumkin.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
        <Label htmlFor="test-title">Mavzu nomi</Label>
        <Input
          id="test-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masalan: HTML semantik teglar"
          autoFocus
          required
        />
        </div>
        <div className="space-y-1.5">
          <Label>Fan</Label>
          <div role="radiogroup" aria-label="Fan" className="flex flex-wrap gap-1.5">
            {TEST_SUBJECTS.map((s) => {
              const active = subject === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPicked(s.key)}
                  className={cn(
                    'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                    active ? 'text-white' : 'border-border bg-background text-muted-foreground hover:bg-secondary',
                  )}
                  style={active ? { backgroundColor: s.color, borderColor: s.color } : undefined}
                >
                  {!active && <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />}
                  {s.label}
                </button>
              )
            })}
          </div>
          {!picked && <p className="text-xs text-muted-foreground">Nomiga qarab tanlandi — kerak bo'lsa o'zgartiring.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="test-section">
            Bo'lim <span className="font-normal text-muted-foreground">(ixtiyoriy)</span>
          </Label>
          <Input
            id="test-section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Masalan: Asoslar, Formalar, 1-modul"
            maxLength={60}
          />
          {knownSections.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {knownSections.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSection(name)}
                  className={cn(
                    'h-7 cursor-pointer rounded-full border px-2.5 text-xs font-medium transition-colors',
                    section.trim() === name
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Bo'sh qolsa, mavzu “{DEFAULT_SECTION}” bo'limida turadi.</p>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">{isEdit ? 'Saqlash' : "Qo'shish"}</Button>
      </DialogFooter>
    </form>
  )
}

export function TestFormDialog({ test, defaultSubject, defaultSection, trigger }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>{open && <TestFormBody test={test} defaultSubject={defaultSubject} defaultSection={defaultSection} onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  )
}
