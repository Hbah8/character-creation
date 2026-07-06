import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import {
  createRacialAbilityEffectLabels,
  formatRacialAbilityEffect,
} from '@/racebuilder/components/racialAbilityEffectDisplay'
import { buildRaceEffectSummary } from '@/racebuilder/services/racialAbilityEffects'
import { resolveRacialAbilitiesForWorld } from '@/racebuilder/services/racialAbilityOptions'
import type { Race, World } from '@/world/types'

interface Props {
  race: Race | null
  world: World | null
}

/**
 * Read-only preview block that renders the racial ability effect lines for a character sheet.
 * Renders nothing when race is null or the race has no abilities with effects.
 *
 * Receives `race` and `world` as props so the component is independently testable.
 */
export function SheetRacialAbilities({ race, world }: Props) {
  const { t } = useTranslation('raceBuilder')
  const { t: tPreview } = useTranslation('preview')
  const tt = (key: string, options?: Record<string, unknown>) =>
    String(t(key as never, options as never))

  const edges = useMemo(
    () => resolveHandbookEntries('edge', world?.worldHandbook ?? [], [...SWADE_EDGES]),
    [world],
  )
  const hindrances = useMemo(
    () => resolveHandbookEntries('hindrance', world?.worldHandbook ?? [], [...SWADE_HINDRANCES]),
    [world],
  )
  const catalog = useMemo(
    () => resolveRacialAbilitiesForWorld(world?.worldHandbook ?? []),
    [world],
  )

  const effects = useMemo(() => {
    if (!race) return []
    const labels = createRacialAbilityEffectLabels(tt, edges, hindrances)
    return buildRaceEffectSummary(race.abilities, catalog, labels)
  // tt is a stable wrapper around the i18n `t` function — exclude from deps intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race, catalog, edges, hindrances])

  if (!race) return null

  if (effects.length === 0) return null

  return (
    <section className="section racial-abilities-section">
      <div className="section-title">{tPreview('sections.racialAbilities')}</div>
      <ul className="racial-abilities-list">
        {effects.map((effect, index) => (
          <li key={`${effect.id}:${effect.messageKey}:${index}`} className="racial-ability-line">
            <span className="racial-ability-marker" aria-hidden="true" />
            <span>{formatRacialAbilityEffect(effect, tt)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
