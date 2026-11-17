import { describe, expect, it } from 'vitest'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import { validateCharacterImport } from '@/services/validateImport'

describe('validateCharacterImport edge references', () => {
  it('rejects legacy manual edge fields and unknown catalog references', () => {
    expect(() => validateCharacterImport({
      ...enDefaultCharacter,
      edges: [{ id: 'legacy-row', name: 'Legacy Edge', effect: 'Manual text.' }],
    }, [])).toThrow('validation.import.invalidEdge')

    expect(() => validateCharacterImport({
      ...enDefaultCharacter,
      edges: [{ id: 'unknown-row', edgeId: 'unknown-edge' }],
    }, [])).toThrow('validation.import.unknownEdge:unknown-edge')

    const { isWildCard: _isWildCard, ...withoutWildCard } = enDefaultCharacter
    expect(() => validateCharacterImport(withoutWildCard, [])).toThrow('validation.import.missingBooleanField:isWildCard')
    expect(() => validateCharacterImport({
      ...enDefaultCharacter,
      arcaneBackground: 'Magic',
    }, [])).toThrow('validation.import.arcaneBackgroundWithoutMysticGift')

    expect(() => validateCharacterImport({
      ...enDefaultCharacter,
      rank: 'Ветеран',
    }, [])).toThrow('validation.import.invalidRank')
  })

  it('accepts a custom edge only when it is in the referenced world handbook', () => {
    const raw = {
      ...enDefaultCharacter,
      edges: [{ id: 'house-row', edgeId: 'house-edge' }],
    }
    const handbook = [{
      mode: 'custom',
      handbookCategory: 'edge',
      id: 'house-edge',
      name: 'House Edge',
      description: '',
      type: 'Weird',
    }] as const

    expect(validateCharacterImport(raw, handbook).edges).toEqual(raw.edges)
    expect(() => validateCharacterImport(raw, [])).toThrow('validation.import.unknownEdge:house-edge')
  })

  it('preserves a custom arcane background id on character import', () => {
    const raw = {
      ...enDefaultCharacter,
      arcaneBackground: 'ancestral-magic',
      edges: [{ id: 'gift-row', edgeId: 'misticheskiy-dar' }],
    }

    expect(validateCharacterImport(raw).arcaneBackground).toBe('ancestral-magic')
  })

  it('drops legacy manual powers and preserves catalog references with fallback data', () => {
    const imported = validateCharacterImport({
      ...enDefaultCharacter,
      powers: [
        {
          id: 'legacy',
          name: 'Manual power',
          ppCost: '2',
          range: 'Touch',
          duration: 'Instant',
          description: 'Old manual entry.',
          modifiers: [{ id: 'modifier', name: 'Old modifier', ppCost: '+1' }],
        },
        {
          id: 'referenced',
          powerId: 'missing-power',
          name: 'Saved power',
          ppCost: '3',
          range: 'Smarts',
          duration: '3 rounds',
          description: 'Last known data.',
          modifiers: [],
        },
      ],
    })

    expect(imported.powers).toEqual([{
      id: 'referenced',
      powerId: 'missing-power',
      name: 'Saved power',
      ppCost: '3',
      range: 'Smarts',
      duration: '3 rounds',
      description: 'Last known data.',
      modifiers: [],
    }])
  })
})