import type {
  RacialAbilityEffect,
  RacialAbilityEffectLabels,
  RacialAbilityEffectPolarity,
} from '@/racebuilder/services/racialAbilityEffects'
import type { Edge, FeatureParameters, Hindrance, ResolvedEntry } from '@/types/handbook'

type Translator = (key: string, options?: Record<string, unknown>) => string

function parameterString(parameters: FeatureParameters, key: string): string | null {
  const value = parameters[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

export function createRacialAbilityEffectLabels(
  t: Translator,
  edges: ResolvedEntry<Edge>[],
  hindrances: ResolvedEntry<Hindrance>[],
): RacialAbilityEffectLabels {
  return {
    attribute: id => id === 'unknown' ? t('effects.values.unspecified') : t(`parameters.attributes.${id}`),
    skill: id => id === 'unknown' ? t('effects.values.unspecified') : t(`parameters.skills.${id}`),
    edge: id => edges.find(edge => edge.id === id)?.name ?? t('effects.values.unspecified'),
    hindrance: id =>
      hindrances.find(hindrance => hindrance.id === id)?.name ?? t('effects.values.unspecified'),
    environment: parameters => {
      const environmentType = parameterString(parameters, 'environmentType')
      if (environmentType === 'custom') {
        return parameterString(parameters, 'customEnvironment') ?? t('effects.values.unspecified')
      }
      return environmentType
        ? t(`parameters.environments.${environmentType}`)
        : t('effects.values.unspecified')
    },
    target: parameters => parameterString(parameters, 'targetLabel') ?? t('effects.values.unspecified'),
  }
}

export function formatRacialAbilityEffect(
  effect: RacialAbilityEffect,
  t: Translator,
): string {
  const values = { ...(effect.values ?? {}) }
  if (values.severity === 'Major') values.severity = t('parameters.hindranceMajor')
  if (values.severity === 'Minor') values.severity = t('parameters.hindranceMinor')

  return t(`effects.items.${effect.messageKey}`, values)
}

export function polarityLabel(
  polarity: RacialAbilityEffectPolarity,
  t: Translator,
): string {
  return t(`effects.polarity.${polarity}`)
}
