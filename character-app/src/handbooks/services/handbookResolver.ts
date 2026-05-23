import type {
  HandbookEntry,
  HandbookCategory,
  HandbookOverride,
  ResolvedEntry,
} from '@/types/handbook'

export function resolveHandbookEntries<T extends HandbookEntry>(
  category: HandbookCategory,
  worldHandbook: HandbookOverride[],
  systemData: T[],
): ResolvedEntry<T>[] {
  const overrideMap = new Map<string, HandbookOverride>()
  for (const entry of worldHandbook) {
    if (entry.category === category) {
      overrideMap.set(entry.id, entry)
    }
  }

  const systemIds = new Set(systemData.map(e => e.id))

  const resolved: ResolvedEntry<T>[] = systemData.map(systemEntry => {
    const override = overrideMap.get(systemEntry.id)
    if (override) {
      return { ...systemEntry, ...override, source: 'world' } as ResolvedEntry<T>
    }
    return { ...systemEntry, source: 'system' }
  })

  for (const entry of worldHandbook) {
    if (entry.category === category && !systemIds.has(entry.id)) {
      resolved.push({ ...entry, source: 'world' } as unknown as ResolvedEntry<T>)
    }
  }

  return resolved
}
