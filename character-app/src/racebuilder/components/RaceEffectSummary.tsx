import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import {
  createRacialAbilityEffectLabels,
  formatRacialAbilityEffect,
  polarityLabel,
  signed,
} from '@/racebuilder/components/racialAbilityEffectDisplay'
import { computeSizeFromAbilities } from '@/racebuilder/services/raceBudget'
import {
  buildRaceEffectSummary,
  type RacialAbilityEffect,
  type RacialAbilityEffectCategory,
} from '@/racebuilder/services/racialAbilityEffects'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { RacialAbilityRef, World } from '@/world/types'

interface RaceEffectSummaryProps {
  abilities: RacialAbilityRef[]
  catalog: ResolvedRacialAbility[]
  world: World
}

const CATEGORY_ORDER: RacialAbilityEffectCategory[] = [
  'traits',
  'skills',
  'combat',
  'movement',
  'senses',
  'durability',
  'physiology',
  'powers',
  'social',
  'drawbacks',
  'other',
]

function badgeVariant(effect: RacialAbilityEffect): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (effect.polarity === 'penalty') return 'destructive'
  if (effect.polarity === 'bonus') return 'secondary'
  return 'outline'
}

export function RaceEffectSummary({ abilities, catalog, world }: RaceEffectSummaryProps) {
  const { t } = useTranslation('raceBuilder')
  const tt = (key: string, options?: Record<string, unknown>) =>
    String(t(key as never, options as never))

  const edges = useMemo(
    () => resolveHandbookEntries('edge', world.worldHandbook ?? [], [...SWADE_EDGES]),
    [world.worldHandbook],
  )
  const hindrances = useMemo(
    () => resolveHandbookEntries('hindrance', world.worldHandbook ?? [], [...SWADE_HINDRANCES]),
    [world.worldHandbook],
  )
  const labels = createRacialAbilityEffectLabels(tt, edges, hindrances)
  const effects = buildRaceEffectSummary(abilities, catalog, labels)
  const size = computeSizeFromAbilities(abilities)
  const groupedEffects = CATEGORY_ORDER
    .map(category => ({
      category,
      effects: effects.filter(effect => effect.category === category),
    }))
    .filter(group => group.effects.length > 0)

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t('effects.summaryTitle')}</h3>
        <Badge variant="outline">
          {t('effects.sizeFromAbilities', { size: signed(size) })}
        </Badge>
      </div>

      {effects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('effects.empty')}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groupedEffects.map(group => (
            <section key={group.category} className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`effects.categories.${group.category}`)}
              </h4>
              <ul className="flex flex-col gap-1.5">
                {group.effects.map((effect, index) => (
                  <li key={`${effect.id}:${effect.messageKey}:${index}`} className="flex items-start gap-2 text-sm">
                    <Badge variant={badgeVariant(effect)} className="mt-0.5 shrink-0">
                      {polarityLabel(effect.polarity, tt)}
                    </Badge>
                    <span>{formatRacialAbilityEffect(effect, tt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
