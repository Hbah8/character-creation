import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetSpecialRules({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.specialRules.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.specialRules')}</div>
      <div className="list">
        {character.specialRules.map(rule => (
          <p key={rule.id} className="item">
            <strong>{rule.name}</strong>
            {rule.description ? ` - ${rule.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
