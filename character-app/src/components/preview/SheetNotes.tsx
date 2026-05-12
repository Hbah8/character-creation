import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

function boxes(count: number) {
  return Array.from({ length: Math.max(0, count) }, (_, i) => (
    <span key={i} className="marker-box">□</span>
  ))
}

export function SheetNotes({ character }: Props) {
  const { t } = useTranslation('preview')
  const woundCount = parseInt(character.wounds) || 3
  const fatigueCount = parseInt(character.fatigue) || 2

  return (
    <section className="markers">
      <div className="section-title">{t('sections.notes')}</div>
      <div className="markers-body">
        <div className="markers-row">
          <span className="marker-label">{t('notes.shock')}</span>
          <span className="marker-box">□</span>
          <span className="marker-gap" />
          <span className="marker-label">{t('notes.wounds')}</span>
          {boxes(woundCount)}
          <span className="marker-gap" />
          <span className="marker-label">{t('notes.fatigue')}</span>
          {boxes(fatigueCount)}
        </div>
        <div className="markers-effects">
          <span className="marker-label">{t('notes.tempEffects')}</span>
          <span className="marker-line" />
        </div>
        {character.notes && (
          <div className="markers-notes">{character.notes}</div>
        )}
      </div>
    </section>
  )
}
