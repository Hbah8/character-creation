import { Check, Link2, Plus, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AudioAssetAvailability } from '@/audio/services/audioAssetAvailabilityService'
import type { AudioAsset } from '@/world/types'

interface AudioAssetRowProps {
  asset: AudioAsset
  availability?: AudioAssetAvailability
  onAdd: (asset: AudioAsset) => void
  onRelink: (asset: AudioAsset) => void
  onRemove: (assetId: string) => void
}

function getAvailabilityKey(status: AudioAssetAvailability | undefined) {
  if (status === 'permission-required') return 'permissionRequired'
  return status ?? 'missing'
}

export function AudioAssetRow({
  asset,
  availability,
  onAdd,
  onRelink,
  onRemove,
}: AudioAssetRowProps) {
  const { t } = useTranslation('audio')
  const isAvailable = availability === 'available'
  const duration = asset.durationSeconds === undefined
    ? undefined
    : `${Math.floor(asset.durationSeconds / 60)}:${String(Math.floor(asset.durationSeconds % 60)).padStart(2, '0')}`
  const format = asset.filename.includes('.')
    ? asset.filename.slice(asset.filename.lastIndexOf('.') + 1).toUpperCase()
    : asset.mediaType.replace('audio/', '').toUpperCase()

  return (
    <div
      className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-muted p-2 transition-colors hover:bg-accent data-[unavailable=true]:border-destructive data-[unavailable=true]:bg-destructive/10"
      data-unavailable={availability !== undefined && !isAvailable}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[11px] font-semibold">{asset.filename}</span>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
          {format}
          {duration && ` · ${duration}`}
          {' · '}
          <Badge variant={isAvailable ? 'secondary' : 'destructive'}>
            {isAvailable && <Check data-icon="inline-start" />}
            {t(getAvailabilityKey(availability))}
          </Badge>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="icon"
          variant="outline"
          aria-label={t('addToMixer')}
          disabled={availability === 'missing' || availability === 'changed'}
          onClick={() => onAdd(asset)}
        >
          <Plus />
        </Button>
        <Button size="icon" variant="outline" aria-label={t('relinkAsset')} onClick={() => onRelink(asset)}>
          <Link2 />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="outline" aria-label={t('removeAsset')}>
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeAssetTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('removeAssetDescription', { filename: asset.filename })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(asset.id)}>
                {t('removeAsset')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

interface AudioLibraryPanelProps {
  assets: AudioAsset[]
  availability: Record<string, AudioAssetAvailability>
  onAddFiles: () => void
  onAddToMixer: (asset: AudioAsset) => void
  onRelink: (asset: AudioAsset) => void
  onRemove: (assetId: string) => void
}

export function AudioLibraryPanel({
  assets,
  availability,
  onAddFiles,
  onAddToMixer,
  onRelink,
  onRemove,
}: AudioLibraryPanelProps) {
  const { t } = useTranslation('audio')
  const unavailableCount = assets.filter(asset =>
    availability[asset.id] !== undefined && availability[asset.id] !== 'available',
  ).length

  return (
    <Card className="gap-3.5 rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="flex items-start justify-between gap-2 px-3.5">
        <div>
          <CardTitle>{t('libraryTitle')}</CardTitle>
          <CardDescription>
            {t('fileCount', { count: assets.length })}
            {unavailableCount > 0 && (
              <span className="text-destructive">
                {' · '}{t('missingCount', { count: unavailableCount })}
              </span>
            )}
          </CardDescription>
        </div>
        <Button size="sm" onClick={onAddFiles}>
          <Upload data-icon="inline-start" />
          {t('addFiles')}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 px-3.5">
        <p className="m-0 text-[10px] tracking-wide text-muted-foreground">{t('supportedFormats')}</p>
        {assets.length === 0 ? (
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">{t('emptyLibrary')}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {assets.map(asset => (
              <AudioAssetRow
                key={asset.id}
                asset={asset}
                availability={availability[asset.id]}
                onAdd={onAddToMixer}
                onRelink={onRelink}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
        <p className="m-0 text-[10px] leading-relaxed text-muted-foreground">{t('libraryFootnote')}</p>
      </CardContent>
    </Card>
  )
}
