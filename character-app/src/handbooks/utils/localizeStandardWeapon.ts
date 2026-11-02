import type { Weapon, HandbookSource } from '@/types/handbook'
import { SWADE_WEAPONS } from '@/data/handbooks/weapons'

export const STANDARD_WEAPON_TRANSLATION_KEYS = {
  knife: { name: 'weaponsCatalog.knife.name', description: 'weaponsCatalog.knife.description' },
  'short-sword': { name: 'weaponsCatalog.short-sword.name', description: 'weaponsCatalog.short-sword.description' },
  'great-sword': { name: 'weaponsCatalog.great-sword.name', description: 'weaponsCatalog.great-sword.description' },
  'hand-axe': { name: 'weaponsCatalog.hand-axe.name', description: 'weaponsCatalog.hand-axe.description' },
  'short-bow': { name: 'weaponsCatalog.short-bow.name', description: 'weaponsCatalog.short-bow.description' },
  pistol: { name: 'weaponsCatalog.pistol.name', description: 'weaponsCatalog.pistol.description' },
  rifle: { name: 'weaponsCatalog.rifle.name', description: 'weaponsCatalog.rifle.description' },
  'throwing-knife': { name: 'weaponsCatalog.throwing-knife.name', description: 'weaponsCatalog.throwing-knife.description' },
  javelin: { name: 'weaponsCatalog.javelin.name', description: 'weaponsCatalog.javelin.description' },
  unarmed: { name: 'weaponsCatalog.unarmed.name', description: 'weaponsCatalog.unarmed.description' },
  'brass-knuckles': { name: 'weaponsCatalog.brass-knuckles.name', description: 'weaponsCatalog.brass-knuckles.description' },
} as const satisfies Record<
  (typeof SWADE_WEAPONS)[number]['id'],
  { name: string; description: string }
>

type WeaponTranslationKey =
  (typeof STANDARD_WEAPON_TRANSLATION_KEYS)[keyof typeof STANDARD_WEAPON_TRANSLATION_KEYS][keyof (typeof STANDARD_WEAPON_TRANSLATION_KEYS)[keyof typeof STANDARD_WEAPON_TRANSLATION_KEYS]]

export function localizeStandardWeapon<T extends Weapon>(
  weapon: T,
  source: HandbookSource | undefined,
  translate: (key: WeaponTranslationKey) => string,
): T {
  if (source !== 'system') return weapon

  const keys = STANDARD_WEAPON_TRANSLATION_KEYS[weapon.id as keyof typeof STANDARD_WEAPON_TRANSLATION_KEYS]
  if (!keys) return weapon

  return {
    ...weapon,
    name: translate(keys.name),
    description: translate(keys.description),
  }
}
