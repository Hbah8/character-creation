import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  gear: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export function GearForm({ gear, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Gear</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add Item
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {gear.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={e => onUpdate(i, e.target.value)}
              placeholder="Gear item…"
            />
            <Button size="icon" variant="ghost" onClick={() => onRemove(i)} className="text-destructive hover:text-destructive">
              <Trash2 />
            </Button>
          </div>
        ))}

        {gear.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No gear yet.</p>
        )}
      </div>
    </div>
  )
}
