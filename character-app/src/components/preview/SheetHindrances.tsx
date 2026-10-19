import { useTranslation } from 'react-i18next'
import type { ResolvedCharacterHindrance } from '@/types/character'

interface Props {
  hindrances: ResolvedCharacterHindrance[]
}

export function SheetHindrances({ hindrances }: Props) {
  const { t } = useTranslation('preview')
  if (hindrances.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.hindrances')}</div>
      <div className="list">
        {hindrances.map(h => (
          <p key={h.id} className="item">
            <strong>{h.name}{h.severity ? ` (${h.severity === 'minor' ? t('hindrances.severityMinor') : t('hindrances.severityMajor')})` : ''}</strong>
            {h.description ? ` - ${h.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
