import { useTranslation } from 'react-i18next'
import type { Character, AttributeKey, DieName } from '@/types/character'

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'smarts', 'spirit', 'strength', 'vigor']

interface Props {
  character: Character
  attributes: Record<AttributeKey, DieName>
}

export function SheetAttributesSkills({ character, attributes }: Props) {
  const { t } = useTranslation('preview')
  return (
    <section className="section">
      <div className="section-title">{t('sections.attributesAndSkills')}</div>
      <table className="table attr-skill-table">
        <tbody>
          {ATTRIBUTE_KEYS.map(attrKey => {
            const skills = character.skills.filter(s => s.linkedAttribute === attrKey)
            return (
              <>
                <tr key={`${attrKey}-header`} className="attr-header-row">
                  <td className="attr-header-cell">
                    {t(`attributes.${attrKey}`).toUpperCase()} {attributes[attrKey]}
                  </td>
                </tr>
                {skills.length > 0 && (
                  <tr key={`${attrKey}-skills`} className="attr-skills-row">
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

