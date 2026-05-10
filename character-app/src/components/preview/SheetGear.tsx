import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetGear({ character }: Props) {
  if (character.gear.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">Снаряжение</div>
      <div className="list">
        {character.gear.map((item, i) => (
          <p key={i} className="item">{item}</p>
        ))}
      </div>
    </section>
  )
}
