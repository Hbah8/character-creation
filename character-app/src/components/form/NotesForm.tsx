import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Character } from '@/types/character'

interface Props {
  notes: Character['notes']
  onChange: (value: string) => void
}

export function NotesForm({ notes, onChange }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.notes')}</h2>
      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">{t('notes.label')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => onChange(e.target.value)}
          placeholder={t('notes.placeholder')}
          rows={4}
        />
      </div>
    </div>
  )
}
