import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character } from '@/types/character'
import { PortraitUpload } from '@/components/form/PortraitUpload'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

export function IdentityForm({ character, onChange }: Props) {
  const { t } = useTranslation('form')
  const { entries, activeWorldId } = useWorldLibrary()
  const activeWorld = entries.find(e => e.id === activeWorldId)?.world ?? null
  const races = activeWorld?.races ?? []

  function handleRaceChange(value: string) {
    if (value === '__none__') {
      onChange('raceId', undefined)
      onChange('raceName', undefined)
      onChange('size', undefined)
      return
    }
    const race = races.find(r => r.id === value)
    if (!race) return
    onChange('raceId', race.id)
    onChange('raceName', race.name)
    // Keep character.size as a non-racial modifier; racial size is derived from the race's abilities.
    onChange('size', 0)
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.identity')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="sheetTitle">{t('identity.sheetTitle')}</Label>
          <Input id="sheetTitle" value={character.sheetTitle} onChange={e => onChange('sheetTitle', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="callsign">{t('identity.callsign')}</Label>
          <Input id="callsign" value={character.callsign} onChange={e => onChange('callsign', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">{t('identity.name')}</Label>
          <Input id="name" value={character.name} onChange={e => onChange('name', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="rank">{t('identity.rank')}</Label>
          <Input id="rank" value={character.rank} onChange={e => onChange('rank', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="role">{t('identity.role')}</Label>
          <Input id="role" value={character.role} onChange={e => onChange('role', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="fileNo">{t('identity.fileNo')}</Label>
          <Input id="fileNo" value={character.fileNo} onChange={e => onChange('fileNo', e.target.value)} />
        </div>
        {races.length > 0 && (
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="race">{t('identity.race.label')}</Label>
            <Select value={character.raceId ?? '__none__'} onValueChange={handleRaceChange}>
              <SelectTrigger id="race">
                <SelectValue placeholder={t('identity.race.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('identity.race.noRace')}</SelectItem>
                {races.map(race => (
                  <SelectItem key={race.id} value={race.id}>
                    {race.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="col-span-2">
          <PortraitUpload value={character.portraitUrl} onChange={val => onChange('portraitUrl', val)} />
        </div>
      </div>
    </div>
  )
}
