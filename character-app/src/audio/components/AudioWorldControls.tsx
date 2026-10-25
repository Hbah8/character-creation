import { Check, ChevronDown, Globe, Plus, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface AudioWorldOption {
  id: string
  name: string
}

interface AudioWorldHeaderProps {
  activeWorldId: string
  activeWorldName: string
  worlds: AudioWorldOption[]
  onSelectWorld: (worldId: string) => void
}

export function AudioWorldHeader({
  activeWorldId,
  activeWorldName,
  worlds,
  onSelectWorld,
}: AudioWorldHeaderProps) {
  const { t } = useTranslation('audio')

  return (
    <header className="flex items-start justify-between gap-5 max-md:flex-col">
      <div>
        <h1 className="m-0 text-xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t('description')}</p>
      </div>
      <div className="flex items-center gap-2.5 max-md:w-full max-md:flex-wrap">
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 max-md:flex-1 max-md:justify-between max-[420px]:pl-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground max-[420px]:hidden">
            {t('activeWorld')}
          </span>
          <strong className="max-w-[180px] truncate text-xs max-md:flex-1" title={activeWorldName}>
            {activeWorldName}
          </strong>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {t('changeWorld')}
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {worlds.map(world => (
                  <DropdownMenuItem key={world.id} onClick={() => onSelectWorld(world.id)}>
                    {world.id === activeWorldId && <Check />}
                    {world.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

interface AudioEmptyWorldStateProps {
  worlds: AudioWorldOption[]
  onSelectWorld: (worldId: string) => void
  onCreateWorld: () => void
  onOpenWorlds: () => void
}

export function AudioEmptyWorldState({
  worlds,
  onSelectWorld,
  onCreateWorld,
  onOpenWorlds,
}: AudioEmptyWorldStateProps) {
  const { t } = useTranslation('audio')

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-5 p-6 max-md:gap-4 max-md:px-3.5 max-md:py-4">
        <header>
          <h1 className="m-0 text-xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t('description')}</p>
        </header>
        <section className="grid min-h-[min(580px,calc(100vh-140px))] flex-1 place-items-center max-md:min-h-[calc(100vh-150px)]">
          <div className="flex w-full max-w-[765px] flex-col items-center rounded-[22px] border border-border bg-card px-10 py-[58px] text-center max-md:rounded-[18px] max-md:px-5 max-md:py-10">
            <div className="mb-6 grid size-[74px] place-items-center rounded-[20px] border border-border bg-muted text-primary">
              <Volume2 className="size-[29px]" />
            </div>
            <h2 className="m-0 text-[28px] font-bold tracking-tight max-md:text-[23px]">
              {t('noWorldTitle')}
            </h2>
            <p className="mb-6 mt-[17px] max-w-[530px] text-[17px] leading-relaxed text-muted-foreground max-md:text-sm">
              {t('noWorldDescription')}
            </p>
            <div className="flex items-center justify-center gap-2.5 max-[420px]:w-full max-[420px]:flex-col">
              {worlds.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="max-[420px]:w-full">
                      <Globe data-icon="inline-start" />
                      {t('selectWorld')}
                      <ChevronDown data-icon="inline-end" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuGroup>
                      {worlds.map(world => (
                        <DropdownMenuItem key={world.id} onClick={() => onSelectWorld(world.id)}>
                          {world.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="max-[420px]:w-full" onClick={onOpenWorlds}>
                  <Globe data-icon="inline-start" />
                  {t('selectWorld')}
                </Button>
              )}
              <Button variant="outline" className="max-[420px]:w-full" onClick={onCreateWorld}>
                <Plus data-icon="inline-start" />
                {t('createWorld')}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
