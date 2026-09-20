import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CharacterSheet } from '@/components/preview/CharacterSheet'
import type { Character } from '@/types/character'

const SOURCE_CHARACTER = {
  sheetTitle: 'Test', callsign: 'ACE', name: 'Test Name', rank: 'Novice', role: '', fileNo: '', portraitUrl: '',
  agility: 'd6', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6',
  pace: '99', parry: '99', toughness: '99', armor: '99',
  bennies: '3', wounds: '0', fatigue: '0', mana: '0', notes: '',
  skills: [], edges: [], hindrances: [], weapons: [], gear: [], specialRules: [], powers: [],
} as Character

describe('CharacterSheet', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders source data with explicit effective attributes and combat output', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CharacterSheet, {
      resolvedCharacter: {
        source: SOURCE_CHARACTER,
        attributes: { agility: 'd8', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6' },
        combat: { pace: 6, parry: 5, toughness: 7, armor: 2, runningDie: 'd8', size: 0 },
      },
    }))

    expect(html).toContain('AGILITY d8')
    expect(html).toContain('7 (2)')
    expect(html).not.toContain('99')
  })
})