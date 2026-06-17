import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { computeRacialEdgeCost } from '@/racebuilder/services/raceBudget'
import type {
  Edge,
  FeatureParameterSchema,
  FeatureParameters,
  Hindrance,
  RacialAbility,
  ResolvedEntry,
} from '@/types/handbook'

interface FeatureParameterInputProps {
  ability: RacialAbility
  schema: FeatureParameterSchema
  value: FeatureParameters
  edges: ResolvedEntry<Edge>[]
  hindrances: ResolvedEntry<Hindrance>[]
  onChange: (next: FeatureParameters) => void
}

const ATTRIBUTE_OPTIONS = ['agility', 'smarts', 'spirit', 'strength', 'vigor'] as const

const SKILL_OPTIONS = [
  'athletics',
  'common-knowledge',
  'fighting',
  'focus',
  'healing',
  'intimidation',
  'notice',
  'occult',
  'performance',
  'persuasion',
  'piloting',
  'repair',
  'research',
  'riding',
  'science',
  'shooting',
  'stealth',
  'survival',
  'taunt',
  'thievery',
] as const

const CORE_SKILL_OPTIONS = [
  'athletics',
  'common-knowledge',
  'notice',
  'persuasion',
  'stealth',
] as const

const ENVIRONMENT_OPTIONS = [
  'cold',
  'heat',
  'radiation',
  'electricity',
  'fire',
  'silver',
  'holy',
  'custom',
] as const

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown): string {
  return typeof value === 'number' ? String(value) : ''
}

export function FeatureParameterInput({
  ability,
  schema,
  value,
  edges,
  hindrances,
  onChange,
}: FeatureParameterInputProps) {
  const { t } = useTranslation('raceBuilder')
  const tt = (key: string, options?: Record<string, unknown>) =>
    String(t(key as never, options as never))

  function set(key: string, nextValue: unknown) {
    onChange({ ...value, [key]: nextValue })
  }

  const label = tt(schema.labelKey)

  if (schema.type === 'attribute-picker') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Select value={stringValue(value[schema.key])} onValueChange={next => set(schema.key, next)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('parameters.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ATTRIBUTE_OPTIONS.map(attribute => (
                <SelectItem key={attribute} value={attribute}>
                  {tt(`parameters.attributes.${attribute}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (schema.type === 'skill-picker') {
    const skillOptions = ability.id === 'fewer-core-skills' ? CORE_SKILL_OPTIONS : SKILL_OPTIONS

    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Select value={stringValue(value[schema.key])} onValueChange={next => set(schema.key, next)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('parameters.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {skillOptions.map(skill => (
                <SelectItem key={skill} value={skill}>
                  {tt(`parameters.skills.${skill}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (schema.type === 'cost-tier') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Select
          value={numberValue(value.costTier)}
          onValueChange={next => set('costTier', Number(next))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('parameters.costTierPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(ability.pointCostOptions ?? []).map(points => (
                <SelectItem key={points} value={String(points)}>
                  {t('abilityPicker.points', { points })}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (schema.type === 'freetext') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Input
          value={stringValue(value[schema.key])}
          onChange={event => set(schema.key, event.target.value)}
          placeholder={schema.placeholderKey ? tt(schema.placeholderKey) : undefined}
        />
      </div>
    )
  }

  if (schema.type === 'hindrance-ref') {
    const isMajor = value.isMajor === true

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>{label}</Label>
          <Select
            value={stringValue(value.hindranceId)}
            onValueChange={next => {
              const hindrance = hindrances.find(item => item.id === next)
              const nextIsMajor = hindrance?.type === 'Major'
              onChange({
                ...value,
                hindranceId: next,
                isMajor: nextIsMajor,
                costTier: nextIsMajor ? -2 : -1,
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('parameters.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {hindrances.map(hindrance => (
                  <SelectItem key={hindrance.id} value={hindrance.id}>
                    {hindrance.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={isMajor ? 'major' : 'minor'}
          onValueChange={next => {
            if (!next) return
            const nextIsMajor = next === 'major'
            onChange({
              ...value,
              isMajor: nextIsMajor,
              costTier: nextIsMajor ? -2 : -1,
            })
          }}
        >
          <ToggleGroupItem value="minor">{t('parameters.hindranceMinor')}</ToggleGroupItem>
          <ToggleGroupItem value="major">{t('parameters.hindranceMajor')}</ToggleGroupItem>
        </ToggleGroup>
      </div>
    )
  }

  if (schema.type === 'edge-ref') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Select
          value={stringValue(value.edgeId)}
          onValueChange={next => {
            const edge = edges.find(item => item.id === next)
            const costTier = ability.id === 'edge'
              ? computeRacialEdgeCost(edge?.requirements?.rank ?? 'Novice')
              : undefined
            onChange({ ...value, edgeId: next, costTier })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('parameters.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {edges.map(edge => (
                <SelectItem key={edge.id} value={edge.id}>
                  {edge.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select
        value={stringValue(value.environmentType)}
        onValueChange={next => set('environmentType', next)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('parameters.selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ENVIRONMENT_OPTIONS.map(environment => (
              <SelectItem key={environment} value={environment}>
                {tt(`parameters.environments.${environment}`)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {value.environmentType === 'custom' && (
        <Input
          value={stringValue(value.customEnvironment)}
          onChange={event => set('customEnvironment', event.target.value)}
          placeholder={t('parameters.customEnvironmentPlaceholder')}
        />
      )}
    </div>
  )
}
