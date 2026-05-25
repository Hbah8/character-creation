import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import {
  getAvailableRacialAbilities,
  resolveRacialAbilitiesForWorld,
  type ResolvedRacialAbility,
} from '@/racebuilder/services/racialAbilityOptions'
import type { RacialAbilityRef } from '@/world/types'
import type { HandbookOverride, RacialAbilityType } from '@/types/handbook'

const EMPTY_HANDBOOK: HandbookOverride[] = []
const ABILITY_TYPES: RacialAbilityType[] = ['positive', 'negative']

interface RacialAbilityPickerProps {
  value: RacialAbilityRef[]
  onChange: (next: RacialAbilityRef[]) => void
  worldId: string | null
}

function groupByType(abilities: ResolvedRacialAbility[]) {
  return {
    positive: abilities.filter(ability => ability.type === 'positive'),
    negative: abilities.filter(ability => ability.type === 'negative'),
  }
}

export function RacialAbilityPicker({ value, onChange, worldId }: RacialAbilityPickerProps) {
  const { t } = useTranslation('raceBuilder')
  const { entries } = useWorldLibrary()

  const activeWorld = worldId
    ? entries.find(entry => entry.id === worldId)?.world ?? null
    : null
  const worldHandbook = activeWorld?.worldHandbook ?? EMPTY_HANDBOOK

  const abilities = useMemo(
    () => resolveRacialAbilitiesForWorld(worldHandbook),
    [worldHandbook],
  )
  const abilityById = useMemo(
    () => new Map(abilities.map(ability => [ability.id, ability])),
    [abilities],
  )
  const availableByType = useMemo(
    () => groupByType(getAvailableRacialAbilities(abilities, value)),
    [abilities, value],
  )

  function addAbility(id: string) {
    if (value.some(ability => ability.id === id)) return
    onChange([...value, { id }])
  }

  function removeAbility(id: string) {
    onChange(value.filter(ability => ability.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t('abilityPicker.selected')}</h3>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('abilityPicker.noneSelected')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map(ref => {
              const ability = abilityById.get(ref.id)
              const label = ability?.name ?? t('abilityPicker.unknownAbility', { id: ref.id })
              return (
                <Badge key={ref.id} variant="secondary" className="h-7 gap-1 pr-1">
                  <span>{label}</span>
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-muted"
                    onClick={() => removeAbility(ref.id)}
                    aria-label={`${t('actions.removeAbility')}: ${label}`}
                  >
                    <XIcon />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">{t('abilityPicker.available')}</h3>
        {getAvailableRacialAbilities(abilities, value).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('abilityPicker.noneAvailable')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {ABILITY_TYPES.map(type => (
              <section key={type} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(`abilityPicker.${type}`)}
                  </h4>
                  <Badge variant="outline">{availableByType[type].length}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {availableByType[type].map(ability => (
                    <Button
                      key={ability.id}
                      type="button"
                      variant="outline"
                      className="h-auto justify-start whitespace-normal text-left"
                      onClick={() => addAbility(ability.id)}
                    >
                      <PlusIcon data-icon="inline-start" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate">{ability.name}</span>
                          <Badge variant={ability.source === 'world' ? 'default' : 'secondary'}>
                            {ability.source === 'world'
                              ? t('abilityPicker.sourceWorld')
                              : t('abilityPicker.sourceSystem')}
                          </Badge>
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {ability.description}
                        </span>
                        {ability.points !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {t('abilityPicker.points', { points: ability.points })}
                          </span>
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
