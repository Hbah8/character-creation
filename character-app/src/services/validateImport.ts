import type { Character, HindranceSeverity, CharacterLayout, ColumnSide, CharacterPower, PowerModifier, CombatModifier, CombatModifierSource, Skill } from '@/types/character'
import { DEFAULT_CHARACTER_RESOURCE_LIMITS, DEFAULT_LAYOUT } from '@/types/character'
import { parseToughness } from '@/utils/toughnessUtils'
import { resolveSkillDefinitions } from '@/handbooks/services/resolveCharacterSkills'
import { resolveEdgeDefinitions } from '@/handbooks/services/resolveCharacterEdges'
import type { StoredHandbookEntry } from '@/types/handbook'
import type { Rank } from '@/types/handbook'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const COMBAT_MODIFIER_SOURCES: CombatModifierSource[] = ['edge', 'hindrance', 'equipment', 'manual']
const ARCANE_BACKGROUNDS = ['Magic', 'Miracles', 'Psionics', 'SuperPowers', 'WeirdScience'] as const
const RANKS: Rank[] = ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary']
const LEGACY_SYSTEM_SKILL_KEYS_BY_NAME: Readonly<Record<string, string>> = {
  athletics: 'athletics',
  'common knowledge': 'common-knowledge',
  driving: 'driving',
  fighting: 'fighting',
  focus: 'focus',
  healing: 'healing',
  intimidation: 'intimidation',
  notice: 'notice',
  occult: 'occult',
  performance: 'performance',
  persuasion: 'persuasion',
  piloting: 'piloting',
  repair: 'repair',
  research: 'research',
  riding: 'riding',
  science: 'science',
  shooting: 'shooting',
  stealth: 'stealth',
  survival: 'survival',
  taunt: 'taunt',
  thievery: 'thievery',
}

// TODO: remove shim once all exported JSONs have been migrated
function migrateSeverity(value: unknown): HindranceSeverity {
  if (value === 'М') return 'minor'
  if (value === 'К') return 'major'
  if (value === 'minor' || value === 'major') return value
  return 'minor'
}

function normalizeSkill(raw: unknown, worldHandbook: readonly StoredHandbookEntry[]): Skill {
  if (!isObject(raw) || !isString(raw.id) || !isString(raw.die)) {
    throw new Error('validation.import.invalidSkill')
  }
  const definitions = resolveSkillDefinitions(worldHandbook)
  const skillKeysByName = new Map([
    ...definitions.map(skill => [skill.name.toLocaleLowerCase(), skill.id] as const),
    ...Object.entries(LEGACY_SYSTEM_SKILL_KEYS_BY_NAME),
  ])
  const skillKey = isString(raw.skillKey)
    ? raw.skillKey
    : isString(raw.name)
      ? skillKeysByName.get(raw.name.toLocaleLowerCase())
      : undefined
  if (!skillKey || !definitions.some(skill => skill.id === skillKey)) {
    const identifier = isString(raw.skillKey) ? raw.skillKey : isString(raw.name) ? raw.name : raw.id
    throw new Error(`validation.import.unknownSkill:${identifier}`)
  }
  return { id: raw.id, skillKey, die: raw.die as Skill['die'] }
}

function normalizeEdge(raw: unknown, worldHandbook: readonly StoredHandbookEntry[]): Character['edges'][number] {
  if (!isObject(raw) || !isString(raw.id) || !isString(raw.edgeId) || Object.keys(raw).some(key => key !== 'id' && key !== 'edgeId')) {
    throw new Error('validation.import.invalidEdge')
  }
  if (!resolveEdgeDefinitions(worldHandbook).some(edge => edge.id === raw.edgeId)) {
    throw new Error(`validation.import.unknownEdge:${raw.edgeId}`)
  }
  return { id: raw.id, edgeId: raw.edgeId }
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
      bennies: numberOrZero(item.bennies),
      maxWounds: numberOrZero(item.maxWounds),
      maxFatigue: numberOrZero(item.maxFatigue),
      powerPoints: numberOrZero(item.powerPoints),
    }]
  })
}

function legacyMaximum(value: unknown, defaultValue: number): number {
  if (!isString(value)) return defaultValue
  const match = /\/\s*(\d+)/.exec(value)
  return match ? Number(match[1]) : defaultValue
}

