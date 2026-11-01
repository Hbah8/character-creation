import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MAP_GRID_COLORS } from '@/maps/types'
import type { MapGridColor, MapGridSettings } from '@/maps/types'

interface MapGridSettingsPopoverProps {
  settings: MapGridSettings
  portalContainer?: HTMLElement | null
  onChange: (settings: MapGridSettings) => void
  onReset: () => void
}

const COLOR_KEYS: Record<MapGridColor, 'white' | 'black' | 'amber' | 'cyan'> = {
  '#ffffff': 'white',
  '#171717': 'black',
  '#f4b942': 'amber',
  '#56c4d2': 'cyan',
}

export function MapGridSettingsPopover({
  settings,
  portalContainer,
  onChange,
  onReset,
}: MapGridSettingsPopoverProps) {
  const { t } = useTranslation('maps')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('gridSettings')}>
          <SlidersHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent container={portalContainer} align="end" className="gap-4">
        <PopoverTitle>{t('grid')}</PopoverTitle>
        <label className="flex items-center justify-between gap-3">
          <span>{t('showGrid')}</span>
          <Checkbox
            checked={settings.enabled}
            onCheckedChange={checked => onChange({ ...settings, enabled: checked === true })}
            aria-label={t('showGrid')}
          />
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="map-grid-size">{t('cellSize')}</label>
            <span className="text-muted-foreground">{settings.cellSize} px</span>
          </div>
          <Slider
            id="map-grid-size"
            aria-label={t('cellSize')}
            min={16}
            max={128}
            step={4}
            value={[settings.cellSize]}
            onValueChange={values => {
              const [cellSize] = values
              if (cellSize !== undefined) onChange({ ...settings, cellSize })
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span>{t('lineColor')}</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={settings.color}
            onValueChange={color => {
              if (MAP_GRID_COLORS.includes(color as MapGridColor)) {
                onChange({ ...settings, color: color as MapGridColor })
              }
            }}
            aria-label={t('lineColor')}
          >
            {MAP_GRID_COLORS.map(color => (
              <ToggleGroupItem
                key={color}
                value={color}
                aria-label={t(`colors.${COLOR_KEYS[color]}`)}
                className="size-8 p-1 data-[state=on]:ring-2 data-[state=on]:ring-ring"
              >
                <span
                  aria-hidden="true"
                  className="size-5 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          {t('resetGrid')}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
