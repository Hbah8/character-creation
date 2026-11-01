import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Character } from '@/types/character'

interface Props {
  character: Character
  variant?: 'default' | 'compact'
}

export function SheetSpecialRules({ character, variant = 'default' }: Props) {
  const { t } = useTranslation('preview')
  if (character.specialRules.length === 0) return null
  return (
    <section className={variant === 'compact' ? 'section compact-special-rules' : 'section'}>
      <div className="section-title">{t('sections.specialRules')}</div>
      <div className={variant === 'compact' ? 'list compact-special-rules-list' : 'list'}>
        {character.specialRules.map(rule => (
          <div key={rule.id} className={variant === 'compact' ? 'item compact-special-rule' : 'item'}>
            <strong>{rule.name}</strong>
            {rule.description ? (
              <div className={variant === 'compact' ? 'item-description compact-special-rule-description' : 'item-description'}>
                {variant === 'compact' ? ' ' : null}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {rule.description}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
