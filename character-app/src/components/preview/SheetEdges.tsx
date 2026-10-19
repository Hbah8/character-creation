import { useTranslation } from 'react-i18next'
import type { ResolvedCharacterEdge } from '@/handbooks/services/resolveCharacterEdges'

interface Props {
  edges: ResolvedCharacterEdge[]
}

export function SheetEdges({ edges }: Props) {
  const { t } = useTranslation('preview')
  if (edges.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.edges')}</div>
      <div className="list">
        {edges.map(edge => (
          <p key={edge.id} className="item">
            <strong>{edge.name}</strong>
            {edge.description ? ` - ${edge.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
