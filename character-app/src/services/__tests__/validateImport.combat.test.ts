import { describe, expect, it } from 'vitest'
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

describe('validateCharacterImport - combat fields backward compatibility', () => {
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
})
