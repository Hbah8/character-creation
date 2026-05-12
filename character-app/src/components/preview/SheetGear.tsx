import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetGear({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.gear.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.gear')}</div>
      <div className="list">
        {character.gear.map((item, i) => (
          <p key={i} className="item">{item}</p>
        ))}
      </div>
    </section>
  )
}
