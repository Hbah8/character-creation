import type { HandbookEntry } from '@/types/handbook'

export function filterHandbookEntries<T extends HandbookEntry>(
  entries: readonly T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries as T[]
  return entries.filter(e => e.name.toLowerCase().includes(q))
}
