import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DieName, Skill, AttributeKey } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

const DIE_NAMES: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12']
const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']

interface Props {
  skills: Skill[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Skill>) => void
  onRemove: (id: string) => void
}

export function SkillsForm({ skills, onAdd, onUpdate, onRemove }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.skills')}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" /> {t('skills.addSkill')}
        </Button>
      </div>

      <div className="flex flex-col gap-2 overflow-x-auto">
        <div className="grid grid-cols-[1fr_80px_140px_36px] gap-1.5 text-xs text-muted-foreground px-1 min-w-[320px]">
          <Label className="text-xs">{t('skills.columnName')}</Label>
          <Label className="text-xs">{t('skills.columnDie')}</Label>
          <Label className="text-xs">{t('skills.columnLinkedAttribute')}</Label>
          <span />
        </div>

        {skills.map(skill => (
          <div key={skill.id} className="grid grid-cols-[1fr_80px_140px_36px] gap-1.5 items-center min-w-[320px]">
            <Input
              value={skill.name}
              onChange={e => onUpdate(skill.id, { name: e.target.value })}
              placeholder={t('skills.skillNamePlaceholder')}
            />
            <Select value={skill.die} onValueChange={val => onUpdate(skill.id, { die: val as DieName })}>
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
            <Select value={skill.linkedAttribute} onValueChange={val => onUpdate(skill.id, { linkedAttribute: val as AttributeKey })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ATTRIBUTE_KEYS.map(attr => (
                    <SelectItem key={attr} value={attr}>{t(`attributes.${attr}`)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => onRemove(skill.id)} className="text-destructive hover:text-destructive" aria-label={t('skills.removeSkill')}>
              <Trash2 />
            </Button>
          </div>
        ))}

        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t('skills.noSkills')}</p>
        )}
      </div>
    </div>
  )
}
