import type { Character, AttributeKey, HindranceSeverity, CharacterLayout, ColumnSide } from '@/types/character'
import { DEFAULT_LAYOUT } from '@/types/character'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']

// TODO: remove shim once all exported JSONs have been migrated
function migrateSeverity(value: unknown): HindranceSeverity {
  if (value === 'М') return 'minor'
  if (value === 'К') return 'major'
  if (value === 'minor' || value === 'major') return value
  return 'minor'
}

// TODO: remove shim once all exported JSONs have been migrated
function migrateLinkedAttribute(value: unknown): AttributeKey {
  const legacyMap: Record<string, AttributeKey> = {
    'Ловкость': 'agility',
    'Сила': 'strength',
    'Смекалка': 'smarts',
    'Характер': 'spirit',
    'Выносливость': 'vigor',
  }
  if (isString(value)) {
    const mapped = legacyMap[value]
    if (mapped) return mapped
    if (ATTRIBUTE_KEYS.includes(value as AttributeKey)) return value as AttributeKey
  }
  return 'agility'
}

export function validateCharacterImport(raw: unknown): Character {
  if (!isObject(raw)) {
    throw new Error('validation.import.notAnObject')
  }

  const requiredStrings: (keyof Character)[] = [
    'callsign', 'name', 'rank', 'role', 'fileNo', 'portraitUrl', 'sheetTitle',
    'pace', 'parry', 'toughness', 'bennies', 'wounds', 'fatigue', 'mana', 'notes',
  ]

  for (const key of requiredStrings) {
    if (!isString(raw[key])) {
      throw new Error(`validation.import.missingStringField:${key}`)
    }
  }

  const requiredDice: (keyof Character)[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']
  for (const key of requiredDice) {
    if (!isString(raw[key])) {
      throw new Error(`validation.import.missingDieField:${key}`)
    }
  }

  if (!isArray(raw.skills)) throw new Error('validation.import.skillsNotArray')
  if (!isArray(raw.edges)) throw new Error('validation.import.edgesNotArray')
  if (!isArray(raw.hindrances)) throw new Error('validation.import.hindrancesNotArray')
  if (!isArray(raw.weapons)) throw new Error('validation.import.weaponsNotArray')
  if (!isArray(raw.gear)) throw new Error('validation.import.gearNotArray')
  if (!isArray(raw.specialRules)) throw new Error('validation.import.specialRulesNotArray')

  // Migrate hindrances severity and skill linkedAttribute for legacy JSON files
  const hindrances = (raw.hindrances as unknown[]).map((h) => {
    if (!isObject(h)) return h
    return { ...h, severity: migrateSeverity(h.severity) }
  })

  const skills = (raw.skills as unknown[]).map((s) => {
    if (!isObject(s)) return s
    return { ...s, linkedAttribute: migrateLinkedAttribute(s.linkedAttribute), isStarter: !!s.isStarter }
  })

  const COLUMN_SIDES: ColumnSide[] = ['left', 'right']
  const LAYOUT_KEYS: (keyof CharacterLayout)[] = ['weapons', 'edges', 'hindrances', 'gear', 'specialRules']

  let layout: CharacterLayout = { ...DEFAULT_LAYOUT }
  if (isObject(raw.layout)) {
    const partial: Partial<CharacterLayout> = {}
    for (const key of LAYOUT_KEYS) {
      const val = (raw.layout as Record<string, unknown>)[key]
      partial[key] = COLUMN_SIDES.includes(val as ColumnSide) ? (val as ColumnSide) : DEFAULT_LAYOUT[key]
    }
    layout = partial as CharacterLayout
  }

  return { ...(raw as unknown as Character), hindrances: hindrances as Character['hindrances'], skills: skills as Character['skills'], layout, worldId: isString(raw.worldId) ? raw.worldId : undefined }
}
