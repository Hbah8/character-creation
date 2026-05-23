import { PlusIcon, RotateCcwIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { AnyHandbookEntry } from '@/handbooks/types'
import {
  createEmptyHandbookFilters,
  getHandbookEntryFacetValues,
  hasActiveHandbookFilters,
  type HandbookFacetKey,
  type HandbookFilterState,
} from '@/handbooks/utils/filterHandbookEntries'
import {
  ARCANE_BACKGROUND_LABEL_KEYS,
  EDGE_TYPE_LABEL_KEYS,
  GEAR_CATEGORY_LABEL_KEYS,
  HINDRANCE_TYPE_LABEL_KEYS,
  MOUNT_CATEGORY_LABEL_KEYS,
  RACIAL_ABILITY_TYPE_LABEL_KEYS,
  RANK_LABEL_KEYS,
  WEAPON_CATEGORY_LABEL_KEYS,
} from '@/handbooks/utils/handbookTranslationKeys'
import type {
  ArcaneBackground,
  EdgeType,
  GearCategory,
  HandbookCategory,
  HindranceType,
  MountCategory,
  RacialAbilityType,
  Rank,
  WeaponCategory,
} from '@/types/handbook'

const EDGE_TYPES = [
  'Background',
  'Combat',
  'Leadership',
  'Power',
  'Professional',
  'Social',
  'Weird',
  'WildCard',
] as const

const HINDRANCE_TYPES = ['Major', 'Minor'] as const
const RANKS = ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary'] as const
const WEAPON_CATEGORIES = ['Melee', 'Ranged', 'Thrown', 'Unarmed'] as const
const GEAR_CATEGORIES = ['Adventuring', 'Clothing', 'Food', 'Tools', 'Other'] as const
const MOUNT_CATEGORIES = ['animal', 'vehicle'] as const
const RACIAL_ABILITY_TYPES = ['positive', 'negative'] as const
const ARCANE_BACKGROUNDS = ['Magic', 'Miracles', 'Psionics', 'SuperPowers', 'WeirdScience'] as const

interface FilterOption {
  value: string
  label: string
  count: number
}

interface FilterGroup {
  key: HandbookFacetKey
  label: string
  options: FilterOption[]
}

interface Props {
  category: HandbookCategory
  entries: AnyHandbookEntry[]
  filters: HandbookFilterState
  activeWorldName?: string
  onFiltersChange: (filters: HandbookFilterState) => void
  onAddCustom?: () => void
}

type HandbooksT = TFunction<'handbooks', undefined>

function countFacetValues(entries: AnyHandbookEntry[], key: HandbookFacetKey) {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    for (const value of getHandbookEntryFacetValues(entry, key)) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }

  return counts
}

function getFacetLabel(key: HandbookFacetKey, t: HandbooksT): string {
  switch (key) {
    case 'arcaneBackground':
      return t('fields.arcaneBackground')
    case 'category':
      return t('fields.category')
    case 'rank':
      return t('filter.rank')
    case 'source':
      return t('filter.source')
    case 'type':
      return t('fields.type')
    case 'wildCardOnly':
      return t('filter.flags')
  }
}

function getOptionLabel(
  category: HandbookCategory,
  key: HandbookFacetKey,
  value: string,
  activeWorldName: string | undefined,
  t: HandbooksT,
): string {
  if (key === 'source') {
    return value === 'world' && activeWorldName ? activeWorldName : t('badge.swade')
  }

  if (key === 'rank') {
    return value === 'none' ? t('filter.noRank') : t(RANK_LABEL_KEYS[value as Rank])
  }

  if (key === 'wildCardOnly') {
    return t('filter.wildCardOnly')
  }

  if (key === 'arcaneBackground') {
    return t(ARCANE_BACKGROUND_LABEL_KEYS[value as ArcaneBackground])
  }

  if (key === 'category') {
    if (category === 'weapon') return t(WEAPON_CATEGORY_LABEL_KEYS[value as WeaponCategory])
    if (category === 'gear') return t(GEAR_CATEGORY_LABEL_KEYS[value as GearCategory])
    if (category === 'mount') return t(MOUNT_CATEGORY_LABEL_KEYS[value as MountCategory])
  }

  if (key === 'type') {
    if (category === 'edge') return t(EDGE_TYPE_LABEL_KEYS[value as EdgeType])
    if (category === 'hindrance') return t(HINDRANCE_TYPE_LABEL_KEYS[value as HindranceType])
    if (category === 'racialAbility') return t(RACIAL_ABILITY_TYPE_LABEL_KEYS[value as RacialAbilityType])
  }

  return value
}

function buildGroup(
  category: HandbookCategory,
  entries: AnyHandbookEntry[],
  key: HandbookFacetKey,
  values: readonly string[],
  activeWorldName: string | undefined,
  t: HandbooksT,
): FilterGroup | null {
  const counts = countFacetValues(entries, key)
  const options = values
    .map(value => ({
      value,
      label: getOptionLabel(category, key, value, activeWorldName, t),
      count: counts.get(value) ?? 0,
    }))
    .filter(option => option.count > 0)

  if (options.length === 0) return null

  return {
    key,
    label: getFacetLabel(key, t),
    options,
  }
}

