import { describe, expect, it } from 'vitest'
import { resolveEffectiveCharacter } from '@/services/resolveEffectiveCharacter'
import { validateCharacterImport } from '@/services/validateImport'
import type { Character } from '@/types/character'
import type { World } from '@/world/types'
import { WORLD_SCHEMA_VERSION } from '@/world/types'

function makeWorld(overrides: Partial<World> = {}): World {
  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    name: 'Mock World',
    summary: '',
    settingRules: {
      skillPointsBudget: 12,
      attributePointsBudget: 5,
      racePointsBudget: 2,
    },
    races: [],
    entities: [],
    relationships: [],
    worldHandbook: [],
    ...overrides,
  }
}

function createCharacter(overrides: Partial<Character> = {}): Character {
  return {
    sheetTitle: 'Character Sheet',
    callsign: 'MOCK',
    name: 'Mock Character',
    rank: 'Novice',
    role: 'Explorer',
    fileNo: 'MCK-001',
    portraitUrl: '',
    agility: 'd10',
    strength: 'd12',
    smarts: 'd8',
    spirit: 'd6',
    vigor: 'd6',
    pace: '6',
    parry: '5',
    toughness: '8 (2)',
    armor: '',
    bennies: '3',
    wounds: '0',
    fatigue: '0',
    mana: '-',
    skills: [],
    edges: [],
    hindrances: [],
    weapons: [],
    gear: [],
    specialRules: [],
    powers: [],
    notes: '',
    worldId: 'mock-world',
    size: 0,
    ...overrides,
  }
}

describe('race effective character flow', () => {
  it('creates a character in a mock world and applies a race with multiple numeric parameters', () => {
    const world = makeWorld({
      races: [{
        id: 'giant-kin',
        name: 'Giant Kin',
        description: 'Mock race with several numeric effects.',
        size: 0,
        abilities: [
          { id: 'size-plus-1', repeatCount: 2 },
          { id: 'pace', repeatCount: 1 },
          { id: 'parry', repeatCount: 2 },
          { id: 'weak-parry', repeatCount: 1 },
          { id: 'armor', repeatCount: 1 },
          { id: 'tough', repeatCount: 2 },
          { id: 'fragile', repeatCount: 1 },
          { id: 'attribute-bonus', repeatCount: 2, parameters: { attributeId: 'agility' } },
          { id: 'attribute-bonus', repeatCount: 1, parameters: { attributeId: 'strength' } },
          { id: 'attribute-penalty', repeatCount: 1, parameters: { attributeId: 'smarts', costTier: -3 } },
          { id: 'skill-bonus', repeatCount: 1, parameters: { skillId: 'notice', costTier: 2 } },
        ],
      }],
    })

    const character = createCharacter({ raceId: 'giant-kin', raceName: 'Giant Kin' })
    const effective = resolveEffectiveCharacter(character, world)

    expect(effective.size).toBe(2)
    expect(effective.pace).toBe('8')
    expect(effective.parry).toBe('6')
    expect(effective.toughness).toBe('13 (4)')
    expect(effective.agility).toBe('d12+1')
    expect(effective.strength).toBe('d12+1')
    expect(effective.smarts).toBe('d4')

    expect(character.size).toBe(0)
    expect(character.pace).toBe('6')
    expect(character.parry).toBe('5')
    expect(character.toughness).toBe('8 (2)')
    expect(character.agility).toBe('d10')
    expect(character.strength).toBe('d12')
    expect(character.smarts).toBe('d8')
  })

  it('keeps legacy character JSON compatible when race and size fields are absent', () => {
    const legacyRaw = createCharacter()
    delete legacyRaw.raceId
    delete legacyRaw.raceName
    delete legacyRaw.size

    const imported = validateCharacterImport(legacyRaw)

    expect(imported.raceId).toBeUndefined()
    expect(imported.raceName).toBeUndefined()
    expect(imported.size).toBe(0)
    expect(resolveEffectiveCharacter(imported, makeWorld())).toBe(imported)
  })
})
