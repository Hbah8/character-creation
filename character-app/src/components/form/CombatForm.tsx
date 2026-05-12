import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character } from '@/types/character'

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

const FIELDS: { key: keyof Character; label: string }[] = [
  { key: 'pace', label: 'Pace (Шаг)' },
  { key: 'parry', label: 'Parry (Парирование)' },
  { key: 'toughness', label: 'Toughness (Стойкость)' },
  { key: 'bennies', label: 'Bennies (Бенни)' },
  { key: 'wounds', label: 'Wounds (Раны)' },
  { key: 'fatigue', label: 'Fatigue (Усталость)' },
  { key: 'mana', label: 'Mana (Мана)' },
]

export function CombatForm({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Combat Parameters</h2>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              value={character[key] as string}
              onChange={e => onChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
