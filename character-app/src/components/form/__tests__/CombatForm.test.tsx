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

  it('renders only modifier inputs and no standalone calculated fields', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CombatForm, {
      character: CHARACTER,
      onChange: () => {},
    }))

    expect(html).not.toContain('id="resolved-pace"')
    expect(html).not.toContain('id="resolved-parry"')
    expect(html).not.toContain('id="resolved-toughness"')
    expect(html).not.toContain('id="resolved-armor"')
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
      onChange: () => {},
    }))

    expect(html).toContain('Staff held in two hands')
    expect(html).toContain('for="modifier-staff-source"')
    expect(html).toContain('for="modifier-staff-parry"')
    expect(html).toContain('id="modifier-staff-parry"')
    expect(html).toContain('id="modifier-staff-runningDieSteps"')
  })

  it('edits resource limits through modifiers instead of separate resource inputs', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CombatForm, {
      character: {
        ...CHARACTER,
        combatModifiers: [{ id: 'arcane', source: 'manual', name: 'Arcane background', powerPoints: 10 }],
      },
      onChange: () => {},
    }))

    expect(html).not.toContain('id="bennies"')
    expect(html).not.toContain('id="wounds"')
    expect(html).not.toContain('id="fatigue"')
    expect(html).not.toContain('id="mana"')
    expect(html).toContain('id="modifier-arcane-bennies"')
    expect(html).toContain('id="modifier-arcane-maxWounds"')
    expect(html).toContain('id="modifier-arcane-maxFatigue"')
    expect(html).toContain('id="modifier-arcane-powerPoints"')
  })

  it('uses compact resource labels and a container-aware grid for narrow form panels', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CombatForm, {
      character: CHARACTER,
      onChange: () => {},
    }))

    expect(html).toContain('Max. Wounds')
    expect(html).toContain('Max. Fatigue')
    expect(html).toContain('>PP</label>')
    expect(html).toContain('title="Maximum Fatigue"')
    expect(html).toContain('combat-resource-grid')
  })
})
