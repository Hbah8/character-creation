import { describe, it, expect } from 'vitest'
import { validateCharacterImport } from '../validateImport'

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

describe('validateCharacterImport — race fields backward compatibility', () => {
  it('defaults raceId to undefined when field is absent (legacy JSON)', () => {
    const result = validateCharacterImport({ ...BASE })
    expect(result.raceId).toBeUndefined()
  })

  it('defaults raceName to undefined when field is absent (legacy JSON)', () => {
    const result = validateCharacterImport({ ...BASE })
    expect(result.raceName).toBeUndefined()
  })

  it('defaults size to 0 when field is absent (legacy JSON)', () => {
    const result = validateCharacterImport({ ...BASE })
    expect(result.size).toBe(0)
  })

  it('preserves raceId when it is a valid string', () => {
    const result = validateCharacterImport({ ...BASE, raceId: 'race-123' })
    expect(result.raceId).toBe('race-123')
  })

  it('preserves raceName when it is a valid string', () => {
    const result = validateCharacterImport({ ...BASE, raceName: 'Elf' })
    expect(result.raceName).toBe('Elf')
  })

  it('preserves size when it is a valid number', () => {
    const result = validateCharacterImport({ ...BASE, size: 2 })
    expect(result.size).toBe(2)
  })

  it('drops raceId when it is not a string', () => {
    const result = validateCharacterImport({ ...BASE, raceId: 42 })
    expect(result.raceId).toBeUndefined()
  })

  it('drops raceName when it is not a string', () => {
    const result = validateCharacterImport({ ...BASE, raceName: true })
    expect(result.raceName).toBeUndefined()
  })

  it('defaults size to 0 when it is not a number', () => {
    const result = validateCharacterImport({ ...BASE, size: 'big' })
    expect(result.size).toBe(0)
  })

  it('preserves size of 0 (valid zero value, not a falsy drop)', () => {
    const result = validateCharacterImport({ ...BASE, size: 0 })
    expect(result.size).toBe(0)
  })

  it('preserves negative size (e.g. small creature)', () => {
    const result = validateCharacterImport({ ...BASE, size: -2 })
    expect(result.size).toBe(-2)
  })
})
