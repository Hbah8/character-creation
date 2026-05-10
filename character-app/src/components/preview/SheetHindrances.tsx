import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetHindrances({ character }: Props) {
  if (character.hindrances.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">Изъяны</div>
      <div className="list">
        {character.hindrances.map(h => (
          <p key={h.id} className="item">
            <strong>{h.name}{h.severity ? ` (${h.severity})` : ''}</strong>
            {h.description ? ` - ${h.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
