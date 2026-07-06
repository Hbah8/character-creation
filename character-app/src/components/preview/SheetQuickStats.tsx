import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetQuickStats({ character }: Props) {
  const { t } = useTranslation('preview')
  return (
    <div className="quick-stats">
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.pace')}</span>
        <span className="qs-value">{character.pace}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.parry')}</span>
        <span className="qs-value">{character.parry}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.toughness')}</span>
        <span className="qs-value">{character.toughness}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.bennies')}</span>
        <span className="qs-value">{character.bennies}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.mana')}</span>
        <span className="qs-value">{character.mana || '—'}</span>
      </div>
      {!!character.size && (
        <>
          <span className="qs-sep">/</span>
          <div className="quick-stat">
            <span className="qs-label">{t('quickStats.size')}</span>
            <span className="qs-value">{character.size > 0 ? `+${character.size}` : character.size}</span>
          </div>
        </>
      )}
    </div>
  )
}
