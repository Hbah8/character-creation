import type { AnyHandbookEntry } from '@/handbooks/types'

/**
 * Computes the diff between form values and a base system entry.
 * When base is undefined (custom entry), all defined form values are returned.
 * Keys whose form value equals the base value are excluded from the result.
 * Keys with undefined values are excluded from the result.
 */
export function computeOverrideDiff(
  base: AnyHandbookEntry | undefined,
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  if (!base) {
    return Object.fromEntries(
      Object.entries(formValues).filter(([, v]) => v !== undefined),
    )
  }

  const baseRecord = base as unknown as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(formValues).filter(([k, v]) => {
      if (v === undefined) return false
      return v !== baseRecord[k]
    }),
  )
}
