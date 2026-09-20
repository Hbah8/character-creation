import { describe, expect, it } from 'vitest'
import { createCharacterCombatantDraft } from '@/combat/services/combatantDraft'
import type { Character } from '@/types/character'

const character: Character = {
  sheetTitle: '', callsign: 'Scout', name: 'Scout', rank: 'Novice', role: '', fileNo: '', portraitUrl: '',
  agility: 'd6', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6',
  pace: '99', parry: '99', toughness: '99', armor: '0',
  combatModifiers: [
    { id: 'swift', source: 'manual', name: 'Swift', pace: 2 },
    { id: 'worn-armor', source: 'equipment', name: 'Worn armor', armor: 2 },
  ],
  bennies: '3', wounds: '0', fatigue: '0', mana: '0',
  skills: [{ id: 'fighting', skillKey: 'fighting', name: 'Fighting', die: 'd6', linkedAttribute: 'agility' }],
  edges: [], hindrances: [], weapons: [], gear: [], specialRules: [], powers: [], notes: '',
}

describe('createCharacterCombatantDraft', () => {
  it('uses resolved character stats when making an encounter snapshot', () => {
    expect(createCharacterCombatantDraft(character, null)).toMatchObject({
      name: 'Scout',
      pace: 8,
      parry: 5,
      toughness: 7,
      armor: 2,
      maxWounds: 3,
    })
  })

  it('returns an independent snapshot when the character changes later', () => {
    const draft = createCharacterCombatantDraft(character, null)
    character.combatModifiers = [{ id: 'slow', source: 'manual', name: 'Slow', pace: -2 }]

    expect(draft.pace).toBe(8)
  })
})