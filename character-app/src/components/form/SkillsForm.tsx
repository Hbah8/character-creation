import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character, DieName, Skill } from '@/types/character'
import { Trash2 } from 'lucide-react'
import { calcSkillPointsSpent } from '@/services/pointsService'
import { useSettingRules } from '@/hooks/useSettingRules'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { getAvailableSkillDefinitions, resolveCharacterSkills } from '@/handbooks/services/resolveCharacterSkills'

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
  const effectiveSkills = resolveCharacterSkills(skills, worldHandbook)
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

      <div className="flex min-w-0 max-w-full flex-col gap-1 overflow-x-auto">
        <div className="grid min-w-[360px] grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_5rem_2.25rem] gap-1.5 px-1 text-xs text-muted-foreground">
          <Label className="min-w-0 truncate text-xs">{t('skills.columnName')}</Label>
          <Label className="text-xs">{t('skills.columnDie')}</Label>
          <Label className="min-w-0 truncate text-xs">{t('skills.columnLinkedAttribute')}</Label>
          <Label className="whitespace-nowrap text-center text-xs">{t('skills.columnStarter')}</Label>
          <span />
        </div>

        {effectiveSkills.map(skill => (
          <div key={skill.id} className="grid min-w-[360px] grid-cols-[minmax(0,1.1fr)_4rem_minmax(0,1fr)_5rem_2.25rem] items-center gap-1.5">
            <span className="min-w-0 truncate px-3 text-sm" title={skill.name}>{skill.name}</span>
            <Select value={skill.die} onValueChange={val => onUpdate(skill.id, { die: val as DieName })}>
              <SelectTrigger className="h-7">
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
            <span className="min-w-0 truncate px-3 text-sm" title={t(`attributes.${skill.linkedAttribute}`)}>{t(`attributes.${skill.linkedAttribute}`)}</span>
            <span className="whitespace-nowrap text-center text-sm">{skill.isStarter ? t('skills.core') : '—'}</span>
            <Button size="icon-sm" variant="ghost" onClick={() => onRemove(skill.id)} className="text-destructive hover:text-destructive" aria-label={t('skills.removeSkill')}>
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

