import { Fragment } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  addAlternative,
  addAlternativeGroup,
  addRequirement,
  removeAlternative,
  removeRequirement,
  replaceAlternative,
  replaceRequirement,
} from '@/handbooks/components/edgeRequirementEditorState'
import type {
  ArcaneBackgroundRequirement,
  AttributeKey,
  Die,
  EdgeRequirement,
  EdgeRequirementCondition,
  EdgeRequirements,
  Rank,
} from '@/types/handbook'

const RANKS: Rank[] = ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary']
const DICE: Die[] = ['d4', 'd6', 'd8', 'd10', 'd12']
const ATTRIBUTES: AttributeKey[] = ['agility', 'smarts', 'spirit', 'strength', 'vigor']
const ARCANE_BACKGROUNDS: ArcaneBackgroundRequirement[] = [
  'any', 'weirdScience', 'magic', 'psionics', 'gifted', 'miracles',
]
const CONDITION_TYPES: EdgeRequirementCondition['type'][] = [
  'rank', 'attribute', 'skill', 'edge', 'hindrance', 'race', 'wildCard', 'text',
]

export interface RequirementReference {
  id: string
  name: string
}

export interface EdgeRequirementReferences {
  edges: RequirementReference[]
  hindrances: RequirementReference[]
  races: RequirementReference[]
  skills: RequirementReference[]
}

interface EdgeRequirementsEditorProps {
  value?: EdgeRequirements
  references: EdgeRequirementReferences
  onChange: (requirements: EdgeRequirements | undefined) => void
}

function createDefaultCondition(
  type: EdgeRequirementCondition['type'],
  references: EdgeRequirementReferences,
): EdgeRequirementCondition {
  switch (type) {
    case 'rank': return { type, minimum: 'Novice' }
    case 'attribute': return { type, attribute: 'agility', minimum: 'd4' }
    case 'skill': return { type, skill: references.skills[0]?.id ?? '', minimum: 'd4' }
    case 'edge': return { type, edgeId: references.edges[0]?.id ?? '' }
    case 'hindrance': return { type, hindranceId: references.hindrances[0]?.id ?? '' }
    case 'race': return { type, raceId: references.races[0]?.id ?? '' }
    case 'wildCard': return { type }
    case 'text': return { type, text: '' }
  }
}

function hasAnyOf(requirement: EdgeRequirement): requirement is { anyOf: EdgeRequirementCondition[] } {
  return 'anyOf' in requirement
}

function isComplete(condition: EdgeRequirementCondition, references: EdgeRequirementReferences): boolean {
  switch (condition.type) {
    case 'skill': return references.skills.some(reference => reference.id === condition.skill)
    case 'edge': return condition.edgeId !== ''
    case 'hindrance': return condition.hindranceId !== ''
    case 'race': return condition.raceId !== ''
    case 'text': return condition.text.trim() !== ''
    default: return true
  }
}

function withMissingReference(
  references: RequirementReference[],
  id: string,
): RequirementReference[] {
  return references.some(reference => reference.id === id)
    ? references
    : [{ id, name: id }, ...references]
}

