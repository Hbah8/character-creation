import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetSpecialRules({ character }: Props) {
  if (character.specialRules.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">Особые правила персонажа</div>
      <div className="list">
        {character.specialRules.map(rule => (
          <p key={rule.id} className="item">
            <strong>{rule.name}</strong>
            {rule.description ? ` - ${rule.description}` : ''}
          </p>
        ))}
      </div>
    </section>
  )
}