function getFilterGroups(
  category: HandbookCategory,
  entries: AnyHandbookEntry[],
  activeWorldName: string | undefined,
  t: HandbooksT,
): FilterGroup[] {
  const groups: Array<FilterGroup | null> = []

  const sourceGroup = buildGroup(category, entries, 'source', ['system', 'world'], activeWorldName, t)
  groups.push(sourceGroup && sourceGroup.options.length > 1 ? sourceGroup : null)

  if (category === 'edge') {
    groups.push(
      buildGroup(category, entries, 'type', EDGE_TYPES, activeWorldName, t),
      buildGroup(category, entries, 'rank', [...RANKS, 'none'], activeWorldName, t),
      buildGroup(category, entries, 'wildCardOnly', ['true'], activeWorldName, t),
    )
  }

  if (category === 'hindrance') {
    groups.push(buildGroup(category, entries, 'type', HINDRANCE_TYPES, activeWorldName, t))
  }

  if (category === 'weapon') {
    groups.push(buildGroup(category, entries, 'category', WEAPON_CATEGORIES, activeWorldName, t))
  }

  if (category === 'gear') {
    groups.push(buildGroup(category, entries, 'category', GEAR_CATEGORIES, activeWorldName, t))
  }

  if (category === 'power') {
    groups.push(buildGroup(category, entries, 'arcaneBackground', ARCANE_BACKGROUNDS, activeWorldName, t))
  }

  if (category === 'mount') {
    groups.push(buildGroup(category, entries, 'category', MOUNT_CATEGORIES, activeWorldName, t))
  }

  if (category === 'racialAbility') {
    groups.push(buildGroup(category, entries, 'type', RACIAL_ABILITY_TYPES, activeWorldName, t))
  }

  return groups.filter(group => group != null)
}

function getNextFacetState(
  filters: HandbookFilterState,
  key: HandbookFacetKey,
  value: string,
  checked: boolean,
): HandbookFilterState {
  const selected = new Set(filters.facets[key] ?? [])

  if (checked) {
    selected.add(value)
  } else {
    selected.delete(value)
  }

  const facets = { ...filters.facets }
  const nextValues = Array.from(selected)

  if (nextValues.length > 0) {
    facets[key] = nextValues
  } else {
    delete facets[key]
  }

  return { ...filters, facets }
}

export function HandbookFilterPanel({
  category,
  entries,
  filters,
  activeWorldName,
  onFiltersChange,
  onAddCustom,
}: Props) {
  const { t } = useTranslation('handbooks')
  const groups = getFilterGroups(category, entries, activeWorldName, t)
  const isActive = hasActiveHandbookFilters(filters)

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r bg-sidebar/30 max-lg:w-full max-lg:max-h-80 max-lg:border-r-0 max-lg:border-b">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold">{t('filter.title')}</h2>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {entries.length}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!isActive}
          onClick={() => onFiltersChange(createEmptyHandbookFilters())}
        >
          <RotateCcwIcon data-icon="inline-start" />
          {t('filter.clear')}
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-2 px-4 py-3">
        <Label htmlFor={`handbook-filter-search-${category}`}>
          {t('filter.search')}
        </Label>
        <Input
          id={`handbook-filter-search-${category}`}
          placeholder={t('search.placeholder')}
          value={filters.query}
          onChange={event => onFiltersChange({ ...filters, query: event.target.value })}
        />
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">{t('filter.noFacetGroups')}</p>
        ) : (
          <div className="flex flex-col">
            {groups.map((group, groupIndex) => (
              <section key={group.key} className="flex flex-col gap-3 px-4 py-4">
                {groupIndex > 0 && <Separator className="-mt-4 mb-1" />}
                <h3 className="text-sm font-medium">{group.label}</h3>
                <div className="flex flex-col gap-2">
                  {group.options.map(option => {
                    const optionId = `handbook-filter-${category}-${group.key}-${option.value}`
                    const checked = filters.facets[group.key]?.includes(option.value) ?? false

                    return (
                      <div key={option.value} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Checkbox
                            id={optionId}
                            checked={checked}
                            onCheckedChange={value => {
                              onFiltersChange(getNextFacetState(filters, group.key, option.value, value === true))
                            }}
                          />
                          <Label htmlFor={optionId} className="min-w-0 flex-1 font-normal">
                            <span className="truncate">{option.label}</span>
                          </Label>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {option.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {activeWorldName && onAddCustom && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <Button type="button" size="sm" variant="outline" onClick={onAddCustom} className="w-full">
              <PlusIcon data-icon="inline-start" />
              {t('actions.addCustom')}
            </Button>
          </div>
        </>
      )}
    </aside>
  )
}
