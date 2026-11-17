import { describe, expect, it } from 'vitest'
import { resolveCharacterPowers } from '@/services/resolveCharacterPowers'
import type { CharacterPower } from '@/types/character'

describe('resolveCharacterPowers', () => {
  it('uses world overrides and selected background while preserving character modifiers', () => {
    const selected: CharacterPower = {
      id: 'row',
      powerId: 'bolt',
      name: 'Old Bolt',
      ppCost: '1',
      range: 'Old',
      duration: 'Old',
      description: 'Old',
      modifiers: [{ id: 'modifier', name: 'Selective', ppCost: '+1' }],
    }

    const result = resolveCharacterPowers(selected, 'Magic', [{
      mode: 'override',
      handbookCategory: 'power',
      id: 'bolt',
      description: 'World bolt.',
    }])

    expect(result).toMatchObject({
      id: 'row',
      powerId: 'bolt',
      name: 'Bolt',
      description: 'World bolt.',
      modifiers: selected.modifiers,
      sourceAvailable: true,
    })
  })

  it('returns the stored snapshot when the selected power cannot be resolved', () => {
    const fallback: CharacterPower = {
      id: 'row',
      powerId: 'removed-power',
      name: 'Removed Power',
      ppCost: '2',
      range: 'Touch',
      duration: 'Instant',
      description: 'Last known definition.',
      modifiers: [],
    }

    expect(resolveCharacterPowers(fallback, 'Magic', [])).toEqual({
      ...fallback,
      sourceAvailable: false,
    })
  })
})
