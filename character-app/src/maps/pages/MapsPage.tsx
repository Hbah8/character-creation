import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MapLibraryPanel, type MapListItem } from '@/maps/components/MapLibraryPanel'
import { MapViewer } from '@/maps/components/MapViewer'
import {
  addMap,
  listWorldMaps,
  resetMapGridSettings,
  rotateMap,
  updateMapGridSettings,
} from '@/maps/services/mapStorageRepository'
import { DEFAULT_MAP_GRID_SETTINGS } from '@/maps/types'
import type { MapGridSettings, MapRotationDirection } from '@/maps/types'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'

type MapPageError = 'addFailed' | 'saveFailed'

export function MapsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('maps')
  const { entries, activeWorldId, setActiveWorldId } = useWorldLibrary()
  const activeWorld = entries.find(entry => entry.id === activeWorldId)
  const activeWorldKey = activeWorld?.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUrlsRef = useRef(new Set<string>())
  const [maps, setMaps] = useState<MapListItem[]>([])
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [loadState, setLoadState] = useState<{
    worldId: string
    reloadToken: number
    failed: boolean
  } | null>(null)
  const [pageError, setPageError] = useState<{ worldId: string, key: MapPageError } | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const isLoading = Boolean(activeWorldKey) && (
    loadState === null ||
    loadState.worldId !== activeWorldKey ||
    loadState.reloadToken !== reloadToken
  )
  const loadFailed = Boolean(activeWorldKey) &&
    loadState !== null &&
    loadState.worldId === activeWorldKey &&
    loadState.reloadToken === reloadToken &&
    loadState.failed
  const errorKey = loadFailed
    ? 'loadFailed'
    : pageError && pageError.worldId === activeWorldKey ? pageError.key : null

  useEffect(() => {
    let cancelled = false
    const loadedImageUrls = new Set<string>()
    const imageUrls = imageUrlsRef.current
    if (!activeWorldKey) return

    void listWorldMaps(activeWorldKey)
      .then(records => {
        const viewMaps = records.map(map => {
          const imageUrl = URL.createObjectURL(map.image)
          imageUrls.add(imageUrl)
          loadedImageUrls.add(imageUrl)
          return { map, imageUrl }
        })
        if (cancelled) {
          for (const { imageUrl } of viewMaps) {
            URL.revokeObjectURL(imageUrl)
            imageUrls.delete(imageUrl)
          }
          return
        }
        setMaps(viewMaps)
        setSelectedMapId(viewMaps[0]?.map.id ?? null)
        setLoadState({ worldId: activeWorldKey, reloadToken, failed: false })
        setPageError(null)
      })
      .catch(() => {
        if (cancelled) return
        setMaps([])
        setSelectedMapId(null)
        setLoadState({ worldId: activeWorldKey, reloadToken, failed: true })
      })

    return () => {
      cancelled = true
      for (const url of loadedImageUrls) {
        URL.revokeObjectURL(url)
        imageUrls.delete(url)
      }
    }
  }, [activeWorldKey, reloadToken])

  useEffect(() => {
    const imageUrls = imageUrlsRef.current
    return () => {
      for (const url of imageUrls) URL.revokeObjectURL(url)
      imageUrls.clear()
    }
  }, [])

  async function addSelectedFiles(files: FileList | null): Promise<void> {
    if (!activeWorld || !files) return
    let failed = false
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        failed = true
        continue
      }

      const imageUrl = URL.createObjectURL(file)
      try {
        const map = await addMap(activeWorld.id, file.name, file)
        imageUrlsRef.current.add(imageUrl)
        setMaps(current => [...current, { map, imageUrl }])
        setSelectedMapId(map.id)
      } catch {
        URL.revokeObjectURL(imageUrl)
        failed = true
      }
    }
    setPageError(failed ? { worldId: activeWorld.id, key: 'addFailed' } : null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function saveGridSettings(settings: MapGridSettings): Promise<void> {
    if (!activeWorld || !selectedMapId) return
    try {
      await updateMapGridSettings(activeWorld.id, selectedMapId, settings)
      setMaps(current => current.map(item => (
        item.map.id === selectedMapId
          ? { ...item, map: { ...item.map, gridSettings: settings } }
          : item
      )))
      setPageError(null)
    } catch {
      setPageError({ worldId: activeWorld.id, key: 'saveFailed' })
    }
  }

  async function resetSelectedGridSettings(): Promise<void> {
    if (!activeWorld || !selectedMapId) return
    try {
      await resetMapGridSettings(activeWorld.id, selectedMapId)
      setMaps(current => current.map(item => (
        item.map.id === selectedMapId
          ? { ...item, map: { ...item.map, gridSettings: { ...DEFAULT_MAP_GRID_SETTINGS } } }
          : item
      )))
      setPageError(null)
    } catch {
      setPageError({ worldId: activeWorld.id, key: 'saveFailed' })
    }
  }

  async function rotateSelectedMap(direction: MapRotationDirection): Promise<void> {
    if (!activeWorld || !selectedMapId) return
    try {
      const rotation = await rotateMap(activeWorld.id, selectedMapId, direction)
      setMaps(current => current.map(item => (
        item.map.id === selectedMapId
          ? { ...item, map: { ...item.map, rotation } }
          : item
      )))
      setPageError(null)
    } catch {
      setPageError({ worldId: activeWorld.id, key: 'saveFailed' })
    }
  }

  if (!activeWorld) {
    return (
      <main className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto bg-background p-6 text-foreground max-md:px-3.5 max-md:py-4">
        <header>
          <h1 className="text-xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </header>
        <section className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold">{t('noWorldTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('noWorldDescription')}</p>
            {entries.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>{t('selectWorld')}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuGroup>
                    {entries.map(entry => (
                      <DropdownMenuItem key={entry.id} onClick={() => setActiveWorldId(entry.id)}>
                        {entry.world.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/worlds/new')}>{t('createWorld')}</Button>
            )}
          </div>
        </section>
      </main>
    )
  }

  const visibleMaps = maps.filter(item => item.map.worldId === activeWorld.id)
  const selectedMap = visibleMaps.find(item => item.map.id === selectedMapId)

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 max-md:px-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">{t('title')}</h1>
          <p className="truncate text-sm text-muted-foreground">{activeWorld.world.name}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label={t('addMap')}
          onChange={event => void addSelectedFiles(event.currentTarget.files)}
        />
      </header>
      {errorKey && (
        <Alert variant="destructive" className="mx-3 mt-3 w-auto">
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{t(errorKey)}</span>
            {loadFailed && (
              <Button variant="outline" size="sm" onClick={() => setReloadToken(token => token + 1)}>
                {t('retry')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <MapLibraryPanel
          maps={visibleMaps}
          selectedMapId={selectedMapId}
          isLoading={isLoading}
          hasLoadError={loadFailed}
          onSelect={setSelectedMapId}
          onAddMap={() => fileInputRef.current?.click()}
        />
        <MapViewer
          selectedMap={selectedMap}
          onGridSettingsChange={settings => void saveGridSettings(settings)}
          onResetGridSettings={() => void resetSelectedGridSettings()}
          onRotate={direction => void rotateSelectedMap(direction)}
        />
      </div>
    </main>
  )
}
