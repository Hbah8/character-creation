import { useTranslation } from 'react-i18next'
import type { ResolvedCharacterEdge } from '@/handbooks/services/resolveCharacterEdges'
import { groupResolvedCharacterEdges } from '@/handbooks/services/resolveCharacterEdges'

interface Props {
  edges: ResolvedCharacterEdge[]
  variant?: 'default' | 'compact'
}

export function SheetEdges({ edges, variant = 'default' }: Props) {
  const { t } = useTranslation('preview')
  if (edges.length === 0) return null
  const groupedEdges = groupResolvedCharacterEdges(edges)
  return (
    <section className={variant === 'compact' ? 'section compact-edges' : 'section'}>
      <div className="section-title">{t('sections.edges')}</div>
      <div className={variant === 'compact' ? 'list compact-edges-list' : 'list'}>
        {groupedEdges.map(edge => (
          <p key={edge.id} className={variant === 'compact' ? 'item compact-markerless-item' : 'item'}>
            <strong>{edge.name}</strong>
            {edge.repeatCount > 1 ? ` x${edge.repeatCount}` : ''}
            {edge.description ? ` - ${edge.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
