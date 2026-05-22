import type { Edge, Hindrance, Weapon, Gear, Power, Mount, RacialAbility } from '@/types/handbook'

export type AnyHandbookEntry = Edge | Hindrance | Weapon | Gear | Power | Mount | RacialAbility

export function isPower(e: AnyHandbookEntry): e is Power {
  return 'ppCost' in e
}

export function isWeapon(e: AnyHandbookEntry): e is Weapon {
  return 'damage' in e
}

export function isMount(e: AnyHandbookEntry): e is Mount {
  return 'toughness' in e
}

export function isHindrance(e: AnyHandbookEntry): e is Hindrance {
  return 'type' in e &&
    ((e as { type: string }).type === 'Major' || (e as { type: string }).type === 'Minor')
}

export function isRacialAbility(e: AnyHandbookEntry): e is RacialAbility {
  return 'type' in e &&
    ((e as { type: string }).type === 'positive' || (e as { type: string }).type === 'negative')
}

export function isEdge(e: AnyHandbookEntry): e is Edge {
  return 'type' in e && !isHindrance(e) && !isRacialAbility(e)
}

export function isGear(e: AnyHandbookEntry): e is Gear {
  return !isPower(e) && !isWeapon(e) && !isMount(e) && !('type' in e)
}
