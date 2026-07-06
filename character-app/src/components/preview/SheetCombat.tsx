import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

type CombatKey = 'pace' | 'parry' | 'toughness' | 'armor' | 'bennies' | 'wounds' | 'fatigue'
const COMBAT_KEYS: CombatKey[] = ['pace', 'parry', 'toughness', 'armor', 'bennies', 'wounds', 'fatigue']

interface Props {
  character: Character
}

export function SheetCombat({ character }: Props) {
  const { t } = useTranslation('preview')
  return (
    <section className="section">
      <div className="section-title">{t('sections.combat')}</div>
      <table className="table combat-table">
        <tbody>
          {COMBAT_KEYS.map(key => (
            <tr key={key}><td>{t(`combat.${key}`)}</td><td>{character[key]}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
