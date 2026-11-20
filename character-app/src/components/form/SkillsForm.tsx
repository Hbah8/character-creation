import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character, DieName, Skill } from '@/types/character'
import { Trash2 } from 'lucide-react'
import { calcSkillPointsSpent } from '@/services/pointsService'
import { useSettingRules } from '@/hooks/useSettingRules'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import {
  getAvailableSkillDefinitions,
  resolveCharacterSkills,
  sortSkillsByLinkedAttribute,
} from '@/handbooks/services/resolveCharacterSkills'

const DIE_NAMES: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12']

interface Props {
  skills: Skill[]
  character: Character
  onAdd: (skillKey: string) => void
  onUpdate: (id: string, patch: Pick<Skill, 'die'>) => void
  onRemove: (id: string) => void
}

export function SkillsForm({ skills, character, onAdd, onUpdate, onRemove }: Props) {
  const { t } = useTranslation('form')
  const { entries } = useWorldLibrary()
  const worldHandbook = entries.find(entry => entry.id === character.worldId)?.world.worldHandbook ?? []
  const effectiveSkills = sortSkillsByLinkedAttribute(resolveCharacterSkills(skills, worldHandbook))
  const availableSkills = getAvailableSkillDefinitions(skills, worldHandbook)
  const spent = calcSkillPointsSpent(effectiveSkills, character)
  const { skillPointsBudget } = useSettingRules(character.worldId)
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.skills')}</h2>
        <span className={`text-xs font-medium tabular-nums ${spent > skillPointsBudget ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
          {t('skills.pointsSpent', { spent, budget: skillPointsBudget })}
        </span>
      </div>
      <Select onValueChange={onAdd}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder={t('skills.selectSkill')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableSkills.map(skill => (
              <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 gap-y-1">
        <div className="col-span-full grid grid-cols-subgrid items-end text-muted-foreground">
          <Label className="text-xs">{t('skills.columnName')}</Label>
          <Label className="text-xs">{t('skills.columnDie')}</Label>
          <span />
        </div>

        {effectiveSkills.map(skill => (
          <div key={skill.id} className="col-span-full grid grid-cols-subgrid items-center border-b py-1.5 last:border-b-0">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="type-body wrap-anywhere">{skill.name}</span>
              <div className="flex flex-wrap gap-x-2 type-secondary text-muted-foreground">
                <span>{t(`attributes.${skill.linkedAttribute}`)}</span>
                {skill.isStarter && <span>{t('skills.core')}</span>}
              </div>
            </div>
            <Select value={skill.die} onValueChange={val => onUpdate(skill.id, { die: val as DieName })}>
              <SelectTrigger size="sm">
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
            <Button size="icon-sm" variant="ghost" onClick={() => onRemove(skill.id)} className="text-destructive hover:text-destructive" aria-label={t('skills.removeSkill')}>
              <Trash2 />
            </Button>
          </div>
        ))}

        {skills.length === 0 && (
          <p className="col-span-full py-2 text-center text-sm text-muted-foreground">{t('skills.noSkills')}</p>
        )}
      </div>
    </div>
  )
}
