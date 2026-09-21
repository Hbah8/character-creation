import type { AnyHandbookEntry } from '@/handbooks/types'
import type { HandbookCategory, WorldHandbookEntry } from '@/types/handbook'
import { validateHandbookEntry } from './validateHandbookEntry'

export function buildHandbookEntry(
  handbookCategory: HandbookCategory,
  id: string,
  baseEntry: AnyHandbookEntry | undefined,
  values: Record<string, unknown>,
): WorldHandbookEntry {
  const entry = baseEntry
    ? { mode: 'override', handbookCategory, id, ...values }
    : { mode: 'custom', handbookCategory, id, ...values }

  return validateHandbookEntry(entry)
}