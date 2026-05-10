import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Weapon } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  weapons: Weapon[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Weapon>) => void
  onRemove: (id: string) => void
}

const COLUMNS: { key: keyof Weapon; label: string; placeholder: string }[] = [
  { key: 'name',     label: 'Name',   placeholder: 'Weapon name' },
  { key: 'range',    label: 'Range',  placeholder: '24/48/96' },
  { key: 'damage',   label: 'Damage', placeholder: '2d8+1' },
  { key: 'ap',       label: 'AP',     placeholder: '2' },
  { key: 'rof',      label: 'RoF',    placeholder: '1' },
  { key: 'magazine', label: 'Mag.',   placeholder: '30' },
]

export function WeaponsForm({ weapons, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Weapons</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-3.5 mr-1" /> Add Weapon
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_0.6fr_0.6fr_0.7fr_36px] gap-1.5">
          {COLUMNS.map(c => (
            <Label key={c.key} className="text-xs">{c.label}</Label>
          ))}
          <span />
        </div>

        {weapons.map(w => (
          <div key={w.id} className="grid grid-cols-[2fr_1.2fr_1.2fr_0.6fr_0.6fr_0.7fr_36px] gap-1.5 items-center">
            {COLUMNS.map(c => (
              <Input
                key={c.key}
                value={w[c.key]}
                onChange={e => onUpdate(w.id, { [c.key]: e.target.value })}
                placeholder={c.placeholder}
              />
            ))}
            <Button size="icon" variant="ghost" onClick={() => onRemove(w.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        {weapons.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No weapons yet.</p>
        )}
      </div>
    </div>
  )
}