function migrateLegacyResourceModifier(raw: Record<string, unknown>): CombatModifier | undefined {
  const bennies = Number.parseInt(String(raw.bennies), 10)
  const powerPoints = Number.parseInt(String(raw.mana), 10)
  const modifier = {
    bennies: Number.isFinite(bennies) ? bennies - DEFAULT_CHARACTER_RESOURCE_LIMITS.bennies : 0,
    maxWounds: legacyMaximum(raw.wounds, DEFAULT_CHARACTER_RESOURCE_LIMITS.maxWounds) - DEFAULT_CHARACTER_RESOURCE_LIMITS.maxWounds,
    maxFatigue: legacyMaximum(raw.fatigue, DEFAULT_CHARACTER_RESOURCE_LIMITS.maxFatigue) - DEFAULT_CHARACTER_RESOURCE_LIMITS.maxFatigue,
    powerPoints: Number.isFinite(powerPoints) ? powerPoints - DEFAULT_CHARACTER_RESOURCE_LIMITS.powerPoints : 0,
  }
  if (!Object.values(modifier).some(value => value !== 0)) return undefined
  return {
    id: 'legacy-resource-values',
    source: 'manual',
    name: 'Legacy resource values',
    ...modifier,
  }
}

function migrateLegacyCombatModifiers(raw: Record<string, unknown>, skills: Character['skills']): Pick<Character, 'combatModifiers' | 'importWarnings'> {
  const existing = validateCombatModifiers(raw.combatModifiers)
  const resourceModifier = migrateLegacyResourceModifier(raw)
  if (existing) {
    return { combatModifiers: resourceModifier ? [...existing, resourceModifier] : existing }
  }

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
    combatModifiers: [
      {
        id: 'legacy-combat-values',
        source: 'manual',
        name: 'Legacy combat values',
        pace: Number.isFinite(pace) ? pace - basePace : 0,
        parry: Number.isFinite(parry) ? parry - baseParry : 0,
        toughness: displayedToughness - baseToughness - armor,
        armor,
      },
      ...(resourceModifier ? [resourceModifier] : []),
    ],
    importWarnings,
  }
}

export function validateCharacterImport(raw: unknown, worldHandbook: readonly StoredHandbookEntry[] = []): Character {
  if (!isObject(raw)) {
    throw new Error('validation.import.notAnObject')
  }

  const requiredStrings: (keyof Character)[] = [
    'callsign', 'name', 'rank', 'role', 'fileNo', 'portraitUrl', 'sheetTitle',
    'notes',
  ]

  for (const key of requiredStrings) {
    if (!isString(raw[key])) {
      throw new Error(`validation.import.missingStringField:${key}`)
    }
  }

  if (!RANKS.includes(raw.rank as Rank)) {
    throw new Error('validation.import.invalidRank')
  }

  if (typeof raw.isWildCard !== 'boolean') {
    throw new Error('validation.import.missingBooleanField:isWildCard')
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

  // Migrate hindrance severity and legacy display-name skills to strict catalog references.
  const hindrances = (raw.hindrances as unknown[]).map((h) => {
    if (!isObject(h)) return h
    return { ...h, severity: migrateSeverity(h.severity) }
  })

  const skills = (raw.skills as unknown[]).map(skill => normalizeSkill(skill, worldHandbook))
  const edges = (raw.edges as unknown[]).map(edge => normalizeEdge(edge, worldHandbook))
  const arcaneBackground = raw.arcaneBackground === undefined
    ? undefined
    : ARCANE_BACKGROUNDS.includes(raw.arcaneBackground as typeof ARCANE_BACKGROUNDS[number])
      ? raw.arcaneBackground as Character['arcaneBackground']
      : (() => { throw new Error('validation.import.invalidArcaneBackground') })()
  if (arcaneBackground !== undefined && !edges.some(edge => edge.edgeId === 'misticheskiy-dar')) {
    throw new Error('validation.import.arcaneBackgroundWithoutMysticGift')
  }

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

  const normalizedSkills = skills
  const legacyCombat = migrateLegacyCombatModifiers(raw, normalizedSkills)
  const { bennies: _bennies, wounds: _wounds, fatigue: _fatigue, mana: _mana, ...source } = raw

  return {
    ...(source as unknown as Character),
    hindrances: hindrances as Character['hindrances'],
    skills: normalizedSkills,
    edges,
    isWildCard: raw.isWildCard,
    arcaneBackground,
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
