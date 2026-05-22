import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import { SWADE_WEAPONS } from '@/data/handbooks/weapons'
import { SWADE_GEAR } from '@/data/handbooks/gear'
import { SWADE_POWERS } from '@/data/handbooks/powers'
import { SWADE_MOUNTS } from '@/data/handbooks/mounts'
import { SWADE_RACIAL_ABILITIES } from '@/data/handbooks/racialAbilities'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HandbookList } from '@/handbooks/components/HandbookList'
import { HandbookStatList } from '@/handbooks/components/HandbookStatList'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { AnyHandbookEntry } from '@/handbooks/types'

type TabLayout = 'cards' | 'stat'

const TABS: Array<{
  key: string
  labelKey: 'tabs.edges' | 'tabs.hindrances' | 'tabs.weapons' | 'tabs.gear' | 'tabs.powers' | 'tabs.transport' | 'tabs.racialAbilities'
  entries: AnyHandbookEntry[]
  layout: TabLayout
}> = [
  { key: 'edges', labelKey: 'tabs.edges', entries: SWADE_EDGES as AnyHandbookEntry[], layout: 'cards' },
  { key: 'hindrances', labelKey: 'tabs.hindrances', entries: SWADE_HINDRANCES as AnyHandbookEntry[], layout: 'cards' },
  { key: 'weapons', labelKey: 'tabs.weapons', entries: SWADE_WEAPONS as AnyHandbookEntry[], layout: 'stat' },
  { key: 'gear', labelKey: 'tabs.gear', entries: SWADE_GEAR as AnyHandbookEntry[], layout: 'stat' },
  { key: 'powers', labelKey: 'tabs.powers', entries: SWADE_POWERS as AnyHandbookEntry[], layout: 'cards' },
  { key: 'transport', labelKey: 'tabs.transport', entries: SWADE_MOUNTS as AnyHandbookEntry[], layout: 'stat' },
  { key: 'racialAbilities', labelKey: 'tabs.racialAbilities', entries: SWADE_RACIAL_ABILITIES as AnyHandbookEntry[], layout: 'cards' },
]

export function HandbooksPage() {
  const { t } = useTranslation('handbooks')
  const { entries: worldEntries, activeWorldId } = useWorldLibrary()
  const [search, setSearch] = useState('')

  // M3 stub: read world-level handbook overrides when available
  const activeWorld = activeWorldId
    ? worldEntries.find(e => e.id === activeWorldId)?.world
    : null
  const worldOverrides: AnyHandbookEntry[] = (activeWorld as Record<string, unknown> | null)
    ?.handbookOverrides as AnyHandbookEntry[] ?? []

  function handleTabChange() {
    setSearch('')
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center px-6 py-4 border-b">
        <h1 className="text-lg font-semibold">{t('title')}</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs
          defaultValue="edges"
          className="flex flex-col h-full"
          onValueChange={handleTabChange}
        >
          <div className="px-6 pt-4 border-b overflow-x-auto shrink-0">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
              {TABS.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
                  {t(tab.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content — each tab manages its own scrolling */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {TABS.map(tab => {
              const allEntries = worldOverrides.length > 0
                ? [...tab.entries, ...worldOverrides.filter(o => !tab.entries.some(e => e.id === o.id))]
                : tab.entries

              return (
                <TabsContent
                  key={tab.key}
                  value={tab.key}
                  className="h-full mt-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  {tab.layout === 'stat' ? (
                    <HandbookStatList
                      entries={allEntries}
                      search={search}
                      onSearchChange={setSearch}
                    />
                  ) : (
                    <div className="h-full overflow-y-auto">
                      <div className="p-6">
                        <HandbookList
                          entries={allEntries}
                          search={search}
                          onSearchChange={setSearch}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
