import { describe, expect, it } from 'vitest'
import { createCharacterExportPayload } from '@/services/exportService'
import { validateCharacterImport } from '@/services/validateImport'
import type { Character } from '@/types/character'

const character: Character = {
  sheetTitle: '', callsign: 'Scout', name: 'Scout', rank: 'Novice', role: '', fileNo: '', portraitUrl: '',
  isWildCard: false,
  agility: 'd6', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6',
  pace: '8', parry: '5', toughness: '7 (2)', armor: '2',
  combatModifiers: [{ id: 'worn-armor', source: 'equipment', name: 'Worn armor', armor: 2 }],
  importWarnings: ['validation.import.legacyArmorConflict'],
  bennies: '3', wounds: '0', fatigue: '0', mana: '0',
  skills: [], edges: [], hindrances: [], weapons: [], gear: [], specialRules: [], powers: [], notes: '',
}

describe('createCharacterExportPayload', () => {
  it('serializes combat sources and excludes derived, legacy, and import-only fields', () => {
    const payload = createCharacterExportPayload(character)

    expect(payload).toMatchObject({ combatModifiers: character.combatModifiers })
    expect(payload).not.toHaveProperty('pace')
    expect(payload).not.toHaveProperty('parry')
    expect(payload).not.toHaveProperty('toughness')
    expect(payload).not.toHaveProperty('armor')
    expect(payload).not.toHaveProperty('bennies')
    expect(payload).not.toHaveProperty('wounds')
    expect(payload).not.toHaveProperty('fatigue')
    expect(payload).not.toHaveProperty('mana')
    expect(payload).not.toHaveProperty('importWarnings')
  })

  it('preserves a handbook weapon through JSON export and import', () => {
    const weapon: Character['weapons'][number] = {
      id: 'character-rifle',
      name: 'Hunting Rifle',
      range: { type: 'bands', short: 24, medium: 48, long: 96, extreme: true },
      damage: '2d8',
      ap: '2',
      rof: '1',
      magazine: '',
      category: 'Ranged',
      weight: 8,
      cost: 500,
    }

    const exported = createCharacterExportPayload({ ...character, weapons: [weapon] })
    const imported = validateCharacterImport(JSON.parse(JSON.stringify(exported)))

    expect(imported.weapons).toEqual([weapon])
  })

  it('exports referenced powers with their latest resolved fallback snapshot', () => {
    const storedPower = {
      id: 'row',
      powerId: 'bolt',
      name: 'Old Bolt',
      ppCost: '1',
      range: 'Old range',
      duration: 'Instant',
      description: 'Old description.',
      modifiers: [],
    }
    const resolvedPower = {
      ...storedPower,
      name: 'Updated Bolt',
      ppCost: '2',
      range: '24/48/96',
      description: 'Updated description.',
      sourceAvailable: true,
    }
    const payload = createCharacterExportPayload({ ...character, powers: [storedPower] }, [resolvedPower])

    expect(payload.powers).toEqual([{
      ...storedPower,
      name: 'Updated Bolt',
      ppCost: '2',
      range: '24/48/96',
      description: 'Updated description.',
    }])
  })
})