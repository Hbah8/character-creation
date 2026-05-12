import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character, DieName, AttributeKey } from '@/types/character'

const DIE_NAMES: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12']
const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

export function AttributesForm({ character, onChange }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.attributes')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {ATTRIBUTE_KEYS.map(key => (
          <div key={key} className="flex flex-col gap-1">
            <Label>{t(`attributes.${key}`)}</Label>
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
