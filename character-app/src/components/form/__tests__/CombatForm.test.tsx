import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CombatForm } from '@/components/form/CombatForm'
import type { Character } from '@/types/character'

const CHARACTER = {
  pace: '6',
  parry: '5',
  toughness: '6',
  armor: '2',
  bennies: '3',
  wounds: '0',
  fatigue: '0',
  mana: '10',
} as Character

describe('CombatForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'en'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders resolved armor as a calculated output and exposes an additive armor modifier input', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CombatForm, {
      character: CHARACTER,
      resolvedCombat: { pace: 6, parry: 5, toughness: 8, armor: 2, runningDie: 'd6', size: 0 },
      onChange: () => {},
    }))

    expect(html).toContain('<output id="resolved-armor"')
    expect(html).toContain('>2</output>')
    expect(html).not.toContain('<input id="resolved-armor"')
    expect(html).toContain('id="modifier-manual-combat-adjustment-armor"')
  })

  it('renders named modifier records with their source and effect fields', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CombatForm, {
      character: {
        ...CHARACTER,
        combatModifiers: [{ id: 'staff', source: 'equipment', name: 'Staff held in two hands', parry: 1 }],
      },
      resolvedCombat: { pace: 6, parry: 6, toughness: 6, armor: 2, runningDie: 'd6', size: 0 },
      onChange: () => {},
    }))

    expect(html).toContain('Staff held in two hands')
    expect(html).toContain('for="modifier-staff-source"')
    expect(html).toContain('for="modifier-staff-parry"')
    expect(html).toContain('id="modifier-staff-parry"')
    expect(html).toContain('id="modifier-staff-runningDieSteps"')
  })
})
