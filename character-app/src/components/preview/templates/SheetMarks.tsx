import { useTranslation } from 'react-i18next'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'

type MarkStats = Pick<ResolvedCombatStats, 'maxWounds' | 'maxFatigue'>

function boxes(count: number) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => (
    <span key={index} className="marker-box">□</span>
  ))
}

export function SheetMarksContent({ combat }: { combat: MarkStats }) {
  const { t } = useTranslation('preview')

  return (
    <>
      <div className="markers-row">
        <span className="marker-label">{t('notes.shock')}</span>
        <span className="marker-box">□</span>
        <span className="marker-gap" />
        <span className="marker-label">{t('notes.wounds')}</span>
        {boxes(combat.maxWounds)}
        <span className="marker-gap" />
        <span className="marker-label">{t('notes.fatigue')}</span>
        {boxes(combat.maxFatigue)}
      </div>
      <div className="markers-effects">
        <span className="marker-label">{t('notes.tempEffects')}</span>
        <span className="marker-line" />
      </div>
    </>
  )
}

export function SheetMarks({ combat }: { combat: MarkStats }) {
  const { t } = useTranslation('preview')

  return (
    <section className="section compact-marks">
      <div className="section-title">{t('sections.notes')}</div>
      <div className="compact-marks-body">
        <SheetMarksContent combat={combat} />
      </div>
    </section>
  )
}
