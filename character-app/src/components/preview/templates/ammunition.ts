export function getMagazineCapacity(magazine: string): number | null {
  const normalized = magazine.trim()
  if (!/^\d+$/.test(normalized)) return null

  const capacity = Number(normalized)
  return Number.isSafeInteger(capacity) && capacity > 0 ? capacity : null
}
