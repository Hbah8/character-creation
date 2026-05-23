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
import { HandbookEntryForm } from '@/handbooks/components/HandbookEntryForm'
import { HandbookFilterPanel } from '@/handbooks/components/HandbookFilterPanel'
import { HandbookList } from '@/handbooks/components/HandbookList'
import { HandbookStatList } from '@/handbooks/components/HandbookStatList'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import {
  createEmptyHandbookFilters,
  filterHandbookEntries,
  hasActiveHandbookFilters,
} from '@/handbooks/utils/filterHandbookEntries'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { AnyHandbookEntry } from '@/handbooks/types'
import type { HandbookCategory, HandbookOverride } from '@/types/handbook'

type TabLayout = 'cards' | 'stat'

const TABS: Array<{
  key: string
  labelKey: 'tabs.edges' | 'tabs.hindrances' | 'tabs.weapons' | 'tabs.gear' | 'tabs.powers' | 'tabs.transport' | 'tabs.racialAbilities'
  category: HandbookCategory
  entries: AnyHandbookEntry[]
  layout: TabLayout
}> = [
  { key: 'edges',           labelKey: 'tabs.edges',           category: 'edge',          entries: SWADE_EDGES as AnyHandbookEntry[],           layout: 'cards' },
  { key: 'hindrances',      labelKey: 'tabs.hindrances',      category: 'hindrance',     entries: SWADE_HINDRANCES as AnyHandbookEntry[],      layout: 'cards' },
  { key: 'weapons',         labelKey: 'tabs.weapons',         category: 'weapon',        entries: SWADE_WEAPONS as AnyHandbookEntry[],         layout: 'stat' },
  { key: 'gear',            labelKey: 'tabs.gear',            category: 'gear',          entries: SWADE_GEAR as AnyHandbookEntry[],            layout: 'stat' },
  { key: 'powers',          labelKey: 'tabs.powers',          category: 'power',         entries: SWADE_POWERS as AnyHandbookEntry[],          layout: 'cards' },
  { key: 'transport',       labelKey: 'tabs.transport',       category: 'mount',         entries: SWADE_MOUNTS as AnyHandbookEntry[],          layout: 'stat' },
  { key: 'racialAbilities', labelKey: 'tabs.racialAbilities', category: 'racialAbility', entries: SWADE_RACIAL_ABILITIES as AnyHandbookEntry[], layout: 'cards' },
]

interface FormState {
  open: boolean
  category: HandbookCategory
  baseEntry?: AnyHandbookEntry
  existingOverride?: HandbookOverride
}

export function HandbooksPage() {
  const { t } = useTranslation('handbooks')
  const { entries: worldEntries, activeWorldId, saveById } = useWorldLibrary()
  const [filters, setFilters] = useState(createEmptyHandbookFilters)
  const [formState, setFormState] = useState<FormState | null>(null)

  const activeWorld = activeWorldId
    ? worldEntries.find(e => e.id === activeWorldId)?.world ?? null
    : null
  const worldHandbook: HandbookOverride[] = activeWorld?.worldHandbook ?? []

  function handleTabChange() {
    setFilters(createEmptyHandbookFilters())
  }

  function openOverride(category: HandbookCategory, entry: AnyHandbookEntry) {
    const existing = worldHandbook.find(o => o.id === entry.id && o.category === category)
    setFormState({ open: true, category, baseEntry: entry, existingOverride: existing })
  }

  function openAddCustom(category: HandbookCategory) {
    setFormState({ open: true, category })
  }

  function handleSaveOverride(override: HandbookOverride) {
    if (!activeWorldId || !activeWorld) return
    const updated = {
      ...activeWorld,
      worldHandbook: [
        ...worldHandbook.filter(o => !(o.id === override.id && o.category === override.category)),
        override,
      ],
    }
    saveById(activeWorldId, updated)
    setFormState(null)
  }

  function handleDeleteOverride(id: string, category: HandbookCategory) {
    if (!activeWorldId || !activeWorld) return
    const updated = {
      ...activeWorld,
      worldHandbook: worldHandbook.filter(o => !(o.id === id && o.category === category)),
    }
    saveById(activeWorldId, updated)
    setFormState(null)
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
              const resolved = resolveHandbookEntries(tab.category, worldHandbook, tab.entries)
              const filtered = filterHandbookEntries(resolved, filters)
              const hasActiveFilters = hasActiveHandbookFilters(filters)

              return (
                <TabsContent
                  key={tab.key}
                  value={tab.key}
                  className="h-full mt-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  <div className="flex h-full overflow-hidden max-lg:flex-col">
                    <HandbookFilterPanel
                      category={tab.category}
                      entries={resolved as AnyHandbookEntry[]}
                      filters={filters}
                      activeWorldName={activeWorld?.name}
                      onFiltersChange={setFilters}
                      onAddCustom={() => openAddCustom(tab.category)}
                    />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      {tab.layout === 'stat' ? (
                        <HandbookStatList
                          entries={filtered as AnyHandbookEntry[]}
                          hasActiveFilters={hasActiveFilters}
                          activeWorldName={activeWorld?.name}
                          onOverride={entry => openOverride(tab.category, entry)}
                          onEditOverride={entry => openOverride(tab.category, entry)}
                          onDeleteOverride={entry => handleDeleteOverride(entry.id, tab.category)}
                        />
                      ) : (
                        <div className="h-full overflow-y-auto">
                          <div className="p-6">
                            <HandbookList
                              entries={filtered as AnyHandbookEntry[]}
                              hasActiveFilters={hasActiveFilters}
                              activeWorldName={activeWorld?.name}
                              onOverride={entry => openOverride(tab.category, entry)}
                              onEditOverride={entry => openOverride(tab.category, entry)}
                              onDeleteOverride={entry => handleDeleteOverride(entry.id, tab.category)}
                            />
                          </div>
                        </div>
                      )}
                      </div>
                  </div>
                </TabsContent>
              )
            })}
          </div>
        </Tabs>
      </div>

      {formState && (
        <HandbookEntryForm
          open={formState.open}
          category={formState.category}
          baseEntry={formState.baseEntry}
          existingOverride={formState.existingOverride}
          worldName={activeWorld?.name ?? ''}
          onClose={() => setFormState(null)}
          onSave={handleSaveOverride}
          onDelete={formState.existingOverride
            ? () => handleDeleteOverride(formState.existingOverride!.id, formState.category)
            : undefined
          }
        />
      )}
    </div>
  )
}
