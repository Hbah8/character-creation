import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetWeapons({ character }: Props) {
  if (character.weapons.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">Оружие</div>
      <table className="table weapon-table">
        <thead>
          <tr>
            <th>Оружие</th>
            <th>Дист.</th>
            <th>Урон</th>
            <th>AP</th>
            <th>RoF</th>
            <th>Маг.</th>
          </tr>
        </thead>
        <tbody>
          {character.weapons.map(w => (
            <tr key={w.id}>
              <td>{w.name}</td>
              <td>{w.range}</td>
              <td>{w.damage}</td>
              <td>{w.ap}</td>
              <td>{w.rof}</td>
              <td>{w.magazine}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
