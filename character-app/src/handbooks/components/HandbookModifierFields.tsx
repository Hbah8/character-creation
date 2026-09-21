import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { HandbookCombatStat, HandbookModifier } from '@/types/handbook'

const COMBAT_STATS: HandbookCombatStat[] = [
  'pace', 'parry', 'toughness', 'armor', 'runningDieSteps',
  'bennies', 'maxWounds', 'maxFatigue', 'powerPoints',
]
const ATTRIBUTES = ['agility', 'strength', 'smarts', 'spirit', 'vigor'] as const

interface ModifierLabels {
  title: string
  none?: string
  add: string
  remove: string
  stat: string
  attribute?: string
  type?: string
  combat?: string
  attributeDieStep?: string
  amount: string
  pace: string
  [key: string]: string | undefined
}

interface Props {
  modifiers: HandbookModifier[]
  onChange: (modifiers: HandbookModifier[]) => void
  labels: ModifierLabels
}

export function HandbookModifierFields({ modifiers, onChange, labels }: Props) {
  function addModifier() {
    onChange([...modifiers, { type: 'combat', stat: 'pace', amount: 1 }])
  }

  function replaceModifier(index: number, replacement: HandbookModifier) {
    onChange(modifiers.map((modifier, modifierIndex) =>
      modifierIndex === index
        ? replacement
        : modifier,
    ))
  }

  function removeModifier(index: number) {
    onChange(modifiers.filter((_, modifierIndex) => modifierIndex !== index))
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{labels.title}</span>
        <Button type="button" variant="outline" size="xs" onClick={addModifier}>
          <PlusIcon data-icon="inline-start" />
          {labels.add}
        </Button>
      </div>
      {modifiers.length === 0 && (
        <div className="flex min-h-14 items-center justify-center rounded-md border border-dashed px-3 text-center text-xs text-muted-foreground">
          {labels.none}
        </div>
      )}
      {modifiers.map((modifier, index) => {
        return (
          <div key={`${modifier.type}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto] items-end gap-2">
            <label className="flex min-w-0 flex-col gap-1 text-xs">
              {labels.type ?? 'Type'}
              <Select
                value={modifier.type}
                onValueChange={type => replaceModifier(index, type === 'attribute-die-step'
                  ? { type: 'attribute-die-step', attribute: 'agility', amount: modifier.amount }
                  : { type: 'combat', stat: 'pace', amount: modifier.amount }
                )}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="combat">{labels.combat ?? 'Combat'}</SelectItem>
                    <SelectItem value="attribute-die-step">{labels.attributeDieStep ?? 'Attribute die step'}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs">
              {modifier.type === 'combat' ? labels.stat : labels.attribute ?? 'Attribute'}
              {modifier.type === 'combat' ? (
                <Select value={modifier.stat} onValueChange={stat => replaceModifier(index, { ...modifier, stat: stat as HandbookCombatStat })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COMBAT_STATS.map(stat => (
                        <SelectItem key={stat} value={stat}>{labels[stat] ?? stat}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={modifier.attribute} onValueChange={attribute => replaceModifier(index, { ...modifier, attribute })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ATTRIBUTES.map(attribute => (
                        <SelectItem key={attribute} value={attribute}>{labels[attribute] ?? attribute}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {labels.amount}
              <Input
                type="number"
                value={modifier.amount}
                onChange={event => replaceModifier(index, { ...modifier, amount: Number(event.target.value) || 0 })}
              />
            </label>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeModifier(index)} title={labels.remove}>
              <Trash2Icon />
              <span className="sr-only">{labels.remove}</span>
            </Button>
          </div>
        )
      })}
    </section>
  )
}