import type {
  ArcaneBackground,
  EdgeType,
  GearCategory,
  HindranceType,
  MountCategory,
  RacialAbilityType,
  Rank,
  WeaponCategory,
} from '@/types/handbook'

export const EDGE_TYPE_LABEL_KEYS = {
  Background: 'enums.edgeType.Background',
  Combat: 'enums.edgeType.Combat',
  Leadership: 'enums.edgeType.Leadership',
  Power: 'enums.edgeType.Power',
  Professional: 'enums.edgeType.Professional',
  Social: 'enums.edgeType.Social',
  Weird: 'enums.edgeType.Weird',
  WildCard: 'enums.edgeType.WildCard',
} as const satisfies Record<EdgeType, string>

export const HINDRANCE_TYPE_LABEL_KEYS = {
  Major: 'enums.hindranceType.Major',
  Minor: 'enums.hindranceType.Minor',
} as const satisfies Record<HindranceType, string>

export const RACIAL_ABILITY_TYPE_LABEL_KEYS = {
  positive: 'enums.racialAbilityType.positive',
  negative: 'enums.racialAbilityType.negative',
} as const satisfies Record<RacialAbilityType, string>

export const RANK_LABEL_KEYS = {
  Novice: 'enums.rank.Novice',
  Seasoned: 'enums.rank.Seasoned',
  Veteran: 'enums.rank.Veteran',
  Heroic: 'enums.rank.Heroic',
  Legendary: 'enums.rank.Legendary',
} as const satisfies Record<Rank, string>

export const WEAPON_CATEGORY_LABEL_KEYS = {
  Melee: 'enums.weaponCategory.Melee',
  Ranged: 'enums.weaponCategory.Ranged',
  Thrown: 'enums.weaponCategory.Thrown',
  Unarmed: 'enums.weaponCategory.Unarmed',
} as const satisfies Record<WeaponCategory, string>

export const GEAR_CATEGORY_LABEL_KEYS = {
  Adventuring: 'enums.gearCategory.Adventuring',
  Clothing: 'enums.gearCategory.Clothing',
  Food: 'enums.gearCategory.Food',
  Tools: 'enums.gearCategory.Tools',
  Other: 'enums.gearCategory.Other',
} as const satisfies Record<GearCategory, string>

export const MOUNT_CATEGORY_LABEL_KEYS = {
  animal: 'enums.mountCategory.animal',
  vehicle: 'enums.mountCategory.vehicle',
} as const satisfies Record<MountCategory, string>

export const ARCANE_BACKGROUND_LABEL_KEYS = {
  Magic: 'enums.arcaneBackground.Magic',
  Miracles: 'enums.arcaneBackground.Miracles',
  Psionics: 'enums.arcaneBackground.Psionics',
  SuperPowers: 'enums.arcaneBackground.SuperPowers',
  WeirdScience: 'enums.arcaneBackground.WeirdScience',
} as const satisfies Record<ArcaneBackground, string>
