import { useTranslation } from 'react-i18next'
import type { Character, AttributeKey } from '@/types/character'

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']

interface Props {
  character: Character
}

export function SheetAttributes({ character }: Props) {
  const { t } = useTranslation('preview')
  return (
    <section className="section">
      <div className="section-title">{t('sections.attributes')}</div>
      <table className="table stat-table">
        <tbody>
          {ATTRIBUTE_KEYS.map(key => (
            <tr key={key}><td>{t(`attributes.${key}`)}</td><td>{character[key]}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
