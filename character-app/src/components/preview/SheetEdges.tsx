import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetEdges({ character }: Props) {
  if (character.edges.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">Черты</div>
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
