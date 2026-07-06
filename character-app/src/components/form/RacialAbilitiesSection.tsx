import { useTranslation } from 'react-i18next'
import { resolveRacialAbilitiesForWorld } from '@/racebuilder/services/racialAbilityOptions'
import type { RacialAbilityRef } from '@/world/types'
import type { HandbookOverride } from '@/types/handbook'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'

// Pure function exported for unit testing.
// Maps each RacialAbilityRef to its display name using the merged handbook catalog.
// Falls back to the raw ability id if the ability is not found.
export function resolveRaceAbilityNames(
  abilityRefs: RacialAbilityRef[],
  worldHandbook: HandbookOverride[],
): string[] {
  const catalog = resolveRacialAbilitiesForWorld(worldHandbook)
  return abilityRefs.map(ref => {
    const found = catalog.find(a => a.id === ref.id)
    return found ? found.name : ref.id
  })
}

interface Props {
  raceId: string | undefined
  worldId: string | undefined
}

export function RacialAbilitiesSection({ raceId, worldId }: Props) {
  const { t } = useTranslation('form')
  const { entries } = useWorldLibrary()

  if (!raceId) return null

  const world = entries.find(e => e.id === worldId)?.world ?? null
  const race = world?.races.find(r => r.id === raceId) ?? null

  if (!race) return null

  const abilityNames = resolveRaceAbilityNames(race.abilities, world?.worldHandbook ?? [])

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t('identity.race.abilitiesTitle')}
      </h3>
      {abilityNames.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('identity.race.noAbilities')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {abilityNames.map((name, index) => (
            <li key={index} className="text-sm">
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
