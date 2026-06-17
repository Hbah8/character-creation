import { describe, it, expect } from 'vitest'
import { validateCharacterImport } from '../validateImport'

// Minimal valid character without powers (legacy JSON shape)
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

describe('validateCharacterImport — powers backward compatibility', () => {
  it('defaults powers to [] when field is absent (legacy JSON)', () => {
    const result = validateCharacterImport({ ...BASE })
    expect(result.powers).toEqual([])
  })

  it('defaults powers to [] when field is null', () => {
    const result = validateCharacterImport({ ...BASE, powers: null })
    expect(result.powers).toEqual([])
  })

  it('defaults powers to [] when field is not an array', () => {
    const result = validateCharacterImport({ ...BASE, powers: 'invalid' })
    expect(result.powers).toEqual([])
  })

  it('preserves a valid powers array', () => {
    const powers = [
      {
        id: 'p1',
        name: 'Рассеивание',
        ppCost: '3',
        range: 'Смекалка×2',
        duration: 'Мгновенно',
        description: 'Нейтрализует активную силу.',
        modifiers: [
          { id: 'm1', name: 'Мультирассеивание', ppCost: '+3' },
        ],
      },
    ]
    const result = validateCharacterImport({ ...BASE, powers })
    expect(result.powers).toHaveLength(1)
    expect(result.powers[0].name).toBe('Рассеивание')
    expect(result.powers[0].ppCost).toBe('3')
    expect(result.powers[0].modifiers).toHaveLength(1)
    expect(result.powers[0].modifiers[0].name).toBe('Мультирассеивание')
  })

  it('defaults missing string fields in a power to empty string', () => {
    const powers = [{ id: 'p1', name: 'Bolt' }]
    const result = validateCharacterImport({ ...BASE, powers })
    expect(result.powers[0].ppCost).toBe('')
    expect(result.powers[0].range).toBe('')
    expect(result.powers[0].duration).toBe('')
    expect(result.powers[0].description).toBe('')
    expect(result.powers[0].modifiers).toEqual([])
  })

  it('drops malformed modifier entries and preserves valid ones', () => {
    const powers = [
      {
        id: 'p1',
        name: 'Bolt',
        ppCost: '1',
        range: '12',
        duration: '1',
        description: '',
        modifiers: [
          null,
          { id: 'm1', name: 'Бронебойность', ppCost: '+1' },
          'not-an-object',
        ],
      },
    ]
    const result = validateCharacterImport({ ...BASE, powers })
    expect(result.powers[0].modifiers).toHaveLength(1)
    expect(result.powers[0].modifiers[0].name).toBe('Бронебойность')
  })

  it('defaults layout.powers to right when absent', () => {
    const result = validateCharacterImport({ ...BASE })
    expect(result.layout?.powers).toBe('right')
  })

  it('preserves layout.powers: left when provided', () => {
    const result = validateCharacterImport({ ...BASE, layout: { powers: 'left' } })
    expect(result.layout?.powers).toBe('left')
  })
})
