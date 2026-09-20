import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character, CombatModifier } from '@/types/character'
import { Plus, Trash2 } from 'lucide-react'

type DerivedCombatKey = 'pace' | 'parry' | 'toughness' | 'armor'
type ResourceModifierKey = 'bennies' | 'maxWounds' | 'maxFatigue' | 'powerPoints'
type CombatModifierKey = DerivedCombatKey | 'runningDieSteps'

const DERIVED_COMBAT_KEYS: DerivedCombatKey[] = ['pace', 'parry', 'toughness', 'armor']
const COMBAT_MODIFIER_KEYS: CombatModifierKey[] = [...DERIVED_COMBAT_KEYS, 'runningDieSteps']
const RESOURCE_MODIFIER_KEYS: ResourceModifierKey[] = ['bennies', 'maxWounds', 'maxFatigue', 'powerPoints']
const COMBAT_MODIFIER_LABEL_KEYS = {
  pace: 'combat.paceModifier',
  parry: 'combat.parryModifier',
  toughness: 'combat.toughnessModifier',
  armor: 'combat.armorModifier',
  runningDieSteps: 'combat.runningDieStepsModifier',
} as const
const RESOURCE_MODIFIER_LABEL_KEYS = {
  bennies: 'combat.benniesModifier',
  maxWounds: 'combat.maxWoundsModifier',
  maxFatigue: 'combat.maxFatigueModifier',
  powerPoints: 'combat.powerPointsModifier',
} as const
const RESOURCE_MODIFIER_DISPLAY_LABEL_KEYS = {
  bennies: 'combat.bennies',
  maxWounds: 'combat.maxWoundsShort',
  maxFatigue: 'combat.maxFatigueShort',
  powerPoints: 'combat.powerPointsShort',
} as const
const RESOURCE_MODIFIER_FULL_LABEL_KEYS = {
  bennies: 'combat.bennies',
  maxWounds: 'combat.maxWounds',
  maxFatigue: 'combat.maxFatigue',
  powerPoints: 'combat.powerPoints',
} as const
type EditableModifierSource = Exclude<CombatModifier['source'], 'racial'>
const MODIFIER_SOURCES: EditableModifierSource[] = ['manual', 'equipment', 'edge', 'hindrance']

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

function getModifiers(modifiers: CombatModifier[] | undefined): CombatModifier[] {
  if (modifiers?.length) return modifiers
  return [{
    id: 'manual-combat-adjustment',
    source: 'manual',
    name: 'Manual combat adjustment',
  }]
}

export function CombatForm({ character, onChange }: Props) {
  const { t } = useTranslation('form')
  const modifiers = getModifiers(character.combatModifiers)

  function updateModifier(id: string, key: keyof CombatModifier, value: string) {
    const parsed = Number.parseInt(value, 10)
    onChange('combatModifiers', modifiers.map(modifier =>
      modifier.id === id ? { ...modifier, [key]: Number.isFinite(parsed) ? parsed : 0 } : modifier,
    ))
  }

  function updateModifierText(id: string, key: 'name' | 'source', value: string) {
    onChange('combatModifiers', modifiers.map(modifier =>
      modifier.id === id ? { ...modifier, [key]: value } as CombatModifier : modifier,
    ))
  }

  function addModifier() {
    onChange('combatModifiers', [
      ...modifiers,
      { id: crypto.randomUUID(), source: 'manual', name: t('combat.newModifier') },
    ])
  }

  function removeModifier(id: string) {
    onChange('combatModifiers', modifiers.filter(modifier => modifier.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.combat')}</h2>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{t('combat.modifiers')}</h3>
          <Button type="button" variant="outline" size="sm" onClick={addModifier}>
            <Plus data-icon="inline-start" />
            {t('combat.addModifier')}
          </Button>
        </div>
        {modifiers.map(modifier => (
          <div key={modifier.id} className="flex flex-col gap-3 border p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`modifier-${modifier.id}-name`}>{t('combat.modifierName')}</Label>
                <Input
                  id={`modifier-${modifier.id}-name`}
                  value={modifier.name}
                  onChange={event => updateModifierText(modifier.id, 'name', event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`modifier-${modifier.id}-source`}>{t('combat.modifierSource')}</Label>
                <Select value={modifier.source} onValueChange={value => updateModifierText(modifier.id, 'source', value)}>
                  <SelectTrigger id={`modifier-${modifier.id}-source`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODIFIER_SOURCES.map(source => (
                      <SelectItem key={source} value={source}>{t(`combat.sources.${source}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeModifier(modifier.id)}
                aria-label={t('combat.removeModifier')}
                className="self-end"
              >
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t('combat.combatModifiers')}</span>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {COMBAT_MODIFIER_KEYS.map(key => (
                  <div key={key} className="flex flex-col gap-1">
                    <Label htmlFor={`modifier-${modifier.id}-${key}`}>
                      {key === 'runningDieSteps' ? t('combat.runningDie') : t(`combat.${key}`)}
                    </Label>
                    <Input
                      id={`modifier-${modifier.id}-${key}`}
                      type="number"
                      value={modifier[key] ?? 0}
                      onChange={event => updateModifier(modifier.id, key, event.target.value)}
                      aria-label={t(COMBAT_MODIFIER_LABEL_KEYS[key])}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="combat-resource-section flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t('combat.resourceModifiers')}</span>
              <div className="combat-resource-grid grid grid-cols-2 gap-3">
                {RESOURCE_MODIFIER_KEYS.map(key => (
                <div key={key} className="flex flex-col gap-1">
                  <Label
                    htmlFor={`modifier-${modifier.id}-${key}`}
                    title={t(RESOURCE_MODIFIER_FULL_LABEL_KEYS[key])}
                  >
                    {t(RESOURCE_MODIFIER_DISPLAY_LABEL_KEYS[key])}
                  </Label>
                  <Input
                    id={`modifier-${modifier.id}-${key}`}
                    type="number"
                    value={modifier[key] ?? 0}
                    onChange={event => updateModifier(modifier.id, key, event.target.value)}
                    aria-label={t(RESOURCE_MODIFIER_LABEL_KEYS[key])}
                  />
                </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
