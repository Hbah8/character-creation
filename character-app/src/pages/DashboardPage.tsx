import { useNavigate } from 'react-router-dom'
import { Plus, Users, Clock, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DashboardCharacterGrid } from '@/components/DashboardCharacterGrid'
import { useCharacterLibrary } from '@/store/useCharacterLibrary'

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const library = useCharacterLibrary()

  const lastEntry = library.entries.length > 0
    ? library.entries.reduce((latest, e) =>
        e.savedAt > latest.savedAt ? e : latest,
        library.entries[0]
      )
    : undefined

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-y-auto">
      <div className="p-6 max-w-6xl w-full mx-auto flex flex-col gap-8">

        {/* Hero */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Персонажи SWADE</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Создавайте, редактируйте и управляйте персонажами для ваших кампаний.
          </p>
          <div className="mt-1">
            <Button onClick={() => navigate('/creator')}>
              <Plus className="size-4 mr-1.5" />
              Новый персонаж
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stat chips */}
        <div className="flex flex-wrap gap-3">
          <Card className="flex-none">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">Персонажей</p>
                <p className="text-xl font-bold leading-none">{library.entries.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-none">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">Последнее изменение</p>
                <p className="text-sm font-semibold leading-none">{formatDate(lastEntry?.savedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {lastEntry && (
            <Card className="flex-none">
              <CardContent className="flex items-center gap-3 px-4 py-3">
                <UserCircle className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-1">Последний изменён</p>
                  <p className="text-sm font-semibold leading-none max-w-36 truncate">
                    {lastEntry.character.callsign || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Characters section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Персонажи
              {library.entries.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({library.entries.length})
                </span>
              )}
            </h2>
            {library.entries.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => navigate('/creator')}>
                <Plus className="size-3.5 mr-1" />
                Добавить
              </Button>
            )}
          </div>
          <DashboardCharacterGrid
            entries={library.entries}
            onDelete={library.remove}
          />
        </div>

      </div>
    </div>
  )
}
