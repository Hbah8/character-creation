import { describe, it, expect } from 'vitest'
import { resolveEffectiveCharacter } from '@/services/resolveEffectiveCharacter'
import type { Character } from '@/types/character'
import type { World } from '@/world/types'
import { WORLD_SCHEMA_VERSION } from '@/world/types'

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
  bennies: '3',
  wounds: '0',
  fatigue: '0',
  mana: '0',
  notes: '',
  skills: [],
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

describe('resolveEffectiveCharacter', () => {
  it('returns base character unchanged when world is null', () => {
    const char = { ...BASE_CHARACTER, raceId: 'elf' }
    const result = resolveEffectiveCharacter(char, null)
    expect(result).toBe(char)
  })

  it('returns base character unchanged when no raceId', () => {
    const world = makeWorld({ races: [{ id: 'elf', name: 'Elf', description: '', abilities: [], size: 1 }] })
    const char = { ...BASE_CHARACTER, raceId: undefined }
    const result = resolveEffectiveCharacter(char, world)
    expect(result).toBe(char)
  })

  it('returns base character unchanged when raceId not found in world', () => {
    const world = makeWorld({ races: [{ id: 'elf', name: 'Elf', description: '', abilities: [], size: 1 }] })
    const char = { ...BASE_CHARACTER, raceId: 'dwarf' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result).toBe(char)
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

  it('preserves existing armor in parentheses when adding racial armor', () => {
    const world = makeWorld({
      races: [{
        id: 'armored', name: 'Armored', description: '',
        abilities: [{ id: 'armor', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'armored', toughness: '8 (2)' }
    const result = resolveEffectiveCharacter(char, world)
    // base 8, armor 2; racial armor +2 → total 10, armor 4 → "10 (4)"
    expect(result.toughness).toBe('10 (4)')
  })

  it('leaves unparseable toughness untouched when armor/tough bonus applied', () => {
    const world = makeWorld({
      races: [{
        id: 'armored', name: 'Armored', description: '',
        abilities: [{ id: 'armor', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'armored', toughness: 'unknown' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.toughness).toBe('unknown')
  })

  it('computes effective size as character.size + size derived from racial abilities', () => {
    const world = makeWorld({
      races: [{
        id: 'big',
        name: 'Big',
        description: '',
        abilities: [{ id: 'size-plus-1', repeatCount: 2 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'big', size: 1 }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.size).toBe(3)
    expect(result.toughness).toBe('8')
  })

  it('ignores stored race.size when size abilities are absent', () => {
    const world = makeWorld({
      races: [{ id: 'stale-big', name: 'Stale Big', description: '', abilities: [], size: 2 }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'stale-big', size: 0 }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.size).toBe(0)
    expect(result.toughness).toBe('5')
  })

  it('applies size bonus to toughness total (not to armor parentheses)', () => {
    const world = makeWorld({
      races: [{
        id: 'big', name: 'Big', description: '',
        abilities: [{ id: 'size-plus-1', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'big', toughness: '5', size: 0 }
    const result = resolveEffectiveCharacter(char, world)
    // size-plus-1 is excluded from the generic modifier bag and applied once as effective size.
    expect(result.size).toBe(1)
    expect(result.toughness).toBe('6')
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

  it('leaves pace unchanged when pace string is not a number', () => {
    const world = makeWorld({
      races: [{
        id: 'fast', name: 'Fast', description: '',
        abilities: [{ id: 'pace', repeatCount: 1 }],
        size: 0,
      }],
    })
    const char = { ...BASE_CHARACTER, raceId: 'fast', pace: 'unknown' }
    const result = resolveEffectiveCharacter(char, world)
    expect(result.pace).toBe('unknown')
  })
})
