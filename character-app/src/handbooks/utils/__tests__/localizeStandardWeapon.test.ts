import { describe, expect, it } from 'vitest'
import { localizeStandardWeapon } from '@/handbooks/utils/localizeStandardWeapon'
import { SWADE_WEAPONS } from '@/data/handbooks/weapons'
import { filterHandbookEntries } from '@/handbooks/utils/filterHandbookEntries'

describe('localizeStandardWeapon', () => {
  const translate = (key: string) => ({
    'weaponsCatalog.knife.name': 'Нож',
    'weaponsCatalog.knife.description': 'Компактный клинок для ближнего боя.',
  })[key] ?? key

  it('localizes a standard weapon name and description', () => {
    const knife = SWADE_WEAPONS.find(weapon => weapon.id === 'knife')
    if (!knife) throw new Error('Expected standard knife entry')

    expect(localizeStandardWeapon(knife, 'system', translate)).toMatchObject({
      name: 'Нож',
      description: 'Компактный клинок для ближнего боя.',
    })
  })

  it('leaves world overrides and custom entries untouched', () => {
    const knife = SWADE_WEAPONS.find(weapon => weapon.id === 'knife')
    if (!knife) throw new Error('Expected standard knife entry')

    expect(localizeStandardWeapon(knife, 'world', translate)).toBe(knife)
    expect(localizeStandardWeapon({ ...knife, id: 'custom-knife' }, 'system', translate).name)
      .toBe(knife.name)
  })

  it('allows filtering standard weapons by their localized names', () => {
    const knife = SWADE_WEAPONS.find(weapon => weapon.id === 'knife')
    if (!knife) throw new Error('Expected standard knife entry')
    const localizedKnife = localizeStandardWeapon(knife, 'system', translate)

    expect(filterHandbookEntries([localizedKnife], 'нож')).toEqual([localizedKnife])
  })
})
