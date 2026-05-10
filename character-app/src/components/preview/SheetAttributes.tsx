import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetAttributes({ character }: Props) {
  return (
    <section className="section">
      <div className="section-title">Характеристики</div>
      <table className="table stat-table">
        <tbody>
          <tr><td>Ловкость</td><td>{character.agility}</td></tr>
          <tr><td>Сила</td><td>{character.strength}</td></tr>
          <tr><td>Смекалка</td><td>{character.smarts}</td></tr>
          <tr><td>Характер</td><td>{character.spirit}</td></tr>
          <tr><td>Выносливость</td><td>{character.vigor}</td></tr>
        </tbody>
      </table>
    </section>
  )
}
