import type {
  HandbookEntry,
  HandbookCategory,
  ResolvedEntry,
  StoredHandbookEntry,
  WorldHandbookEntry,
} from '@/types/handbook'

function isCustomEntry(entry: StoredHandbookEntry): entry is Extract<WorldHandbookEntry, { mode: 'custom' }> {
  return 'mode' in entry && entry.mode === 'custom'
}

function isExplicitOverride(entry: StoredHandbookEntry): boolean {
  return 'mode' in entry && entry.mode === 'override'
}

function getHandbookCategory(entry: StoredHandbookEntry): HandbookCategory {
  return 'handbookCategory' in entry ? entry.handbookCategory : entry.category
}

function toEntryFields(entry: StoredHandbookEntry): object {
  const { category: _category, handbookCategory: _handbookCategory, mode: _mode, ...fields } =
    entry as unknown as Record<string, unknown>
  return fields
}

export function resolveHandbookEntries<T extends HandbookEntry>(
  category: HandbookCategory,
  worldHandbook: StoredHandbookEntry[],
  systemData: T[],
): ResolvedEntry<T>[] {
  const systemIds = new Set(systemData.map(entry => entry.id))
  const overrideMap = new Map<string, StoredHandbookEntry>()
  for (const entry of worldHandbook) {
    if (getHandbookCategory(entry) === category && !isCustomEntry(entry) && systemIds.has(entry.id)) {
      overrideMap.set(entry.id, entry)
    }
  }

  const resolved: ResolvedEntry<T>[] = systemData.map(systemEntry => {
    const override = overrideMap.get(systemEntry.id)
    if (override) {
      return { ...systemEntry, ...toEntryFields(override), source: 'world' } as ResolvedEntry<T>
    }
    return { ...systemEntry, source: 'system' }
  })

  for (const entry of worldHandbook) {
    const isLegacyEntry = !('mode' in entry)
    if (
      getHandbookCategory(entry) === category
      && !systemIds.has(entry.id)
      && !isExplicitOverride(entry)
      && (isCustomEntry(entry) || isLegacyEntry)
    ) {
      resolved.push({ ...toEntryFields(entry), source: 'world' } as ResolvedEntry<T>)
    }
  }

  return resolved
}
