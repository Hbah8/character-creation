import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoIcon, PlusIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import { FeatureParameterInput } from '@/racebuilder/components/FeatureParameterInput'
import {
  createRacialAbilityEffectLabels,
  formatRacialAbilityEffect,
  polarityLabel,
} from '@/racebuilder/components/racialAbilityEffectDisplay'
import { resolveRacialAbilityPointCost } from '@/racebuilder/services/raceBudget'
import { buildRacialAbilityEffects } from '@/racebuilder/services/racialAbilityEffects'
import {
  canSelectRacialAbility,
  getAvailableRacialAbilities,
  resolveRacialAbilitiesForWorld,
  type ResolvedRacialAbility,
} from '@/racebuilder/services/racialAbilityOptions'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { RacialAbilityRef } from '@/world/types'
import type {
  Edge,
  FeatureParameters,
  HandbookOverride,
  RacialAbility,
  RacialAbilityType,
  ResolvedEntry,
} from '@/types/handbook'

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

function normalizedRef(ref: RacialAbilityRef): Required<RacialAbilityRef> {
  return {
    id: ref.id,
    repeatCount: Math.max(1, ref.repeatCount ?? 1),
    parameters: { ...(ref.parameters ?? {}) },
  }
}

function hasRequiredParameter(parameters: FeatureParameters, key: string): boolean {
  const value = parameters[key]
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  return value !== undefined && value !== null
}

function areRequiredParametersFilled(
  ability: RacialAbility,
  parameters: FeatureParameters,
): boolean {
  return (ability.parameterSchema ?? []).every(schema => {
    if (schema.required === false) return true
    if (schema.type === 'environment-type' && parameters.environmentType === 'custom') {
      return hasRequiredParameter(parameters, 'customEnvironment')
    }
    return hasRequiredParameter(parameters, schema.key)
  })
}

function selectedKey(ref: RacialAbilityRef, index: number): string {
  return `${ref.id}:${JSON.stringify(ref.parameters ?? {})}:${index}`
}

function edgeOptionsForAbility(
  ability: RacialAbility,
  edges: ResolvedEntry<Edge>[],
): ResolvedEntry<Edge>[] {
  if (ability.id === 'diverse-development') {
    return edges.filter(edge => (edge.requirements?.rank ?? 'Novice') === 'Novice')
  }
  if (ability.id === 'edge') {
    return edges.filter(edge => (edge.requirements?.rank ?? 'Novice') !== 'Legendary')
  }
  return edges
}

