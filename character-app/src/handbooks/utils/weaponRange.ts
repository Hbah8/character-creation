import type { WeaponRange } from '@/types/handbook'

export interface WeaponRangeLabels {
  melee: string
  reach: string
  extreme: string
}

export function parseLegacyWeaponRange(value: string): WeaponRange {
  const distances = value.trim().match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  if (distances) {
    const [short, medium, long] = distances.slice(1).map(Number)
    if (short > 0 && medium > 0 && long > 0) {
      return { type: 'bands', short, medium, long }
    }
  }

  if (/^(melee|ближ\.|ближний бой)$/i.test(value.trim())) {
    return { type: 'melee' }
  }

  throw new Error('validation.handbook.invalidRange')
}

export function formatWeaponRange(
  range: WeaponRange | string | undefined,
  labels: WeaponRangeLabels,
): string | undefined {
  if (!range) return undefined
  if (typeof range === 'string') return range

  switch (range.type) {
    case 'bands':
      return `${range.short}/${range.medium}/${range.long}${range.extreme ? ` (${labels.extreme})` : ''}`
    case 'melee':
      return range.reach === undefined
        ? labels.melee
        : `${labels.melee} (${range.reach}" ${labels.reach})`
  }
}
