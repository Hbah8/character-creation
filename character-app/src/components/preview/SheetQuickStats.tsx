import { useTranslation } from 'react-i18next'
import type { ResolvedCombatStats, ResolvedModifierBreakdown } from '@/services/resolveEffectiveCharacter'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatToughness } from '@/utils/toughnessUtils'
import { SheetModifierOverlay } from './SheetModifierOverlay'

interface Props {
  combat: ResolvedCombatStats
  modifierBreakdown?: ResolvedModifierBreakdown[]
}

export function SheetQuickStats({ combat, modifierBreakdown = [] }: Props) {
  const { t } = useTranslation('preview')
  const showCalculationLabel = t('quickStats.showCalculation')
  const paceModifiers = modifierBreakdown.filter(modifier => modifier.stat === 'pace')
  const parryModifiers = modifierBreakdown.filter(modifier => modifier.stat === 'parry')
  const toughnessModifiers = modifierBreakdown.filter(modifier =>
    modifier.stat === 'toughness' || modifier.stat === 'armor'
  )
  const runningModifiers = modifierBreakdown.filter(modifier => modifier.stat === 'runningDieSteps')
  const benniesModifiers = modifierBreakdown.filter(modifier => modifier.stat === 'bennies')
  const powerPointModifiers = modifierBreakdown.filter(modifier => modifier.stat === 'powerPoints')

  const paceBase = combat.pace - paceModifiers.reduce((total, modifier) => total + modifier.amount, 0)
  const parryBase = combat.parry - parryModifiers.reduce((total, modifier) => total + modifier.amount, 0)
  const toughnessBase = combat.toughness - toughnessModifiers.reduce((total, modifier) => total + modifier.amount, 0)
  const benniesBase = combat.bennies - benniesModifiers.reduce((total, modifier) => total + modifier.amount, 0)
  const powerPointsBase = combat.powerPoints - powerPointModifiers.reduce((total, modifier) => total + modifier.amount, 0)

  return (
    <div className="quick-stats">
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.pace')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="qs-value" title={showCalculationLabel}>{combat.pace}</button>
          </PopoverTrigger>
          <PopoverContent>
            <SheetModifierOverlay label={t('quickStats.pace')} baseValue={paceBase} total={combat.pace} modifiers={paceModifiers} />
          </PopoverContent>
        </Popover>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.parry')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="qs-value" title={showCalculationLabel}>{combat.parry}</button>
          </PopoverTrigger>
          <PopoverContent>
            <SheetModifierOverlay label={t('quickStats.parry')} baseValue={parryBase} total={combat.parry} modifiers={parryModifiers} />
          </PopoverContent>
        </Popover>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.toughness')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="qs-value" title={showCalculationLabel}>{formatToughness(combat.toughness, combat.armor)}</button>
          </PopoverTrigger>
          <PopoverContent>
            <SheetModifierOverlay
              label={t('quickStats.toughness')}
              baseValue={toughnessBase}
              total={formatToughness(combat.toughness, combat.armor)}
              modifiers={toughnessModifiers}
            />
          </PopoverContent>
        </Popover>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.runningDie')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="qs-value" title={showCalculationLabel}>{combat.runningDie}</button>
          </PopoverTrigger>
          <PopoverContent>
            <SheetModifierOverlay label={t('quickStats.runningDie')} baseValue="d6" total={combat.runningDie} modifiers={runningModifiers} />
          </PopoverContent>
        </Popover>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.bennies')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="qs-value" title={showCalculationLabel}>{combat.bennies}</button>
          </PopoverTrigger>
          <PopoverContent>
            <SheetModifierOverlay label={t('quickStats.bennies')} baseValue={benniesBase} total={combat.bennies} modifiers={benniesModifiers} />
          </PopoverContent>
        </Popover>
      </div>
      <span className="qs-sep">/</span>
      <div className="quick-stat">
        <span className="qs-label">{t('quickStats.mana')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="qs-value" title={showCalculationLabel}>{combat.powerPoints || '—'}</button>
          </PopoverTrigger>
          <PopoverContent>
            <SheetModifierOverlay label={t('quickStats.mana')} baseValue={powerPointsBase} total={combat.powerPoints} modifiers={powerPointModifiers} />
          </PopoverContent>
        </Popover>
      </div>
      {!!combat.size && (
        <>
          <span className="qs-sep">/</span>
          <div className="quick-stat">
            <span className="qs-label">{t('quickStats.size')}</span>
            <span className="qs-value">{combat.size > 0 ? `+${combat.size}` : combat.size}</span>
          </div>
        </>
      )}
    </div>
  )
}
