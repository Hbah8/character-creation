import { describe, it, expect } from 'vitest'
import { resolveCharacter } from '@/services/resolveEffectiveCharacter'
import type { Character } from '@/types/character'
import type { World } from '@/world/types'
import { WORLD_SCHEMA_VERSION } from '@/world/types'
import { formatToughness } from '@/utils/toughnessUtils'

const BASE_CHARACTER: Character = {
  sheetTitle: 'Test',
  callsign: 'ACE',
  name: 'Test Name',
  rank: 'Novice',
  role: 'Fighter',
  fileNo: 'TST-001',
  portraitUrl: '',
  agility: 'd6',
  strength: 'd6',
  smarts: 'd6',
  spirit: 'd6',
  vigor: 'd6',
  pace: '6',
  parry: '5',
  toughness: '5',
  armor: '0',
  bennies: '3',
  wounds: '0',
  fatigue: '0',
  mana: '0',
  notes: '',
  skills: [{ id: 'fighting', name: 'Fighting', die: 'd6', linkedAttribute: 'agility' }],
  edges: [],
  hindrances: [],
  weapons: [],
  gear: [],
  specialRules: [],
  powers: [],
  size: 0,
  worldId: 'world-1',
}

function makeWorld(overrides: Partial<World> = {}): World {
  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    name: 'Test World',
    summary: '',
    settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
    races: [],
    entities: [],
    relationships: [],
    worldHandbook: [],
    ...overrides,
  }
}

function resolveEffectiveCharacter(character: Character, world: World | null): Character {
  const resolved = resolveCharacter(character, world)
  return {
    ...resolved.source,
    ...resolved.attributes,
    pace: String(resolved.combat.pace),
    parry: String(resolved.combat.parry),
    toughness: formatToughness(resolved.combat.toughness, resolved.combat.armor),
    armor: String(resolved.combat.armor),
    size: resolved.combat.size,
  }
}

