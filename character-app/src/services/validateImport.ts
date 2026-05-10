import type { Character } from '@/types/character'

const DIE_NAMES = ['d4', 'd6', 'd8', 'd10', 'd12'] as const

function isDieName(value: unknown): value is Character['agility'] {
  return typeof value === 'string' && (value === '' || (DIE_NAMES as readonly string[]).includes(value))
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateCharacterImport(raw: unknown): Character {
  if (!isObject(raw)) {
    throw new Error('Файл должен содержать JSON-объект персонажа.')
  }

  const requiredStrings: (keyof Character)[] = [
    'callsign', 'name', 'rank', 'role', 'fileNo', 'portraitUrl', 'sheetTitle',
    'pace', 'parry', 'toughness', 'bennies', 'wounds', 'fatigue', 'mana', 'notes',
  ]

  for (const key of requiredStrings) {
    if (!isString(raw[key])) {
      throw new Error(`Поле "${key}" отсутствует или имеет неверный тип (ожидается строка).`)
    }
  }

  const requiredDice: (keyof Character)[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']
  for (const key of requiredDice) {
    if (!isString(raw[key])) {
      throw new Error(`Поле "${key}" должно быть строкой (например: d6, d6(A) или пустым).`)
    }
  }

  if (!isArray(raw.skills)) throw new Error('Поле "skills" должно быть массивом.')
  if (!isArray(raw.edges)) throw new Error('Поле "edges" должно быть массивом.')
  if (!isArray(raw.hindrances)) throw new Error('Поле "hindrances" должно быть массивом.')
  if (!isArray(raw.weapons)) throw new Error('Поле "weapons" должно быть массивом.')
  if (!isArray(raw.gear)) throw new Error('Поле "gear" должно быть массивом.')
  if (!isArray(raw.specialRules)) throw new Error('Поле "specialRules" должно быть массивом.')

  return raw as unknown as Character
}
