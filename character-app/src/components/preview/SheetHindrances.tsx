import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetHindrances({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.hindrances.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.hindrances')}</div>
      <div className="list">
        {character.hindrances.map(h => (
          <p key={h.id} className="item">
            <strong>{h.name}{h.severity ? ` (${h.severity === 'minor' ? t('hindrances.severityMinor') : t('hindrances.severityMajor')})` : ''}</strong>
            {h.description ? ` - ${h.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
