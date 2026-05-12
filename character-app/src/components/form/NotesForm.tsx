import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Character } from '@/types/character'

interface Props {
  notes: Character['notes']
  onChange: (value: string) => void
}

export function NotesForm({ notes, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">Notes / Заметки</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => onChange(e.target.value)}
          placeholder="Wounds, ammo tracking, temp effects, mission objectives…"
          rows={4}
        />
      </div>
    </div>
  )
}
