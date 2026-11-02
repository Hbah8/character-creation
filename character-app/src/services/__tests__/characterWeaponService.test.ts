import { describe, expect, it } from 'vitest'
import { createCharacterWeaponFromHandbook } from '@/services/characterWeaponService'

describe('createCharacterWeaponFromHandbook', () => {
  it('copies handbook weapon stats and keeps structured range serializable', () => {
    const weapon = createCharacterWeaponFromHandbook({
      id: 'rifle',
      name: 'Hunting Rifle',
      description: '',
      category: 'Ranged',
      range: { type: 'bands', short: 24, medium: 48, long: 96, extreme: true },
      damage: '2d8',
      ap: 2,
      rof: 1,
      weight: 8,
      cost: 500,
    }, 'character-weapon-id')

    expect(weapon).toEqual({
      id: 'character-weapon-id',
      name: 'Hunting Rifle',
      range: { type: 'bands', short: 24, medium: 48, long: 96, extreme: true },
      damage: '2d8',
      ap: '2',
      rof: '1',
      magazine: '',
      category: 'Ranged',
      weight: 8,
      cost: 500,
    })
  })

  it('retains the area template independently of weapon range', () => {
    const weapon = createCharacterWeaponFromHandbook({
      id: 'flamethrower',
      name: 'Flamethrower',
      description: '',
      category: 'Ranged',
      range: { type: 'bands', short: 6, medium: 6, long: 6 },
      areaTemplate: 'cone',
      damage: '3d6',
    }, 'character-weapon-id')

    expect(weapon).toMatchObject({
      range: { type: 'bands', short: 6, medium: 6, long: 6 },
      areaTemplate: 'cone',
    })
  })

  it('keeps melee reach and leaves unavailable character-sheet fields blank', () => {
    const weapon = createCharacterWeaponFromHandbook({
      id: 'short-sword',
      name: 'Short Sword',
      description: '',
      category: 'Melee',
      range: { type: 'melee', reach: 1 },
      damage: 'Str+d6',
    }, 'character-weapon-id')

    expect(weapon).toMatchObject({
      range: { type: 'melee', reach: 1 },
      ap: '',
      rof: '',
      magazine: '',
    })
  })

  it('uses melee range when a melee handbook weapon omits an explicit range', () => {
    const weapon = createCharacterWeaponFromHandbook({
      id: 'hand-axe',
      name: 'Hand Axe',
      description: '',
      category: 'Melee',
      damage: 'Str+d6',
    }, 'character-weapon-id')

    expect(weapon.range).toEqual({ type: 'melee' })
  })

  it('uses an empty legacy range when a handbook weapon has no range', () => {
    const weapon = createCharacterWeaponFromHandbook({
      id: 'unarmed',
      name: 'Unarmed Strike',
      description: '',
      category: 'Unarmed',
      damage: 'Str',
    }, 'character-weapon-id')

    expect(weapon.range).toBe('')
  })
})
