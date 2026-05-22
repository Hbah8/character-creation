import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SettingRules } from '@/world/types'
import { SWADE_DEFAULTS } from '@/world/types'

interface Props {
  settingRules: SettingRules
  onUpdate: (rules: Partial<SettingRules>) => void
}

export function WorldSettingRulesPanel({ settingRules, onUpdate }: Props) {
  const { t } = useTranslation('form')

  function handleSkillPointsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = parseInt(e.target.value, 10)
    if (n >= 1) onUpdate({ skillPointsBudget: n })
  }

  function handleAttributePointsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = parseInt(e.target.value, 10)
    if (n >= 1) onUpdate({ attributePointsBudget: n })
  }

  return (
    <div className="p-4 flex flex-col gap-3 shrink-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('world.settingRules.title')}
      </h3>
      <div className="grid gap-1.5">
        <Label htmlFor="setting-skill-points" className="text-xs">
          {t('world.settingRules.skillPoints')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="setting-skill-points"
            type="number"
            min={1}
            step={1}
            value={settingRules.skillPointsBudget}
            onChange={handleSkillPointsChange}
            className="w-20"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-9 px-2 text-muted-foreground"
            onClick={() => onUpdate({ skillPointsBudget: SWADE_DEFAULTS.skillPointsBudget })}
          >
            {t('world.settingRules.reset', { default: SWADE_DEFAULTS.skillPointsBudget })}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('world.settingRules.hint', { value: SWADE_DEFAULTS.skillPointsBudget })}
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="setting-attribute-points" className="text-xs">
          {t('world.settingRules.attributePoints')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="setting-attribute-points"
            type="number"
            min={1}
            step={1}
            value={settingRules.attributePointsBudget}
            onChange={handleAttributePointsChange}
            className="w-20"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-9 px-2 text-muted-foreground"
            onClick={() => onUpdate({ attributePointsBudget: SWADE_DEFAULTS.attributePointsBudget })}
          >
            {t('world.settingRules.reset', { default: SWADE_DEFAULTS.attributePointsBudget })}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('world.settingRules.hint', { value: SWADE_DEFAULTS.attributePointsBudget })}
        </p>
      </div>
    </div>
  )
}
