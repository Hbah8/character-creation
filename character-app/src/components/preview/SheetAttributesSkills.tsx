import { useTranslation } from 'react-i18next'
import type { AttributeKey, DieName, ResolvedCharacterSkill } from '@/types/character'

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'smarts', 'spirit', 'strength', 'vigor']

interface Props {
  skills: ResolvedCharacterSkill[]
  attributes: Record<AttributeKey, DieName>
}

export function SheetAttributesSkills({ skills, attributes }: Props) {
  const { t } = useTranslation('preview')
  return (
    <section className="section">
      <div className="section-title">{t('sections.attributesAndSkills')}</div>
      <table className="table attr-skill-table">
        <tbody>
          {ATTRIBUTE_KEYS.map(attrKey => {
            const attributeSkills = skills.filter(skill => skill.linkedAttribute === attrKey)
            return (
              <>
                <tr key={`${attrKey}-header`} className="attr-header-row">
                  <td className="attr-header-cell">
                    {t(`attributes.${attrKey}`).toUpperCase()} {attributes[attrKey]}
                  </td>
                </tr>
                {attributeSkills.length > 0 && (
                  <tr key={`${attrKey}-skills`} className="attr-skills-row">
                    <td className="attr-skills-cell">
                      {attributeSkills.map(skill => `${skill.name} ${skill.die}`).join(' · ')}
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

