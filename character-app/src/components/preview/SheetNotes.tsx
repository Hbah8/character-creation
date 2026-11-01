import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import type { Character } from '@/types/character'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'
import { SheetMarksContent } from './templates/SheetMarks'

interface Props {
  character: Character
  combat: Pick<ResolvedCombatStats, 'maxWounds' | 'maxFatigue'>
}

export function SheetNotes({ character, combat }: Props) {
  const { t } = useTranslation('preview')

  return (
    <section className="markers">
      <div className="section-title">{t('sections.notes')}</div>
      <div className="markers-body">
        <SheetMarksContent combat={combat} />
        {character.notes && (
          <div className="markers-notes">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{character.notes}</ReactMarkdown>
          </div>
        )}
      </div>
    </section>
  )
}
