import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
  variant?: 'default' | 'compact'
}

export function SheetGear({ character, variant = 'default' }: Props) {
  const { t } = useTranslation('preview')
  if (character.gear.length === 0) return null
  return (
    <section className={variant === 'compact' ? 'section compact-gear' : 'section'}>
      <div className="section-title">{t('sections.gear')}</div>
      <div className={variant === 'compact' ? 'list compact-gear-list' : 'list'}>
        {character.gear.map((item, i) => (
          <p key={i} className="item">{item}</p>
        ))}
      </div>
    </section>
  )
}
