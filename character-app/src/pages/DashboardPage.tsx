import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Users, Clock, UserCircle, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardCharacterGrid } from '@/components/DashboardCharacterGrid'
import { useCharacterLibrary } from '@/store/useCharacterLibrary'
import { useSessionAccount } from '@/accounts/useSessionAccount'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { filterCharactersByWorld } from '@/services/filterCharactersByWorld'

function formatDate(iso: string | undefined, locale: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale)
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { t: tNav } = useTranslation('navigation')
  const { t, i18n } = useTranslation('library')
  const account = useSessionAccount()
  const library = useCharacterLibrary(account.id)
  const { activeWorldId, entries: worlds, loading: worldsLoading } = useWorldLibrary()
  const loading = library.loading || worldsLoading
  const entries = filterCharactersByWorld(library.entries, activeWorldId)
  const lastEntry = loading ? undefined : entries[0]
  const activeWorld = worlds.find(entry => entry.id === activeWorldId)

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-y-auto">
      <div className="p-6 max-w-6xl w-full mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('dashboardTitle')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {activeWorldId
              ? t('worldCharacters', { name: activeWorld?.world.name ?? '' })
              : t('standaloneCharacters')}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button onClick={() => navigate('/creator')}>
              <Plus className="size-4 mr-1.5" />
              {t('newCharacter')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/worlds')}>
              <Globe2 className="size-4 mr-1.5" />
              {tNav('worlds')}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Card className="flex-none">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">{t('characterCount')}</p>
                <p className="text-xl font-bold leading-none">
                  {loading ? '…' : entries.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-none">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">{t('lastChanged')}</p>
                <p className="text-sm font-semibold leading-none">
                  {formatDate(lastEntry?.updatedAt, i18n.resolvedLanguage)}
                </p>
              </div>
            </CardContent>
          </Card>

          {lastEntry && (
            <Card className="flex-none">
              <CardContent className="flex items-center gap-3 px-4 py-3">
                <UserCircle className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-1">{t('lastEdited')}</p>
                  <p className="text-sm font-semibold leading-none max-w-36 truncate">
                    {lastEntry.character.callsign || t('unnamed')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {t('charactersSection')}
              {!loading && entries.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({entries.length})
                </span>
              )}
            </h2>
            {!loading && entries.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => navigate('/creator')}>
                <Plus className="size-3.5 mr-1" />
                {t('addCharacter')}
              </Button>
            )}
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground" role="status">
              {t('loadingCharacters')}
            </p>
          ) : library.error ? (
            <Alert variant="destructive">
              <AlertDescription>{t(`errors.${library.error.code}`)}</AlertDescription>
              <Button size="sm" variant="outline" onClick={() => void library.reload()}>
                {t('retry')}
              </Button>
            </Alert>
          ) : (
            <DashboardCharacterGrid
              entries={entries}
              onDelete={library.remove}
            />
          )}
        </div>

      </div>
    </div>
  )
}
