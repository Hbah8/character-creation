import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetCombat({ character }: Props) {
  return (
    <section className="section">
      <div className="section-title">Боевые параметры</div>
      <table className="table combat-table">
        <tbody>
          <tr><td>Шаг</td><td>{character.pace}</td></tr>
          <tr><td>Парирование</td><td>{character.parry}</td></tr>
          <tr><td>Стойкость</td><td>{character.toughness}</td></tr>
          <tr><td>Бенни</td><td>{character.bennies}</td></tr>
          <tr><td>Раны</td><td>{character.wounds}</td></tr>
          <tr><td>Усталость</td><td>{character.fatigue}</td></tr>
        </tbody>
      </table>
    </section>
  )
}
