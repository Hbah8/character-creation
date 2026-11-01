import { ImagePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { StoredMap } from '@/maps/types'

export interface MapListItem {
  map: StoredMap
  imageUrl: string
}

interface MapLibraryPanelProps {
  maps: MapListItem[]
  selectedMapId: string | null
  isLoading: boolean
  hasLoadError?: boolean
  onSelect: (mapId: string) => void
  onAddMap: () => void
}

export function MapLibraryPanel({
  maps,
  selectedMapId,
  isLoading,
  hasLoadError = false,
  onSelect,
  onAddMap,
}: MapLibraryPanelProps) {
  const { t } = useTranslation('maps')

  return (
    <aside className="flex min-h-0 w-64 shrink-0 flex-col gap-3 border-r border-border p-3 max-md:w-full max-md:border-r-0 max-md:border-b">
      <div className="flex flex-col items-stretch gap-2">
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {t('mapCount', { count: maps.length })}
        </span>
        <Button className="w-full" size="sm" variant="outline" onClick={onAddMap} disabled={isLoading || hasLoadError}>
          <ImagePlus data-icon="inline-start" />
          {t('addMap')}
        </Button>
      </div>
      {hasLoadError ? (
        <p className="text-sm text-muted-foreground" role="status">{t('mapsUnavailable')}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">{t('loading')}</p>
      ) : maps.length === 0 ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">{t('emptyMaps')}</p>
          <Button size="sm" onClick={onAddMap} disabled={isLoading}>
            <ImagePlus data-icon="inline-start" />
            {t('addMap')}
          </Button>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pr-3">
            {maps.map(({ map, imageUrl }) => (
              <button
                key={map.id}
                type="button"
                aria-pressed={selectedMapId === map.id}
                onClick={() => onSelect(map.id)}
                className="flex min-w-0 flex-col gap-1 rounded-lg p-1 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-accent"
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="aspect-[4/3] w-full rounded-md border border-border object-cover"
                />
                <span className="min-w-0 w-full truncate px-1 text-sm" title={map.filename}>
                  {map.filename}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </aside>
  )
}
