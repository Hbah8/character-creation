import { useTranslation } from 'react-i18next'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'
import { formatToughness } from '@/utils/toughnessUtils'

interface Props {
  combat: ResolvedCombatStats
}

export function SheetQuickStats({ combat }: Props) {
  const { t } = useTranslation('preview')
  return (
    <div className="quick-stats">
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.pace')}</span>
        <span className="qs-value">{combat.pace}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.parry')}</span>
        <span className="qs-value">{combat.parry}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.toughness')}</span>
        <span className="qs-value">{formatToughness(combat.toughness, combat.armor)}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.runningDie')}</span>
        <span className="qs-value">{combat.runningDie}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.bennies')}</span>
        <span className="qs-value">{combat.bennies}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.mana')}</span>
        <span className="qs-value">{combat.powerPoints || '—'}</span>
      </div>
      {!!combat.size && (
        <>
          <span className="qs-sep">/</span>
          <div className="quick-stat">
            <span className="qs-label">{t('quickStats.size')}</span>
            <span className="qs-value">{combat.size > 0 ? `+${combat.size}` : combat.size}</span>
          </div>
        </>
      )}
    </div>
  )
}
