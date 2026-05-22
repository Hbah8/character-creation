import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilePlus2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { World, WorldEntityType, SettingRules } from '@/world/types'
import { WORLD_ENTITY_TYPES } from '@/world/types'
import { WORLD_ENTITY_LABEL_KEYS } from '@/world/i18nKeys'
import { cn } from '@/lib/utils'
import { WorldSettingRulesPanel } from './WorldSettingRulesPanel'

interface Props {
  world: World
  selectedEntityId: string | null
  onWorldNameChange: (value: string) => void
  onWorldSummaryChange: (value: string) => void
  onUpdateSettingRules: (rules: Partial<SettingRules>) => void
  onAddEntity: (type: WorldEntityType) => void
  onSelectEntity: (id: string) => void
}

export function WorldControlPanel({
  world,
  selectedEntityId,
  onWorldNameChange,
  onWorldSummaryChange,
  onUpdateSettingRules,
  onAddEntity,
  onSelectEntity,
}: Props) {
  const { t } = useTranslation('form')
  const [newEntityType, setNewEntityType] = useState<WorldEntityType>('location')
  const entityTypeLabel = (type: WorldEntityType) => t(WORLD_ENTITY_LABEL_KEYS[type])

  return (
    <aside className="w-full h-full flex flex-col border-r bg-background min-h-0">
      <div className="p-4 flex flex-col gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <FilePlus2 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('world.panelTitle')}
          </h2>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="world-name" className="text-xs">{t('world.name')}</Label>
          <Input
            id="world-name"
            value={world.name}
            onChange={e => onWorldNameChange(e.target.value)}
            placeholder={t('world.namePlaceholder')}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="world-summary" className="text-xs">{t('world.summary')}</Label>
          <Textarea
            id="world-summary"
            value={world.summary}
            onChange={e => onWorldSummaryChange(e.target.value)}
            placeholder={t('world.worldSummaryPlaceholder')}
            rows={3}
          />
        </div>
        <Separator />
        <div className="grid gap-2">
          <Label className="text-xs">{t('world.addEntity')}</Label>
          <div className="flex gap-2">
            <Select
              value={newEntityType}
              onValueChange={value => setNewEntityType(value as WorldEntityType)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORLD_ENTITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {entityTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" onClick={() => onAddEntity(newEntityType)} aria-label={t('world.addEntity')}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <WorldSettingRulesPanel
        settingRules={world.settingRules}
        onUpdate={onUpdateSettingRules}
      />

      <Separator />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 flex flex-col gap-2">
          {world.entities.map(entity => (
            <button
              key={entity.id}
              onClick={() => onSelectEntity(entity.id)}
              className={cn(
                'text-left rounded-md border bg-card text-card-foreground p-3 transition-colors hover:bg-muted',
                selectedEntityId === entity.id && 'border-primary ring-2 ring-ring/20',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm leading-tight line-clamp-2">
                  {entity.title || entityTypeLabel(entity.type)}
                </span>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {entityTypeLabel(entity.type)}
                </Badge>
              </div>
              {entity.summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {entity.summary}
                </p>
              )}
            </button>
          ))}
          {world.entities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('world.noEntities')}
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
