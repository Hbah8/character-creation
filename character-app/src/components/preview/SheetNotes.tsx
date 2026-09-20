import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Character } from '@/types/character'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'

interface Props {
  character: Character
  combat: Pick<ResolvedCombatStats, 'maxWounds' | 'maxFatigue'>
}

function boxes(count: number) {
  return Array.from({ length: Math.max(0, count) }, (_, i) => (
    <span key={i} className="marker-box">□</span>
  ))
}

export function SheetNotes({ character, combat }: Props) {
  const { t } = useTranslation('preview')

  return (
    <section className="markers">
      <div className="section-title">{t('sections.notes')}</div>
      <div className="markers-body">
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
        {character.notes && (
          <div className="markers-notes">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{character.notes}</ReactMarkdown>
          </div>
        )}
      </div>
    </section>
  )
}
