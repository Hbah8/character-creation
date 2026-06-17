import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CharacterPower, PowerModifier, ColumnSide } from '@/types/character'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  powers: CharacterPower[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<CharacterPower>) => void
  onRemove: (id: string) => void
  onAddModifier: (powerId: string) => void
  onUpdateModifier: (powerId: string, modId: string, patch: Partial<PowerModifier>) => void
  onRemoveModifier: (powerId: string, modId: string) => void
  column: ColumnSide
  onColumnChange: (col: ColumnSide) => void
}

export function PowersForm({
  powers,
  onAdd,
  onUpdate,
  onRemove,
  onAddModifier,
  onUpdateModifier,
  onRemoveModifier,
  column,
  onColumnChange,
}: Props) {
  const { t } = useTranslation('form')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sections.powers')}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button
              size="sm"
              variant={column === 'left' ? 'default' : 'ghost'}
              className="rounded-none h-7 px-2 text-xs"
              onClick={() => onColumnChange('left')}
            >
              ←
            </Button>
            <Button
              size="sm"
              variant={column === 'right' ? 'default' : 'ghost'}
              className="rounded-none h-7 px-2 text-xs"
              onClick={() => onColumnChange('right')}
            >
              →
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus data-icon="inline-start" /> {t('powers.addPower')}
          </Button>
        </div>
      </div>

      {powers.length === 0 && (
        <p className="text-xs text-muted-foreground">{t('powers.noPowers')}</p>
      )}

      {powers.map(power => (
        <div key={power.id} className="rounded-md border">
          {/* Power header — always visible */}
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => toggleExpand(power.id)}
              aria-label={expanded[power.id] ? 'collapse' : 'expand'}
            >
              {expanded[power.id] ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            <Input
              className="flex-1 h-7 text-sm font-medium"
              value={power.name}
              onChange={e => onUpdate(power.id, { name: e.target.value })}
              placeholder={t('powers.namePlaceholder')}
            />
            {/* PP cost — compact inline */}
            <Input
              className="w-14 h-7 text-xs text-center"
              value={power.ppCost}
              onChange={e => onUpdate(power.id, { ppCost: e.target.value })}
              placeholder={t('powers.ppCost')}
              title={t('powers.ppCost')}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onRemove(power.id)}
              title={t('powers.removePower')}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {/* Expanded details */}
          {expanded[power.id] && (
            <div className="flex flex-col gap-2 px-3 pb-3 border-t pt-2">
              {/* Range / Duration row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">{t('powers.range')}</Label>
                  <Input
                    className="h-7 text-xs"
                    value={power.range}
                    onChange={e => onUpdate(power.id, { range: e.target.value })}
                    placeholder="Смекалка×2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">{t('powers.duration')}</Label>
                  <Input
                    className="h-7 text-xs"
                    value={power.duration}
                    onChange={e => onUpdate(power.id, { duration: e.target.value })}
                    placeholder="5 раундов"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('powers.description')}</Label>
                <Textarea
                  className="text-xs min-h-[60px] resize-y"
                  value={power.description}
                  onChange={e => onUpdate(power.id, { description: e.target.value })}
                  placeholder={t('powers.descriptionPlaceholder')}
                />
              </div>

              {/* Modifiers */}
              <div className="flex flex-col gap-1.5">
                {power.modifiers.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {power.modifiers.map(mod => (
                      <div key={mod.id} className="flex items-center gap-1.5">
                        <Input
                          className="flex-1 h-6 text-xs"
                          value={mod.name}
                          onChange={e => onUpdateModifier(power.id, mod.id, { name: e.target.value })}
                          placeholder={t('powers.modifierNamePlaceholder')}
                        />
                        <Input
                          className="w-14 h-6 text-xs text-center"
                          value={mod.ppCost}
                          onChange={e => onUpdateModifier(power.id, mod.id, { ppCost: e.target.value })}
                          placeholder="+1"
                          title={t('powers.modifierCost')}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => onRemoveModifier(power.id, mod.id)}
                          title={t('powers.removeModifier')}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground self-start"
                  onClick={() => onAddModifier(power.id)}
                >
                  <Plus className="size-3 mr-1" />
                  {t('powers.addModifier')}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
