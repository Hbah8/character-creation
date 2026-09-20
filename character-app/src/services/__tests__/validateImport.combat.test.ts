import { describe, expect, it } from 'vitest'
import { validateCharacterImport } from '../validateImport'
import type { CombatModifier } from '@/types/character'

const BASE = {
  sheetTitle: 'Test Sheet',
  callsign: 'ALPHA',
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
  mana: '10',
  notes: '',
  skills: [],
  edges: [],
  hindrances: [],
  weapons: [],
  gear: [],
  specialRules: [],
}

describe('validateCharacterImport - combat fields backward compatibility', () => {
  it('excludes racial effects from Character combat modifier source types', () => {
    // @ts-expect-error Racial effects are derived exclusively from the selected race catalog.
    const prohibitedSource: CombatModifier['source'] = 'racial'
    expect(prohibitedSource).toBe('racial')
  })

  it('defaults armor to an empty string when field is absent', () => {
    const result = validateCharacterImport({ ...BASE })
    expect(result.armor).toBe('')
  })

  it('preserves armor when it is a string', () => {
    const result = validateCharacterImport({ ...BASE, armor: '2' })
    expect(result.armor).toBe('2')
  })

  it('drops armor when it is not a string', () => {
    const result = validateCharacterImport({ ...BASE, armor: 2 })
    expect(result.armor).toBe('')
  })

  it('migrates legacy displayed combat values into manual modifiers', () => {
    const result = validateCharacterImport({
      ...BASE,
      pace: '8',
      parry: '6',
      toughness: '9 (2)',
      armor: '2',
      skills: [{ id: 'legacy-fighting', name: 'Fighting', die: 'd6', linkedAttribute: 'agility' }],
    })

    expect(result.skills[0]?.skillKey).toBe('fighting')
    expect(result.combatModifiers).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'manual', pace: 2, parry: 1, toughness: 2, armor: 2 }),
    ]))
  })

  it('retains a warning instead of double-counting conflicting legacy armor', () => {
    const result = validateCharacterImport({ ...BASE, toughness: '7 (2)', armor: '4' })

    expect(result.combatModifiers).toEqual(expect.arrayContaining([
      expect.objectContaining({ armor: 2 }),
    ]))
    expect(result.importWarnings).toContain('validation.import.legacyArmorConflict')
  })

  it('does not preserve unvalidated import warnings from a source-only payload', () => {
    const result = validateCharacterImport({
      ...BASE,
      combatModifiers: [],
      importWarnings: ['untrusted-warning'],
    })

    expect(result.importWarnings).toBeUndefined()
  })

  it('drops imported racial modifier records because race effects are resolved from the selected race', () => {
    const result = validateCharacterImport({
      ...BASE,
      combatModifiers: [
        { id: 'race-parry', source: 'racial', name: 'Race Parry', parry: 1 },
        { id: 'staff', source: 'equipment', name: 'Staff', parry: 1 },
      ],
    })

    expect(result.combatModifiers).toEqual([
      expect.objectContaining({ id: 'staff', source: 'equipment', parry: 1 }),
    ])
  })
})
