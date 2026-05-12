import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetSpecialRules({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.specialRules.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.specialRules')}</div>
      <div className="list">
        {character.specialRules.map(rule => (
          <div key={rule.id} className="item">
            <strong>{rule.name}</strong>
            {rule.description ? (
              <div className="item-description">
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
