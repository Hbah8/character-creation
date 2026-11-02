import { describe, expect, it } from 'vitest'
import { formatWeaponRange } from '@/handbooks/utils/weaponRange'

describe('formatWeaponRange', () => {
  it('uses the localized close-combat distance label for melee weapons', () => {
    expect(formatWeaponRange(
      { type: 'melee' },
      { melee: 'Ближняя', reach: 'Досягаемость', extreme: 'Предельная' },
    )).toBe('Ближняя')
  })

  it('keeps melee reach visible alongside the close-combat distance label', () => {
    expect(formatWeaponRange(
      { type: 'melee', reach: 1 },
      { melee: 'Ближняя', reach: 'Досягаемость', extreme: 'Предельная' },
    )).toBe('Ближняя (1" Досягаемость)')
  })
})