export function RacialAbilityPicker({ value, onChange, worldId }: RacialAbilityPickerProps) {
  const { t } = useTranslation('raceBuilder')
  const tt = (key: string, options?: Record<string, unknown>) =>
    String(t(key as never, options as never))
  const { entries } = useWorldLibrary()
  const [pendingAbilityId, setPendingAbilityId] = useState<string | null>(null)
  const [pendingParameters, setPendingParameters] = useState<FeatureParameters>({})
  const [viewingSelectionIndex, setViewingSelectionIndex] = useState<number | null>(null)

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
  const edges = useMemo(
    () => resolveHandbookEntries('edge', worldHandbook, [...SWADE_EDGES]),
    [worldHandbook],
  )
  const hindrances = useMemo(
    () => resolveHandbookEntries('hindrance', worldHandbook, [...SWADE_HINDRANCES]),
    [worldHandbook],
  )
  const effectLabels = createRacialAbilityEffectLabels(tt, edges, hindrances)
  const available = useMemo(
    () => getAvailableRacialAbilities(abilities, value),
    [abilities, value],
  )
  const availableByType = useMemo(() => groupByType(available), [available])

  const pendingAbility = pendingAbilityId ? abilityById.get(pendingAbilityId) ?? null : null
  const canConfirmPending = pendingAbility
    ? areRequiredParametersFilled(pendingAbility, pendingParameters) &&
      canSelectRacialAbility(pendingAbility, value, pendingParameters)
    : false

  function addAbility(ability: ResolvedRacialAbility, parameters: FeatureParameters = {}) {
    if (!canSelectRacialAbility(ability, value, parameters)) return

    const hasParameters = (ability.parameterSchema ?? []).length > 0
    if (!hasParameters && ability.maxRepeat !== 'unlimited') {
      const existingIndex = value.findIndex(ref => ref.id === ability.id)
      if (existingIndex >= 0) {
        onChange(value.map((ref, index) => {
          if (index !== existingIndex) return ref
          const existing = normalizedRef(ref)
          return { ...existing, repeatCount: existing.repeatCount + 1 }
        }))
        return
      }
    }

    onChange([...value, { id: ability.id, repeatCount: 1, parameters: { ...parameters } }])
  }

  function removeAbility(indexToRemove: number) {
    const current = normalizedRef(value[indexToRemove])
    if (current.repeatCount > 1) {
      onChange(value.map((ref, index) =>
        index === indexToRemove ? { ...current, repeatCount: current.repeatCount - 1 } : ref
      ))
      return
    }
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  function startAddAbility(ability: ResolvedRacialAbility) {
    if ((ability.parameterSchema ?? []).length === 0) {
      addAbility(ability)
      return
    }
    setPendingAbilityId(ability.id)
    setPendingParameters({})
  }

  function confirmPendingAbility() {
    if (!pendingAbility || !canConfirmPending) return
    addAbility(pendingAbility, pendingParameters)
    setPendingAbilityId(null)
    setPendingParameters({})
  }

  function cancelPendingAbility() {
    setPendingAbilityId(null)
    setPendingParameters({})
  }

  function effectsForRef(ref: RacialAbilityRef) {
    const normalized = normalizedRef(ref)
    return buildRacialAbilityEffects(normalized, abilityById.get(ref.id), effectLabels)
  }

  function effectSummary(ref: RacialAbilityRef): string {
    return effectsForRef(ref)
      .map(effect => formatRacialAbilityEffect(effect, tt))
      .join(' · ')
  }

  const viewingRef = viewingSelectionIndex === null ? null : value[viewingSelectionIndex] ?? null
  const viewingNormalized = viewingRef ? normalizedRef(viewingRef) : null
  const viewingAbility = viewingRef ? abilityById.get(viewingRef.id) ?? null : null
  const viewingEffects = viewingRef ? effectsForRef(viewingRef) : []
  const viewingCost = viewingNormalized
    ? resolveRacialAbilityPointCost(viewingNormalized, viewingAbility ?? undefined) *
      viewingNormalized.repeatCount
    : 0

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t('abilityPicker.selected')}</h3>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('abilityPicker.noneSelected')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {value.map((ref, index) => {
              const normalized = normalizedRef(ref)
              const ability = abilityById.get(ref.id)
              const label = ability?.name ?? t('abilityPicker.unknownAbility', { id: ref.id })
              const cost = resolveRacialAbilityPointCost(normalized, ability)
              const summary = effectSummary(normalized)
              return (
                <div
                  key={selectedKey(ref, index)}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{label}</span>
                      {normalized.repeatCount > 1 && (
                        <Badge variant="outline">{t('abilityPicker.repeatCount', { count: normalized.repeatCount })}</Badge>
                      )}
                      <Badge variant={cost < 0 ? 'destructive' : 'secondary'}>
                        {t('abilityPicker.points', { points: cost * normalized.repeatCount })}
                      </Badge>
                    </div>
                    {summary && (
                      <p className="text-xs text-muted-foreground">{summary}</p>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewingSelectionIndex(index)}
                        aria-label={`${t('actions.viewAbility')}: ${label}`}
                      >
                        <InfoIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('actions.viewAbility')}</TooltipContent>
                  </Tooltip>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeAbility(index)}
                    aria-label={`${t('actions.removeAbility')}: ${label}`}
                  >
                    <XIcon />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">{t('abilityPicker.available')}</h3>
        {available.length === 0 ? (
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
                    <div key={ability.id} className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto justify-start whitespace-normal text-left"
                        onClick={() => startAddAbility(ability)}
                      >
                        <PlusIcon data-icon="inline-start" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-2">
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
                          <span className="text-xs text-muted-foreground">
                            {ability.pointCostOptions
                              ? t('abilityPicker.pointOptions', { points: ability.pointCostOptions.join(' / ') })
                              : t('abilityPicker.points', { points: ability.points ?? 0 })}
                          </span>
                        </span>
                      </Button>
                      {pendingAbility?.id === ability.id && (
                        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
                          {(ability.parameterSchema ?? []).map(schema => (
                            <FeatureParameterInput
                              key={schema.key}
                              ability={ability}
                              schema={schema}
                              value={pendingParameters}
                              edges={edgeOptionsForAbility(ability, edges)}
                              hindrances={hindrances}
                              onChange={setPendingParameters}
                            />
                          ))}
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={cancelPendingAbility}>
                              {t('actions.cancel')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={confirmPendingAbility}
                              disabled={!canConfirmPending}
                            >
                              {t('actions.addAbility')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

        <Dialog
          open={viewingRef !== null}
          onOpenChange={open => {
            if (!open) setViewingSelectionIndex(null)
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {viewingAbility?.name ?? t('abilityPicker.unknownAbility', { id: viewingRef?.id ?? '' })}
              </DialogTitle>
              <DialogDescription>
                {t('abilityPicker.detailMeta', {
                  points: viewingCost,
                  repeat: viewingNormalized?.repeatCount ?? 1,
                  source: viewingAbility?.source === 'world'
                    ? t('abilityPicker.sourceWorld')
                    : t('abilityPicker.sourceSystem'),
                })}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[60vh] pr-3">
              <div className="flex flex-col gap-4">
                <section className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium">{t('effects.detailTitle')}</h4>
                  <ul className="flex flex-col gap-1.5">
                    {viewingEffects.map((effect, index) => (
                      <li
                        key={`${effect.id}:${effect.messageKey}:${index}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Badge
                          variant={
                            effect.polarity === 'penalty'
                              ? 'destructive'
                              : effect.polarity === 'bonus'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="mt-0.5 shrink-0"
                        >
                          {polarityLabel(effect.polarity, tt)}
                        </Badge>
                        <span>{formatRacialAbilityEffect(effect, tt)}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {viewingAbility?.description && (
                  <section className="flex flex-col gap-2">
                    <h4 className="text-sm font-medium">{t('abilityPicker.description')}</h4>
                    <p className="text-sm text-muted-foreground">{viewingAbility.description}</p>
                  </section>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
