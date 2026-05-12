import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetSkills({ character }: Props) {
  const { t } = useTranslation('preview')
  return (
    <section className="section">
      <div className="section-title">{t('sections.skills')}</div>
      <table className="table skill-table">
        <thead>
          <tr>
            <th>{t('skills.columnSkill')}</th>
            <th>{t('skills.columnDie')}</th>
            <th>{t('skills.columnAttribute')}</th>
          </tr>
        </thead>
        <tbody>
          {character.skills.map(skill => (
            <tr key={skill.id}>
              <td>{skill.name}</td>
              <td>{skill.die}</td>
              <td>{t(`attributes.${skill.linkedAttribute}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
