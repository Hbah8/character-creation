import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character, CombatModifier } from '@/types/character'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'
import { formatToughness } from '@/utils/toughnessUtils'
import { Plus, Trash2 } from 'lucide-react'

type DerivedCombatKey = 'pace' | 'parry' | 'toughness' | 'armor'
type ResourceCombatKey = 'bennies' | 'wounds' | 'fatigue' | 'mana'
type ModifierCombatKey = DerivedCombatKey | 'runningDieSteps'

const DERIVED_COMBAT_KEYS: DerivedCombatKey[] = ['pace', 'parry', 'toughness', 'armor']
const RESOURCE_COMBAT_KEYS: ResourceCombatKey[] = ['bennies', 'wounds', 'fatigue', 'mana']
const MODIFIER_COMBAT_KEYS: ModifierCombatKey[] = [...DERIVED_COMBAT_KEYS, 'runningDieSteps']
type EditableModifierSource = Exclude<CombatModifier['source'], 'racial'>
const MODIFIER_SOURCES: EditableModifierSource[] = ['manual', 'equipment', 'edge', 'hindrance']

interface Props {
  character: Character
  resolvedCombat: ResolvedCombatStats
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

export function CombatForm({ character, resolvedCombat, onChange }: Props) {
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
      <div className="grid grid-cols-2 gap-3">
        {DERIVED_COMBAT_KEYS.map(key => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={`resolved-${key}`}>{t(`combat.${key}`)}</Label>
            <output
              id={`resolved-${key}`}
              className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-sm tabular-nums"
            >
              {key === 'toughness'
                ? formatToughness(resolvedCombat.toughness, resolvedCombat.armor)
                : String(resolvedCombat[key])}
            </output>
          </div>
        ))}
        {RESOURCE_COMBAT_KEYS.map(key => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={key}>{t(`combat.${key}`)}</Label>
            <Input id={key} value={character[key]} onChange={event => onChange(key, event.target.value)} />
          </div>
        ))}
      </div>
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {MODIFIER_COMBAT_KEYS.map(key => (
                <div key={key} className="flex flex-col gap-1">
                  <Label htmlFor={`modifier-${modifier.id}-${key}`}>
                    {key === 'runningDieSteps' ? t('combat.runningDie') : t(`combat.${key}`)}
                  </Label>
                  <Input
                    id={`modifier-${modifier.id}-${key}`}
                    type="number"
                    value={modifier[key] ?? 0}
                    onChange={event => updateModifier(modifier.id, key, event.target.value)}
                    aria-label={t(`combat.${key === 'runningDieSteps' ? 'runningDieStepsModifier' : `${key}Modifier`}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