describe('resolveEffectiveCharacter', () => {
  it('separates source data, effective attributes, and resolved combat values', () => {
    const character = {
      ...BASE_CHARACTER,
      combatModifiers: [{ id: 'fast-runner', source: 'manual' as const, name: 'Fast runner', runningDieSteps: 1 }],
    }

    const result = resolveCharacter(character, null)

    expect(result.source).toBe(character)
    expect(result.attributes).toEqual({
      agility: 'd6', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6',
    })
    expect(result.combat).toEqual({
      pace: 6,
      parry: 5,
      toughness: 5,
      armor: 0,
      runningDie: 'd8',
      size: 0,
    })
  })

  it('derives core combat statistics from Fighting and Vigor instead of stored totals', () => {
    const char = {
      ...BASE_CHARACTER,
      pace: '99',
      parry: '99',
      toughness: '99 (99)',
      armor: '3',
      vigor: 'd8' as const,
      skills: [{ id: 'fighting', name: 'Fighting', die: 'd8' as const, linkedAttribute: 'agility' as const }],
      combatModifiers: [{ id: 'legacy-armor', source: 'manual' as const, name: 'Armor', armor: 3 }],
    }

    const result = resolveEffectiveCharacter(char, null)

    expect(result.pace).toBe('6')
    expect(result.parry).toBe('6')
    expect(result.toughness).toBe('9 (3)')
  })

  it('applies named equipment and manual combat modifiers after deriving base statistics', () => {
    const char = {
      ...BASE_CHARACTER,
      armor: '99',
      combatModifiers: [
        { id: 'staff-two-hands', source: 'equipment', name: 'Staff held in two hands', parry: 1 },
        { id: 'campaign-pace', source: 'manual', name: 'Campaign pace', pace: 1 },
        { id: 'natural-armor', source: 'manual', name: 'Natural armor', armor: 2 },
        { id: 'hardy', source: 'manual', name: 'Hardy', toughness: 1 },
      ] satisfies Character['combatModifiers'],
    }

    const result = resolveEffectiveCharacter(char, null)

    expect(result.pace).toBe('7')
    expect(result.parry).toBe('6')
    expect(result.toughness).toBe('8 (2)')
  })

  it('derives combat statistics when world is null', () => {
    const char = { ...BASE_CHARACTER, raceId: 'elf' }
    const result = resolveEffectiveCharacter(char, null)
    expect(result).toMatchObject({ pace: '6', parry: '5', toughness: '5' })
  })

  it('derives combat statistics when no raceId', () => {
    const world = makeWorld({ races: [{ id: 'elf', name: 'Elf', description: '', abilities: [], size: 1 }] })
    const char = { ...BASE_CHARACTER, raceId: undefined }
    const result = resolveEffectiveCharacter(char, world)
    expect(result).toMatchObject({ pace: '6', parry: '5', toughness: '5' })
  })

  it('derives combat statistics when raceId is not found in world', () => {
    const world = makeWorld({ races: [{ id: 'elf', name: 'Elf', description: '', abilities: [], size: 1 }] })
    const char = { ...BASE_CHARACTER, raceId: 'dwarf' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result).toMatchObject({ pace: '6', parry: '5', toughness: '5' })
  })

  it('returns base character unchanged when race has no ability modifiers', () => {
    const world = makeWorld({ races: [{ id: 'human', name: 'Human', description: '', abilities: [], size: 0 }] })
    const char = { ...BASE_CHARACTER, raceId: 'human' }
    const result = resolveEffectiveCharacter(char, world)
    // size 0 + size 0 = 0; no modifiers → effectively identity
    expect(result.pace).toBe('6')
    expect(result.parry).toBe('5')
    expect(result.toughness).toBe('5')
  })

  it('applies pace bonus from pace ability', () => {
    const world = makeWorld({
      races: [{
        id: 'fast', name: 'Fast Race', description: '',
        abilities: [{ id: 'pace', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'fast', pace: '6' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.pace).toBe('8')
  })

  it('applies parry bonus from parry ability', () => {
    const world = makeWorld({
      races: [{
        id: 'agile', name: 'Agile', description: '',
        abilities: [{ id: 'parry', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'agile', parry: '5' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.parry).toBe('6')
  })

  it('applies parry penalty from weak-parry ability', () => {
    const world = makeWorld({
      races: [{
        id: 'clumsy', name: 'Clumsy', description: '',
        abilities: [{ id: 'weak-parry', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'clumsy', parry: '5' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.parry).toBe('4')
  })

  it('applies toughness bonus from tough ability', () => {
    const world = makeWorld({
      races: [{
        id: 'hardy', name: 'Hardy', description: '',
        abilities: [{ id: 'tough', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'hardy', toughness: '5' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.toughness).toBe('6')
  })

  it('applies armor bonus from armor ability — adds to total and parentheses', () => {
    const world = makeWorld({
      races: [{
        id: 'armored', name: 'Armored', description: '',
        abilities: [{ id: 'armor', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'armored', toughness: '5' }
    const result = resolveEffectiveCharacter(char, world)
    // base 5, armor +2 → total 7, armor 2 → "7 (2)"
    expect(result.toughness).toBe('7 (2)')
  })

  it('stacks stored armor with racial armor', () => {
    const world = makeWorld({
      races: [{
        id: 'armored', name: 'Armored', description: '',
        abilities: [{ id: 'armor', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = {
      ...BASE_CHARACTER,
      raceId: 'armored',
      combatModifiers: [{ id: 'worn-armor', source: 'equipment' as const, name: 'Worn armor', armor: 2 }],
    }
    const result = resolveEffectiveCharacter(char, world)
    // Vigor d6 gives 5 base Toughness; armor 2 + racial armor 2 gives 9 (4).
    expect(result.toughness).toBe('9 (4)')
  })

  it('derives Toughness when legacy toughness is unparseable', () => {
    const world = makeWorld({
      races: [{
        id: 'armored', name: 'Armored', description: '',
        abilities: [{ id: 'armor', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'armored', toughness: 'unknown' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.toughness).toBe('7 (2)')
  })

  it('computes effective size as character.size plus stored race.size', () => {
    const world = makeWorld({
      races: [{
        id: 'big',
        name: 'Big',
        description: '',
        abilities: [{ id: 'size-plus-1', repeatCount: 2 }],
        size: 2,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'big', size: 1 }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.size).toBe(3)
    expect(result.toughness).toBe('8')
  })

  it('uses stored race.size when size abilities are absent', () => {
    const world = makeWorld({
      races: [{ id: 'stale-big', name: 'Stale Big', description: '', abilities: [], size: 2 }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'stale-big', size: 0 }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.size).toBe(2)
    expect(result.toughness).toBe('7')
  })

  it('does not resolve size ability references a second time', () => {
    const world = makeWorld({
      races: [{
        id: 'big', name: 'Big', description: '',
        abilities: [{ id: 'size-plus-1', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'big', toughness: '5', size: 0 }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.size).toBe(0)
    expect(result.toughness).toBe('5')
  })

  it('advances attribute die for attribute-bonus', () => {
    const world = makeWorld({
      races: [{
        id: 'nimble', name: 'Nimble', description: '',
        abilities: [{ id: 'attribute-bonus', repeatCount: 1, parameters: { attributeId: 'agility' } }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'nimble', agility: 'd6' as const }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.agility).toBe('d8')
  })

  it('derives Toughness after applying a racial Vigor die increase', () => {
    const world = makeWorld({
      races: [{
        id: 'hardy', name: 'Hardy', description: '', size: 0,
        abilities: [{ id: 'attribute-bonus', repeatCount: 1, parameters: { attributeId: 'vigor' } }],
      }],
    })
    const result = resolveEffectiveCharacter({ ...BASE_CHARACTER, raceId: 'hardy', vigor: 'd6' }, world)

    expect(result.vigor).toBe('d8')
    expect(result.toughness).toBe('6')
  })

  it('advances attribute die past d12 to d12+1', () => {
    const world = makeWorld({
      races: [{
        id: 'godlike', name: 'Godlike', description: '',
        abilities: [{ id: 'attribute-bonus', repeatCount: 1, parameters: { attributeId: 'strength' } }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'godlike', strength: 'd12' as const }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.strength).toBe('d12+1')
  })

  it('does not mutate the original character', () => {
    const world = makeWorld({
      races: [{
        id: 'fast', name: 'Fast', description: '',
        abilities: [{ id: 'pace', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'fast', pace: '6' }
    resolveEffectiveCharacter(char, world)
    expect(char.pace).toBe('6')
  })

  it('leaves pace unchanged when race has no pace ability', () => {
    const world = makeWorld({
      races: [{ id: 'normal', name: 'Normal', description: '', abilities: [], size: 0 }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'normal', pace: '6' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.pace).toBe('6')
  })

  it('derives Pace when legacy pace is not a number', () => {
    const world = makeWorld({
      races: [{
        id: 'fast', name: 'Fast', description: '',
        abilities: [{ id: 'pace', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'fast', pace: 'unknown' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.pace).toBe('8')
  })
})
