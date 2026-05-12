import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character } from '@/types/character'

type CombatKey = 'pace' | 'parry' | 'toughness' | 'bennies' | 'wounds' | 'fatigue' | 'mana'
const COMBAT_KEYS: CombatKey[] = ['pace', 'parry', 'toughness', 'bennies', 'wounds', 'fatigue', 'mana']

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

export function CombatForm({ character, onChange }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.combat')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {COMBAT_KEYS.map(key => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={key}>{t(`combat.${key}`)}</Label>
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
