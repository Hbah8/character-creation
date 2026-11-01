import * as React from 'react'
import { Expand, Grid2X2, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { MapGridSettingsPopover } from '@/maps/components/MapGridSettingsPopover'
import type { MapListItem } from '@/maps/components/MapLibraryPanel'
import { enterMapFullscreen, exitMapFullscreen } from '@/maps/services/mapFullscreenService'
import { clampMapPan } from '@/maps/services/mapPan'
import type { MapPanOffset } from '@/maps/services/mapPan'
import { cn } from '@/lib/utils'
import {
  DEFAULT_MAP_ZOOM,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
} from '@/maps/types'
import type { MapGridSettings, MapRotationDirection, MapZoomDirection } from '@/maps/types'

interface MapViewerProps {
  selectedMap: MapListItem | undefined
  onGridSettingsChange: (settings: MapGridSettings) => void
  onResetGridSettings: () => void
  onRotate: (direction: MapRotationDirection) => void
  onZoom: (direction: MapZoomDirection) => void
}

function MapImage({
  selectedMap,
  fullscreen = false,
  interactive = false,
  pan,
  onPanChange,
}: {
  selectedMap: MapListItem
  fullscreen?: boolean
  interactive?: boolean
  pan: MapPanOffset
  onPanChange: (offset: MapPanOffset) => void
}) {
  const { map, imageUrl } = selectedMap
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [imageInfo, setImageInfo] = useState<{ mapId: string, width: number, height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const imageSize = imageInfo?.mapId === map.id ? imageInfo : null
  const swapsDimensions = map.rotation === 90 || map.rotation === 270
  const availableWidth = swapsDimensions ? viewportSize.height : viewportSize.width
  const availableHeight = swapsDimensions ? viewportSize.width : viewportSize.height
  const fitScale = imageSize && availableWidth > 0 && availableHeight > 0
    ? Math.min(1, availableWidth / imageSize.width, availableHeight / imageSize.height)
    : undefined
  const scale = fitScale === undefined ? undefined : fitScale * (map.zoom ?? DEFAULT_MAP_ZOOM)
  const width = imageSize && scale !== undefined ? imageSize.width * scale : undefined
  const height = imageSize && scale !== undefined ? imageSize.height * scale : undefined
  const imageBounds = width !== undefined && height !== undefined
    ? {
        width: swapsDimensions ? height : width,
        height: swapsDimensions ? width : height,
      }
    : undefined
  const canPan = Boolean(
    interactive &&
    imageBounds &&
    (imageBounds.width > viewportSize.width || imageBounds.height > viewportSize.height),
  )
  const boundedPan = imageBounds
    ? clampMapPan(pan, imageBounds, viewportSize)
    : { x: 0, y: 0 }
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    pan: MapPanOffset
  } | null>(null)
  const gridStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${map.gridSettings.color} 1px, transparent 1px), linear-gradient(to bottom, ${map.gridSettings.color} 1px, transparent 1px)`,
    backgroundSize: `${map.gridSettings.cellSize}px ${map.gridSettings.cellSize}px`,
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(entries => {
      const { width: nextWidth, height: nextHeight } = entries[0].contentRect
      setViewportSize({ width: nextWidth, height: nextHeight })
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (!canPan || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      pan: boundedPan,
    }
    setIsDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !imageBounds) return
    onPanChange(clampMapPan({
      x: drag.pan.x + event.clientX - drag.startX,
      y: drag.pan.y + event.clientY - drag.startY,
    }, imageBounds, viewportSize))
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>): void {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      ref={viewportRef}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        canPan && (isDragging ? 'cursor-grabbing touch-none' : 'cursor-grab touch-none'),
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={event => {
        if (dragRef.current?.pointerId === event.pointerId) {
          dragRef.current = null
          setIsDragging(false)
        }
      }}
    >
      {width !== undefined && height !== undefined ? (
        <div
          className="relative shrink-0"
          style={imageBounds}
        >
          <div
            className="absolute"
            style={{
              left: `calc(50% + ${boundedPan.x}px)`,
              top: `calc(50% + ${boundedPan.y}px)`,
              width,
              height,
              transform: `translate(-50%, -50%) rotate(${map.rotation}deg)`,
            }}
          >
            <img
              src={imageUrl}
              alt={map.filename}
              className="size-full object-contain"
              draggable={false}
              onLoad={event => {
                const image = event.currentTarget
                setImageInfo({ mapId: map.id, width: image.naturalWidth, height: image.naturalHeight })
              }}
            />
            {map.gridSettings.enabled && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-50"
                style={gridStyle}
              />
            )}
          </div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={map.filename}
          draggable={false}
          className={fullscreen
            ? 'max-h-[calc(100dvh-2rem)] max-w-full object-contain'
            : 'max-h-[calc(100dvh-12rem)] max-w-full object-contain'}
          style={{
            transform: `rotate(${map.rotation}deg) scale(${map.zoom ?? DEFAULT_MAP_ZOOM})`,
          }}
          onLoad={event => {
            const image = event.currentTarget
            setImageInfo({ mapId: map.id, width: image.naturalWidth, height: image.naturalHeight })
          }}
        />
      )}
    </div>
  )
}

export function MapViewer({
  selectedMap,
  onGridSettingsChange,
  onResetGridSettings,
  onRotate,
  onZoom,
}: MapViewerProps) {
  const { t } = useTranslation('maps')
  const fullscreenRef = useRef<HTMLElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null)
  const [pan, setPan] = useState<MapPanOffset>({ x: 0, y: 0 })
  const [fullscreenFailed, setFullscreenFailed] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isMapFullscreen = document.fullscreenElement === fullscreenRef.current
      setIsFullscreen(isMapFullscreen)
      setFullscreenContainer(isMapFullscreen ? fullscreenRef.current : null)
      if (!isMapFullscreen) setPan({ x: 0, y: 0 })
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (!selectedMap) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-border bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t('selectMap')}</p>
      </section>
    )
  }

  const { map } = selectedMap
  const zoom = map.zoom ?? DEFAULT_MAP_ZOOM

  async function toggleFullscreen(): Promise<void> {
    try {
      if (isFullscreen) await exitMapFullscreen()
      else if (fullscreenRef.current) await enterMapFullscreen(fullscreenRef.current)
      setFullscreenFailed(false)
    } catch {
      setFullscreenFailed(true)
    }
  }

  return (
    <section
      ref={fullscreenRef}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2 bg-background p-3"
      style={isFullscreen ? { height: '100dvh', width: '100vw' } : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={map.filename}>
          {map.filename}
        </span>
        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t('zoomOut')}
            disabled={zoom <= MIN_MAP_ZOOM}
            onClick={() => onZoom('out')}
          >
            <ZoomOut />
          </Button>
          <span className="min-w-10 text-center text-xs text-muted-foreground" aria-live="polite">
            {t('zoomPercent', { percent: Math.round(zoom * 100) })}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('zoomIn')}
            disabled={zoom >= MAX_MAP_ZOOM}
            onClick={() => onZoom('in')}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('rotateCounterclockwise')}
            onClick={() => onRotate('counterclockwise')}
          >
            <RotateCcw />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('rotateClockwise')}
            onClick={() => onRotate('clockwise')}
          >
            <RotateCw />
          </Button>
          <Toggle
            pressed={map.gridSettings.enabled}
            aria-label={t('toggleGrid')}
            onPressedChange={enabled => onGridSettingsChange({ ...map.gridSettings, enabled })}
          >
            <Grid2X2 />
          </Toggle>
          <MapGridSettingsPopover
            settings={map.gridSettings}
            portalContainer={fullscreenContainer}
            onChange={onGridSettingsChange}
            onReset={onResetGridSettings}
          />
          <Button
            variant="outline"
            size="icon"
            aria-label={t(isFullscreen ? 'closeFullscreen' : 'fullscreen')}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? <X /> : <Expand />}
          </Button>
        </div>
      </div>
      {fullscreenFailed && (
        <Alert variant="destructive">
          <AlertDescription>{t('fullscreenFailed')}</AlertDescription>
        </Alert>
      )}
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-muted/20">
        <MapImage
          selectedMap={selectedMap}
          fullscreen={isFullscreen}
          interactive={isFullscreen}
          pan={pan}
          onPanChange={setPan}
        />
      </div>
    </section>
  )
}
