import type { Character, AttributeKey, HindranceSeverity, CharacterLayout, ColumnSide, CharacterPower, PowerModifier, CombatModifier, CombatModifierSource } from '@/types/character'
import { DEFAULT_LAYOUT } from '@/types/character'
import { parseToughness } from '@/utils/toughnessUtils'

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
const COMBAT_MODIFIER_SOURCES: CombatModifierSource[] = ['edge', 'hindrance', 'equipment', 'manual']

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

function migrateSkillKey(skill: Record<string, unknown>): string | undefined {
  if (isString(skill.skillKey)) return skill.skillKey
  if (skill.id === 'fighting' || skill.name === 'Fighting' || skill.name === 'Драка') return 'fighting'
  return undefined
}

function dieValue(die: unknown): number {
  if (!isString(die)) return 0
  const match = /^d(4|6|8|10|12)(?:\+(1|2))?$/.exec(die)
  return match ? Number(match[1]) + Number(match[2] ?? 0) : 0
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function validateCombatModifiers(value: unknown): CombatModifier[] | undefined {
  if (!isArray(value)) return undefined
  return value.flatMap((item): CombatModifier[] => {
    if (!isObject(item) || !isString(item.id) || !isString(item.name) || !COMBAT_MODIFIER_SOURCES.includes(item.source as CombatModifierSource)) {
      return []
    }
    return [{
      id: item.id,
      source: item.source as CombatModifierSource,
      name: item.name,
      pace: numberOrZero(item.pace),
      parry: numberOrZero(item.parry),
      toughness: numberOrZero(item.toughness),
      armor: numberOrZero(item.armor),
      runningDieSteps: numberOrZero(item.runningDieSteps),
    }]
  })
}

function migrateLegacyCombatModifiers(raw: Record<string, unknown>, skills: Character['skills']): Pick<Character, 'combatModifiers' | 'importWarnings'> {
  const existing = validateCombatModifiers(raw.combatModifiers)
  if (existing) return { combatModifiers: existing }

  const pace = Number.parseInt(String(raw.pace), 10)
  const fighting = skills.find(skill => skill.skillKey === 'fighting')
  const parry = Number.parseInt(String(raw.parry), 10)
  const parsedToughness = parseToughness(String(raw.toughness))
  const standaloneArmor = Number.parseInt(String(raw.armor ?? ''), 10)
  const armor = parsedToughness?.armor ?? (Number.isFinite(standaloneArmor) && standaloneArmor > 0 ? standaloneArmor : 0)
  const basePace = 6
  const baseParry = 2 + Math.floor(dieValue(fighting?.die) / 2)
  const baseToughness = 2 + Math.floor(dieValue(raw.vigor) / 2) + (typeof raw.size === 'number' ? raw.size : 0)
  const displayedToughness = parsedToughness?.base ?? baseToughness
  const importWarnings = parsedToughness && Number.isFinite(standaloneArmor) && standaloneArmor !== parsedToughness.armor
    ? ['validation.import.legacyArmorConflict']
    : undefined

  return {
    combatModifiers: [{
      id: 'legacy-combat-values',
      source: 'manual',
      name: 'Legacy combat values',
      pace: Number.isFinite(pace) ? pace - basePace : 0,
      parry: Number.isFinite(parry) ? parry - baseParry : 0,
      toughness: displayedToughness - baseToughness - armor,
      armor,
    }],
    importWarnings,
  }
}

export function validateCharacterImport(raw: unknown): Character {
  if (!isObject(raw)) {
    throw new Error('validation.import.notAnObject')
  }

  const requiredStrings: (keyof Character)[] = [
    'callsign', 'name', 'rank', 'role', 'fileNo', 'portraitUrl', 'sheetTitle',
    'bennies', 'wounds', 'fatigue', 'mana', 'notes',
  ]

  for (const key of requiredStrings) {
    if (!isString(raw[key])) {
      throw new Error(`validation.import.missingStringField:${key}`)
    }
  }

  const hasModifierSources = raw.combatModifiers !== undefined
  if (!hasModifierSources) {
    for (const key of ['pace', 'parry', 'toughness'] as const) {
      if (!isString(raw[key])) {
        throw new Error(`validation.import.missingStringField:${key}`)
      }
    }
  } else if (!isArray(raw.combatModifiers)) {
    throw new Error('validation.import.combatModifiersNotArray')
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
    return { ...s, skillKey: migrateSkillKey(s), linkedAttribute: migrateLinkedAttribute(s.linkedAttribute), isStarter: !!s.isStarter }
  })

  const COLUMN_SIDES: ColumnSide[] = ['left', 'right']
  const LAYOUT_KEYS: (keyof CharacterLayout)[] = ['weapons', 'edges', 'hindrances', 'gear', 'specialRules', 'powers']

  let layout: CharacterLayout = { ...DEFAULT_LAYOUT }
  if (isObject(raw.layout)) {
    const partial: Partial<CharacterLayout> = {}
    for (const key of LAYOUT_KEYS) {
      const val = (raw.layout as Record<string, unknown>)[key]
      partial[key] = COLUMN_SIDES.includes(val as ColumnSide) ? (val as ColumnSide) : DEFAULT_LAYOUT[key]
    }
    layout = partial as CharacterLayout
  }

  const powers: CharacterPower[] = isArray(raw.powers)
    ? (raw.powers as unknown[]).flatMap((p): CharacterPower[] => {
        if (!isObject(p)) return []
        const modifiers: PowerModifier[] = isArray(p.modifiers)
          ? (p.modifiers as unknown[]).flatMap((m): PowerModifier[] => {
              if (!isObject(m)) return []
              return [{
                id: isString(m.id) ? m.id : crypto.randomUUID(),
                name: isString(m.name) ? m.name : '',
                ppCost: isString(m.ppCost) ? m.ppCost : '',
              }]
            })
          : []
        return [{
          id: isString(p.id) ? p.id : crypto.randomUUID(),
          name: isString(p.name) ? p.name : '',
          ppCost: isString(p.ppCost) ? p.ppCost : '',
          range: isString(p.range) ? p.range : '',
          duration: isString(p.duration) ? p.duration : '',
          description: isString(p.description) ? p.description : '',
          modifiers,
        }]
      })
    : []

  const normalizedSkills = skills as Character['skills']
  const legacyCombat = migrateLegacyCombatModifiers(raw, normalizedSkills)

  return {
    ...(raw as unknown as Character),
    hindrances: hindrances as Character['hindrances'],
    skills: normalizedSkills,
    layout,
    powers,
    pace: isString(raw.pace) ? raw.pace : '',
    parry: isString(raw.parry) ? raw.parry : '',
    toughness: isString(raw.toughness) ? raw.toughness : '',
    armor: isString(raw.armor) ? raw.armor : '',
    worldId: isString(raw.worldId) ? raw.worldId : undefined,
    raceId: isString(raw.raceId) ? raw.raceId : undefined,
    raceName: isString(raw.raceName) ? raw.raceName : undefined,
    size: typeof raw.size === 'number' ? raw.size : 0,
    ...legacyCombat,
    importWarnings: legacyCombat.importWarnings,
  }
}
