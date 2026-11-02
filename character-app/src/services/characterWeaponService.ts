import type { Weapon as CharacterWeapon } from '@/types/character'
import type { Weapon as HandbookWeapon } from '@/types/handbook'

export function createCharacterWeaponFromHandbook(
  weapon: HandbookWeapon,
  characterWeaponId: string,
): CharacterWeapon {
  return {
    id: characterWeaponId,
    name: weapon.name,
    range: weapon.range
      ? { ...weapon.range }
      : weapon.category === 'Melee'
        ? { type: 'melee' }
        : '',
    damage: weapon.damage,
    ap: weapon.ap == null ? '' : String(weapon.ap),
    rof: weapon.rof == null ? '' : String(weapon.rof),
    magazine: '',
    category: weapon.category,
    ...(weapon.areaTemplate ? { areaTemplate: weapon.areaTemplate } : {}),
    ...(weapon.weight == null ? {} : { weight: weapon.weight }),
    ...(weapon.cost == null ? {} : { cost: weapon.cost }),
  }
}
