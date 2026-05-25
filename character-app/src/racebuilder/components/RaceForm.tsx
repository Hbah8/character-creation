import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { RacialAbilityPicker } from '@/racebuilder/components/RacialAbilityPicker'
import { addRaceToWorld, updateRaceInWorld } from '@/world/store/useWorldStore'
import type { Race, RacialAbilityRef, World } from '@/world/types'

const RACE_SIZE_OPTIONS = [
  { value: -2, labelKey: 'form.sizeOptions.minus2' },
  { value: -1, labelKey: 'form.sizeOptions.minus1' },
  { value: 0, labelKey: 'form.sizeOptions.zero' },
  { value: 1, labelKey: 'form.sizeOptions.plus1' },
  { value: 2, labelKey: 'form.sizeOptions.plus2' },
  { value: 3, labelKey: 'form.sizeOptions.plus3' },
  { value: 4, labelKey: 'form.sizeOptions.plus4' },
] as const

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
  const [size, setSize] = useState(0)
  const [abilities, setAbilities] = useState<RacialAbilityRef[]>([])
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    setName(race?.name ?? '')
    setDescription(race?.description ?? '')
    setSize(race?.size ?? 0)
    setAbilities(race?.abilities.map(ability => ({ ...ability })) ?? [])
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
      size,
      abilities: abilities.map(ability => ({ ...ability })),
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
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? t('form.createTitle') : t('form.editTitle')}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="race-size">{t('form.size')}</Label>
              <Select value={String(size)} onValueChange={value => setSize(Number(value))}>
                <SelectTrigger id="race-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RACE_SIZE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
