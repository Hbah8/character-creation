import { useTranslation } from 'react-i18next'
import type { ResolvedCharacterHindrance } from '@/types/character'

interface Props {
  hindrances: ResolvedCharacterHindrance[]
  variant?: 'default' | 'compact'
}

export function SheetHindrances({ hindrances, variant = 'default' }: Props) {
  const { t } = useTranslation('preview')
  if (hindrances.length === 0) return null
  return (
    <section className={variant === 'compact' ? 'section compact-hindrances' : 'section'}>
      <div className="section-title">{t('sections.hindrances')}</div>
      <div className={variant === 'compact' ? 'list compact-hindrances-list' : 'list'}>
        {hindrances.map(h => (
          <p key={h.id} className={variant === 'compact' ? 'item compact-markerless-item' : 'item'}>
            <strong>{h.name}{h.severity ? ` (${h.severity === 'minor' ? t('hindrances.severityMinor') : t('hindrances.severityMajor')})` : ''}</strong>
            {h.description ? ` - ${h.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