function ConditionEditor({
  condition,
  references,
  onChange,
  onRemove,
}: {
  condition: EdgeRequirementCondition
  references: EdgeRequirementReferences
  onChange: (condition: EdgeRequirementCondition) => void
  onRemove: () => void
}) {
  const { t } = useTranslation('handbooks')
  const incomplete = !isComplete(condition, references)

  function changeType(type: EdgeRequirementCondition['type']) {
    onChange(createDefaultCondition(type, references))
  }

  return (
    <div className="grid grid-cols-[minmax(9rem,0.9fr)_minmax(0,1.6fr)_auto] items-end gap-2">
      <label className="flex min-w-0 flex-col gap-1 text-xs">
        {t('requirementsEditor.condition')}
        <Select value={condition.type} onValueChange={value => changeType(value as EdgeRequirementCondition['type'])}>
          <SelectTrigger className="w-full" aria-invalid={incomplete}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {CONDITION_TYPES.map(type => (
                <SelectItem
                  key={type}
                  value={type}
                  disabled={type === 'race' && references.races.length === 0}
                >
                  {t(`requirementsEditor.types.${type}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>

      <ConditionFields condition={condition} references={references} invalid={incomplete} onChange={onChange} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove} aria-label={t('requirementsEditor.remove')}>
            <Trash2Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('requirementsEditor.remove')}</TooltipContent>
      </Tooltip>

      {incomplete && (
        <p className="col-start-2 text-xs text-destructive">{t('requirementsEditor.incomplete')}</p>
      )}
    </div>
  )
}

function ConditionFields({
  condition,
  references,
  invalid,
  onChange,
}: {
  condition: EdgeRequirementCondition
  references: EdgeRequirementReferences
  invalid: boolean
  onChange: (condition: EdgeRequirementCondition) => void
}) {
  const { t } = useTranslation('handbooks')

  if (condition.type === 'rank') {
    return (
      <label className="flex min-w-0 flex-col gap-1 text-xs">
        {t('requirementsEditor.minimum')}
        <Select value={condition.minimum} onValueChange={minimum => onChange({ ...condition, minimum: minimum as Rank })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{RANKS.map(rank => <SelectItem key={rank} value={rank}>{t(`enums.rank.${rank}`)}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </label>
    )
  }

  if (condition.type === 'attribute') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1 text-xs">
          {t('requirementsEditor.attribute')}
          <Select value={condition.attribute} onValueChange={attribute => onChange({ ...condition, attribute: attribute as AttributeKey })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{ATTRIBUTES.map(attribute => <SelectItem key={attribute} value={attribute}>{t(`modifiers.${attribute}`)}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </label>
        <DieSelect value={condition.minimum} onChange={minimum => onChange({ ...condition, minimum })} />
      </div>
    )
  }

  if (condition.type === 'skill') {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
        <ReferenceSelect
          label={t('requirementsEditor.skill')}
          value={condition.skill}
          options={references.skills}
          invalid={invalid}
          onChange={skill => onChange({ ...condition, skill })}
        />
        <DieSelect value={condition.minimum} onChange={minimum => onChange({ ...condition, minimum })} />
      </div>
    )
  }

  if (condition.type === 'edge') {
    const edgeReferences = withMissingReference(references.edges, condition.edgeId)
    const isArcaneBackground = condition.edgeId === 'misticheskiy-dar'
    return (
      <div className={isArcaneBackground ? 'grid grid-cols-2 gap-2' : ''}>
        <ReferenceSelect
          label={t('requirementsEditor.edge')}
          value={condition.edgeId}
          options={edgeReferences}
          invalid={invalid}
          onChange={edgeId => onChange({ type: 'edge', edgeId })}
        />
        {isArcaneBackground && (
          <label className="flex min-w-0 flex-col gap-1 text-xs">
            {t('requirementsEditor.arcaneBackground')}
            <Select value={condition.arcaneBackground ?? 'any'} onValueChange={arcaneBackground => onChange({ ...condition, arcaneBackground: arcaneBackground as ArcaneBackgroundRequirement })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup>{ARCANE_BACKGROUNDS.map(background => <SelectItem key={background} value={background}>{t(`requirements.arcaneBackground.${background}`)}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </label>
        )}
      </div>
    )
  }

  if (condition.type === 'hindrance') {
    return <ReferenceSelect label={t('requirementsEditor.hindrance')} value={condition.hindranceId} options={withMissingReference(references.hindrances, condition.hindranceId)} invalid={invalid} onChange={hindranceId => onChange({ ...condition, hindranceId })} />
  }

  if (condition.type === 'race') {
    return <ReferenceSelect label={t('requirementsEditor.race')} value={condition.raceId} options={withMissingReference(references.races, condition.raceId)} invalid={invalid} onChange={raceId => onChange({ ...condition, raceId })} />
  }

  if (condition.type === 'wildCard') {
    return <p className="pb-2 text-sm text-muted-foreground">{t('requirements.wildCard')}</p>
  }

  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs">
      {t('requirementsEditor.text')}
      <Input value={condition.text} aria-invalid={invalid} placeholder={t('requirementsEditor.textPlaceholder')} onChange={event => onChange({ ...condition, text: event.target.value })} />
    </label>
  )
}

function DieSelect({ value, onChange }: { value: Die; onChange: (die: Die) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs">
      {t('requirementsEditor.minimum')}
      <Select value={value} onValueChange={die => onChange(die as Die)}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectGroup>{DICE.map(die => <SelectItem key={die} value={die}>{die}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
    </label>
  )
}

function ReferenceSelect({
  label,
  value,
  options,
  invalid,
  onChange,
}: {
  label: string
  value: string
  options: RequirementReference[]
  invalid: boolean
  onChange: (id: string) => void
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-invalid={invalid}><SelectValue /></SelectTrigger>
        <SelectContent><SelectGroup>{options.map(option => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
    </label>
  )
}

export function EdgeRequirementsEditor({ value, references, onChange }: EdgeRequirementsEditorProps) {
  const { t } = useTranslation('handbooks')
  const requirements = value ?? { allOf: [] }

  function apply(next: EdgeRequirements) {
    onChange(next.allOf.length > 0 ? next : undefined)
  }

  function addCondition(type: EdgeRequirementCondition['type']) {
    apply(addRequirement(requirements, createDefaultCondition(type, references)))
  }

  return (
    <TooltipProvider>
      <section className="flex min-w-0 flex-col gap-3" aria-label={t('entry.requirements')}>
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">{t('entry.requirements')}</p>
          <p className="text-xs text-muted-foreground">{t('requirementsEditor.allOf')}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/15 p-4">
          {requirements.allOf.map((requirement, index) => (
            <Fragment key={hasAnyOf(requirement) ? `any-of-${index}` : `condition-${index}`}>
              {hasAnyOf(requirement) ? (
                <section className="flex flex-col gap-3 rounded-md border border-dashed bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{t('requirementsEditor.anyOf')}</p>
                    <Button type="button" variant="ghost" size="xs" onClick={() => apply(addAlternative(requirements, index, createDefaultCondition('rank', references)))}>
                      <PlusIcon data-icon="inline-start" />
                      {t('requirementsEditor.addAlternative')}
                    </Button>
                  </div>
                  {requirement.anyOf.map((condition, alternativeIndex) => (
                    <ConditionEditor
                      key={alternativeIndex}
                      condition={condition}
                      references={references}
                      onChange={replacement => apply(replaceAlternative(requirements, index, alternativeIndex, replacement))}
                      onRemove={() => apply(requirement.anyOf.length === 1
                        ? removeRequirement(requirements, index)
                        : removeAlternative(requirements, index, alternativeIndex))}
                    />
                  ))}
                </section>
              ) : (
                <ConditionEditor
                  condition={requirement}
                  references={references}
                  onChange={replacement => apply(replaceRequirement(requirements, index, replacement))}
                  onRemove={() => apply(removeRequirement(requirements, index))}
                />
              )}
              {index < requirements.allOf.length - 1 && (
                <div className="relative flex items-center py-1">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">
                    {t('requirementsEditor.and')}
                  </span>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-dashed"
            onClick={() => addCondition('rank')}
          >
            <PlusIcon data-icon="inline-start" />
            {t('requirementsEditor.addCondition')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 border-dashed"
            onClick={() => apply(addAlternativeGroup(requirements, createDefaultCondition('rank', references)))}
          >
            <PlusIcon data-icon="inline-start" />
            {t('requirementsEditor.addAlternativeGroup')}
          </Button>
        </div>
      </section>
    </TooltipProvider>
  )
}