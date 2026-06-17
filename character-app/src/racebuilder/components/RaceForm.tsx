import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { RaceBudgetTracker } from '@/racebuilder/components/RaceBudgetTracker'
import { RaceEffectSummary } from '@/racebuilder/components/RaceEffectSummary'
import { RacialAbilityPicker } from '@/racebuilder/components/RacialAbilityPicker'
import { computeSizeFromAbilities } from '@/racebuilder/services/raceBudget'
import { resolveRacialAbilitiesForWorld } from '@/racebuilder/services/racialAbilityOptions'
import { addRaceToWorld, updateRaceInWorld } from '@/world/store/useWorldStore'
import type { Race, RacialAbilityRef, World } from '@/world/types'

function normalizeAbilityRef(ref: RacialAbilityRef): RacialAbilityRef {
  return {
    id: ref.id === 'agile' ? 'attribute-bonus' : ref.id,
    repeatCount: Math.max(1, ref.repeatCount ?? 1),
    parameters: ref.id === 'agile'
      ? { attributeId: 'agility', ...(ref.parameters ?? {}) }
      : { ...(ref.parameters ?? {}) },
  }
}

interface RaceFormBaseProps {
  worldId: string
  world: World
  onSaved: (nextWorld: World) => void
  onCancel: () => void
}

type RaceFormProps = RaceFormBaseProps & (
  | { mode: 'create'; race?: undefined }
  | { mode: 'edit'; race: Race }
)

export function RaceForm({ mode, race, worldId, world, onSaved, onCancel }: RaceFormProps) {
  const { t } = useTranslation('raceBuilder')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [abilities, setAbilities] = useState<RacialAbilityRef[]>([])
  const [nameError, setNameError] = useState<string | null>(null)
  const derivedSize = computeSizeFromAbilities(abilities)
  const catalog = useMemo(
    () => resolveRacialAbilitiesForWorld(world.worldHandbook ?? []),
    [world.worldHandbook],
  )
  const draftRace = useMemo<Race>(() => ({
    id: race?.id ?? 'draft-race',
    name,
    description,
    size: derivedSize,
    abilities,
  }), [abilities, derivedSize, description, name, race?.id])

  useEffect(() => {
    setName(race?.name ?? '')
    setDescription(race?.description ?? '')
    setAbilities(race?.abilities.map(normalizeAbilityRef) ?? [])
    setNameError(null)
  }, [race])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setNameError(t('form.nameRequired'))
      return
    }

    const nextRace: Race = {
      id: mode === 'create' ? crypto.randomUUID() : race.id,
      name: trimmedName,
      description: description.trim(),
      size: computeSizeFromAbilities(abilities),
      abilities: abilities.map(normalizeAbilityRef),
    }
    const worldWithRaces: World = {
      ...world,
      races: world.races ?? [],
    }

    const nextWorld = mode === 'create'
      ? addRaceToWorld(worldWithRaces, nextRace)
      : updateRaceInWorld(worldWithRaces, race.id, nextRace)

    onSaved(nextWorld)
  }

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? t('form.createTitle') : t('form.editTitle')}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-5">
          <RaceEffectSummary abilities={abilities} world={world} catalog={catalog} />

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2" data-invalid={nameError ? true : undefined}>
              <Label htmlFor="race-name">{t('form.name')}</Label>
              <Input
                id="race-name"
                value={name}
                onChange={event => {
                  setName(event.target.value)
                  setNameError(null)
                }}
                placeholder={t('form.namePlaceholder')}
                aria-invalid={nameError ? true : undefined}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="race-description">{t('form.description')}</Label>
            <Textarea
              id="race-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              rows={4}
            />
          </div>

          <Separator />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">{t('form.abilities')}</h2>
            <RacialAbilityPicker
              value={abilities}
              onChange={setAbilities}
              worldId={worldId}
            />
            <div className="sticky bottom-0 z-10 -mx-4 bg-card/95 px-4 py-3 backdrop-blur">
              <RaceBudgetTracker race={draftRace} world={world} catalog={catalog} />
            </div>
          </section>
        </CardContent>
        <CardFooter className="mt-4 justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <ArrowLeftIcon data-icon="inline-start" />
            {t('actions.cancel')}
          </Button>
          <Button type="submit">
            <SaveIcon data-icon="inline-start" />
            {t('actions.save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
