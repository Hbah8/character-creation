import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetQuickStats({ character }: Props) {
  return (
    <div className="quick-stats">
      <div className="quick-stat">
        <span className="qs-label">Шаг</span>
        <span className="qs-value">{character.pace}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">Парир.</span>
        <span className="qs-value">{character.parry}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">Стойк.</span>
        <span className="qs-value">{character.toughness}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">Бенни</span>
        <span className="qs-value">{character.bennies}</span>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">Мана</span>
        <span className="qs-value">{character.mana || '—'}</span>
      </div>
    </div>
  )
}
