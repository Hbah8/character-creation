import { Play, Plus, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import type { AudioScene } from '@/world/types'

interface AudioSceneCardProps {
  scene: AudioScene
  isActive: boolean
  onActivate: (sceneId: string) => void
  onRemove: (sceneId: string) => void
}

export function AudioSceneCard({ scene, isActive, onActivate, onRemove }: AudioSceneCardProps) {
  const { t } = useTranslation('audio')

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <strong className="truncate text-[11px] font-semibold">{scene.name}</strong>
          <span className="text-[9px] text-muted-foreground">
            {t('sceneTrackCount', { count: scene.trackIds.length })}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isActive && <Badge variant="outline">{t('activeScene')}</Badge>}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="outline" aria-label={t('removeScene')}>
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('removeSceneTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('removeSceneDescription', { sceneName: scene.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(scene.id)}>
                  {t('removeScene')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Button variant="outline" className="w-full text-[10px]" onClick={() => onActivate(scene.id)}>
        <Play data-icon="inline-start" />
        {isActive ? t('restartScene') : t('launchScene')}
      </Button>
    </article>
  )
}

interface AudioScenesPanelProps {
  scenes: AudioScene[]
  activeSceneId: string | null
  activeTrackIds: string[]
  sceneName: string
  onSceneNameChange: (name: string) => void
  onSaveScene: () => void
  onActivateScene: (sceneId: string) => void
  onRemoveScene: (sceneId: string) => void
}

export function AudioScenesPanel({
  scenes,
  activeSceneId,
  activeTrackIds,
  sceneName,
  onSceneNameChange,
  onSaveScene,
  onActivateScene,
  onRemoveScene,
}: AudioScenesPanelProps) {
  const { t } = useTranslation('audio')

  return (
    <Card className="gap-3.5 rounded-xl border border-border bg-card shadow-none max-[1180px]:col-span-2 max-md:col-span-1">
      <CardHeader className="flex items-start justify-between gap-2 px-3.5">
        <div>
          <CardTitle>{t('scenesTitle')}</CardTitle>
          <CardDescription>{t('scenesDescription')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3.5">
        <div className="flex gap-1.5">
          <Input
            aria-label={t('sceneNamePlaceholder')}
            className="h-8 min-w-0 text-[11px]"
            value={sceneName}
            onChange={event => onSceneNameChange(event.target.value)}
            placeholder={t('sceneNamePlaceholder')}
          />
          <Button
            size="icon"
            aria-label={t('saveScene')}
            disabled={!sceneName.trim() || activeTrackIds.length === 0}
            onClick={onSaveScene}
          >
            <Plus />
          </Button>
        </div>
        {scenes.length === 0 ? (
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">{t('emptyScenes')}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-[1180px]:grid max-[1180px]:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {scenes.map(scene => {
              const isActive = scene.id === activeSceneId
              return (
                <AudioSceneCard
                  key={scene.id}
                  scene={scene}
                  isActive={isActive}
                  onActivate={onActivateScene}
                  onRemove={onRemoveScene}
                />
              )
            })}
          </div>
        )}
        <p className="m-0 text-[10px] leading-relaxed text-muted-foreground">{t('sceneFootnote')}</p>
      </CardContent>
    </Card>
  )
}
