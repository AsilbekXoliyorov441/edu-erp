import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib/utils'
import { GROUP_DIRECTIONS, GROUP_SCHEDULES } from '@/entities/group/model/options'
import { GroupIcon } from '@/entities/group/ui/GroupIcon'

function OptionButton({ active, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/60',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Name, direction, weekly track and lesson time — shared by the create and edit dialogs. */
export function GroupFormFields({ form, onChange, idPrefix = 'group' }) {
  const set = (key) => (value) => onChange({ ...form, [key]: value })

  return (
    <div className="space-y-5 py-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Guruh nomi</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="Masalan: Frontend PDP-24F"
          autoFocus
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Yo'nalish</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {GROUP_DIRECTIONS.map((d) => (
            <OptionButton
              key={d.key}
              active={form.direction === d.key}
              onClick={() => set('direction')(d.key)}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <GroupIcon direction={d.key} className="size-9 rounded-xl" iconClassName="size-4" />
              <span className="text-xs font-medium leading-tight text-foreground">{d.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Dars kunlari</Label>
        <div className="grid grid-cols-2 gap-2">
          {GROUP_SCHEDULES.map((s) => (
            <OptionButton key={s.key} active={form.schedule === s.key} onClick={() => set('schedule')(s.key)}>
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.days}</p>
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-start`}>Dars vaqti</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${idPrefix}-start`}
            type="time"
            value={form.startTime}
            onChange={(e) => set('startTime')(e.target.value)}
            aria-label="Boshlanish vaqti"
            required
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => set('endTime')(e.target.value)}
            aria-label="Tugash vaqti"
            required
          />
        </div>
      </div>
    </div>
  )
}
