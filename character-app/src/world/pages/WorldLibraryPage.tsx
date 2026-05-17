import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Network, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

export function WorldLibraryPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('library')
  const library = useWorldLibrary()

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('worlds.title')}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {t('worlds.description')}
              </p>
            </div>
            <Button onClick={() => navigate('/worlds/new')}>
              <Plus className="size-4 mr-1.5" />
              {t('worlds.newWorld')}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {library.entries.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-md border flex items-center justify-center shrink-0">
                    <Network className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-sm truncate">
                      {entry.world.name || t('worlds.untitledWorld')}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.world.summary || t('worlds.noSummary')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('worlds.entityCount', { count: entry.world.entities.length })}</span>
                  <span>{t('worlds.relationshipCount', { count: entry.world.relationships.length })}</span>
                  <span>{formatDate(entry.savedAt)}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/worlds/${entry.id}`)}
                  >
                    <Box className="size-3.5 mr-1" />
                    {t('worlds.open')}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => library.remove(entry.id)}
                    aria-label={t('worlds.deleteWorld')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {library.entries.length === 0 && (
          <div className="border rounded-md p-8 text-center">
            <p className="text-sm text-muted-foreground">{t('worlds.noSavedWorlds')}</p>
            <Button className="mt-4" onClick={() => navigate('/worlds/new')}>
              <Plus className="size-4 mr-1.5" />
              {t('worlds.createFirstWorld')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
