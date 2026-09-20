import { useTranslation } from 'react-i18next'
import type { ResolvedCombatStats } from '@/services/resolveEffectiveCharacter'
import { formatToughness } from '@/utils/toughnessUtils'

type CombatKey = 'pace' | 'parry' | 'toughness' | 'armor' | 'runningDie' | 'bennies' | 'maxWounds' | 'maxFatigue' | 'powerPoints'
const COMBAT_KEYS: CombatKey[] = ['pace', 'parry', 'toughness', 'armor', 'runningDie', 'bennies', 'maxWounds', 'maxFatigue', 'powerPoints']

interface Props {
  combat: ResolvedCombatStats
}

export function SheetCombat({ combat }: Props) {
  const { t } = useTranslation('preview')
  const combatValues: Record<CombatKey, string | number> = {
    pace: combat.pace,
    parry: combat.parry,
    toughness: formatToughness(combat.toughness, combat.armor),
    armor: combat.armor,
    runningDie: combat.runningDie,
    bennies: combat.bennies,
    maxWounds: combat.maxWounds,
    maxFatigue: combat.maxFatigue,
    powerPoints: combat.powerPoints,
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
