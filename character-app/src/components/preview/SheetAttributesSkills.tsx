import { useTranslation } from 'react-i18next'
import type { AttributeKey, DieName, ResolvedCharacterSkill } from '@/types/character'

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'smarts', 'spirit', 'strength', 'vigor']

interface Props {
  skills: ResolvedCharacterSkill[]
  attributes: Record<AttributeKey, DieName>
  variant?: 'default' | 'compact'
}

export function SheetAttributesSkills({ skills, attributes, variant = 'default' }: Props) {
  const { t } = useTranslation('preview')

  if (variant === 'compact') {
    const hasDerivedSkills = skills.some(skill => skill.linkedAttribute === 'strength' || skill.linkedAttribute === 'vigor')
    return (
      <section className="section compact-attributes-skills">
        <div className="section-title">{t('sections.attributesAndSkills')}</div>
        <div className={hasDerivedSkills ? 'compact-attribute-grid compact-attribute-grid--has-derived-skills' : 'compact-attribute-grid'}>
          {ATTRIBUTE_KEYS.map(attrKey => {
            const attributeSkills = skills.filter(skill => skill.linkedAttribute === attrKey)
            const isDerived = attrKey === 'strength' || attrKey === 'vigor'
            const className = isDerived
              ? `compact-attribute-card compact-attribute-card--derived${attributeSkills.length > 0 ? ' compact-attribute-card--derived-with-skills' : ''}`
              : 'compact-attribute-card'
            return (
              <div
                className={className}
                data-attribute={attrKey}
                key={attrKey}
              >
                <div className={isDerived ? 'compact-attribute-column compact-attribute-column--derived' : 'compact-attribute-column'}>
                  <div className="compact-attribute-heading">
                    <span>{t(`attributes.${attrKey}`).toUpperCase()}</span>
                    <strong>{attributes[attrKey]}</strong>
                  </div>
                  {attributeSkills.length > 0 && (
                    <div className="compact-attribute-skills">
                      <div className="compact-attribute-skill-table">
                        {attributeSkills.map(skill => (
                          <div className="compact-skill-row" key={skill.id}>
                            <span>{skill.name}</span>
                            <strong>{skill.die}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

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
