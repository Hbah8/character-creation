import { describe, expect, it } from 'vitest'
import { createCharacterExportPayload } from '@/services/exportService'
import type { Character } from '@/types/character'

const character: Character = {
  sheetTitle: '', callsign: 'Scout', name: 'Scout', rank: 'Novice', role: '', fileNo: '', portraitUrl: '',
  agility: 'd6', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6',
  pace: '8', parry: '5', toughness: '7 (2)', armor: '2',
  combatModifiers: [{ id: 'worn-armor', source: 'equipment', name: 'Worn armor', armor: 2 }],
  importWarnings: ['validation.import.legacyArmorConflict'],
  bennies: '3', wounds: '0', fatigue: '0', mana: '0',
  skills: [], edges: [], hindrances: [], weapons: [], gear: [], specialRules: [], powers: [], notes: '',
}

describe('createCharacterExportPayload', () => {
  it('serializes combat sources and excludes derived and import-only fields', () => {
    const payload = createCharacterExportPayload(character)

    expect(payload).toMatchObject({ combatModifiers: character.combatModifiers, bennies: '3' })
    expect(payload).not.toHaveProperty('pace')
    expect(payload).not.toHaveProperty('parry')
    expect(payload).not.toHaveProperty('toughness')
    expect(payload).not.toHaveProperty('armor')
    expect(payload).not.toHaveProperty('importWarnings')
  })
})