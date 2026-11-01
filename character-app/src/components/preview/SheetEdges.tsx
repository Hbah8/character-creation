import { useTranslation } from 'react-i18next'
import type { ResolvedCharacterEdge } from '@/handbooks/services/resolveCharacterEdges'

interface Props {
  edges: ResolvedCharacterEdge[]
  variant?: 'default' | 'compact'
}

export function SheetEdges({ edges, variant = 'default' }: Props) {
  const { t } = useTranslation('preview')
  if (edges.length === 0) return null
  return (
    <section className={variant === 'compact' ? 'section compact-edges' : 'section'}>
      <div className="section-title">{t('sections.edges')}</div>
      <div className={variant === 'compact' ? 'list compact-edges-list' : 'list'}>
        {edges.map(edge => (
          <p key={edge.id} className={variant === 'compact' ? 'item compact-markerless-item' : 'item'}>
            <strong>{edge.name}</strong>
            {edge.description ? ` - ${edge.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
