import type { Character } from '@/types/character'

interface Props {
  character: Character
}

const ATTRIBUTES = [
  { key: 'agility' as const, label: 'Ловкость' },
  { key: 'smarts' as const, label: 'Смекалка' },
  { key: 'spirit' as const, label: 'Характер' },
  { key: 'strength' as const, label: 'Сила' },
  { key: 'vigor' as const, label: 'Выносливость' },
]

export function SheetAttributesSkills({ character }: Props) {
  return (
    <section className="section">
      <div className="section-title">Характеристики и Навыки</div>
      <table className="table attr-skill-table">
        <tbody>
          {ATTRIBUTES.map(attr => {
            const skills = character.skills.filter(s => s.linkedAttribute === attr.label)
            return (
              <>
                <tr key={`${attr.key}-header`} className="attr-header-row">
                  <td className="attr-header-cell">
                    {attr.label.toUpperCase()} {character[attr.key]}
                  </td>
                </tr>
                {skills.length > 0 && (
                  <tr key={`${attr.key}-skills`} className="attr-skills-row">
                    <td className="attr-skills-cell">
                      {skills.map(s => `${s.name} ${s.die}`).join(' · ')}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

