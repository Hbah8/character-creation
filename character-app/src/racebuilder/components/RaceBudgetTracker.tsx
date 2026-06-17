import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { computeRaceBudgetStatus } from '@/racebuilder/services/raceBudget'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { Race, World } from '@/world/types'

interface RaceBudgetTrackerProps {
  race: Race
  world: World
  catalog: ResolvedRacialAbility[]
}

function budgetState(remaining: number): 'valid' | 'warning' | 'invalid' {
  if (remaining >= 0) return 'valid'
  if (remaining === -1) return 'warning'
  return 'invalid'
}

export function RaceBudgetTracker({ race, world, catalog }: RaceBudgetTrackerProps) {
  const { t } = useTranslation('raceBuilder')
  const status = computeRaceBudgetStatus(race, world, catalog)
  const state = budgetState(status.remaining)

  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3"
      data-state={state}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t('budget.title')}</h3>
        <Badge
          variant={state === 'invalid' ? 'destructive' : 'secondary'}
          className={
            state === 'valid'
              ? 'text-green-600 dark:text-green-400'
              : state === 'warning'
                ? 'text-amber-500'
                : undefined
          }
        >
          {state === 'warning'
            ? t('budget.oneOver')
            : t('budget.remaining', { remaining: status.remaining })}
        </Badge>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">{t('budget.budget')}</div>
          <div className="font-medium tabular-nums">{status.budget}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{t('budget.spent')}</div>
          <div className="font-medium tabular-nums">{status.spent}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{t('budget.remainingLabel')}</div>
          <div className="font-medium tabular-nums">{status.remaining}</div>
        </div>
      </div>
    </div>
  )
}
