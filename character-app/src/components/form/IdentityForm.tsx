import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character } from '@/types/character'

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

export function IdentityForm({ character, onChange }: Props) {
  const { t } = useTranslation('form')
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
        <div className="flex flex-col gap-1">
          <Label htmlFor="portraitUrl">{t('identity.portraitUrl')}</Label>
          <Input id="portraitUrl" value={character.portraitUrl} onChange={e => onChange('portraitUrl', e.target.value)} placeholder={t('identity.portraitUrlPlaceholder')} />
        </div>
      </div>
    </div>
  )
}
