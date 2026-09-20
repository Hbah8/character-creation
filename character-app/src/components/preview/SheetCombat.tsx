import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'
import { formatToughness } from '@/utils/toughnessUtils'

type CombatKey = 'pace' | 'parry' | 'toughness' | 'armor' | 'runningDie' | 'bennies' | 'wounds' | 'fatigue'
const COMBAT_KEYS: CombatKey[] = ['pace', 'parry', 'toughness', 'armor', 'runningDie', 'bennies', 'wounds', 'fatigue']

interface Props {
  character: Character
  combat: ResolvedCombatStats
}

export function SheetCombat({ character, combat }: Props) {
  const { t } = useTranslation('preview')
  const combatValues: Record<CombatKey, string | number> = {
    pace: combat.pace,
    parry: combat.parry,
    toughness: formatToughness(combat.toughness, combat.armor),
    armor: combat.armor,
    runningDie: combat.runningDie,
    bennies: character.bennies,
    wounds: character.wounds,
    fatigue: character.fatigue,
  }
  return (
    <section className="section">
      <div className="section-title">{t('sections.combat')}</div>
      <table className="table combat-table">
        <tbody>
          {COMBAT_KEYS.map(key => (
            <tr key={key}><td>{t(`combat.${key}`)}</td><td>{combatValues[key]}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
