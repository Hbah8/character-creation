import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character, DieName } from '@/types/character'

const DIE_NAMES: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12']

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

const ATTRIBUTES: { key: keyof Character; label: string }[] = [
  { key: 'agility', label: 'Agility (Ловкость)' },
  { key: 'strength', label: 'Strength (Сила)' },
  { key: 'smarts', label: 'Smarts (Смекалка)' },
  { key: 'spirit', label: 'Spirit (Характер)' },
  { key: 'vigor', label: 'Vigor (Выносливость)' },
]

export function AttributesForm({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attributes</h2>
      <div className="grid grid-cols-2 gap-3">
        {ATTRIBUTES.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label>{label}</Label>
            <Select
              value={character[key] as DieName}
              onValueChange={val => onChange(key, val as DieName)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DIE_NAMES.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
