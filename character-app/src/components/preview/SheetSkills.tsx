import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetSkills({ character }: Props) {
  return (
    <section className="section">
      <div className="section-title">Навыки</div>
      <table className="table skill-table">
        <thead>
          <tr>
            <th>Навык</th>
            <th>Знач.</th>
            <th>Хар-ка</th>
          </tr>
        </thead>
        <tbody>
          {character.skills.map(skill => (
            <tr key={skill.id}>
              <td>{skill.name}</td>
              <td>{skill.die}</td>
              <td>{skill.linkedAttribute}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
