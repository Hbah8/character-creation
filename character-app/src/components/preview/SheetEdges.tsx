import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetEdges({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.edges.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.edges')}</div>
      <div className="list">
        {character.edges.map(edge => (
          <p key={edge.id} className="item">
            <strong>{edge.name}</strong>
            {edge.effect ? ` - ${edge.effect}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
