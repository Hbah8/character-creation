import { describe, expect, it } from 'vitest'
import {
  resolveCharacterHindrances,
  resolveHindranceDefinitions,
  toCharacterHindrance,
} from '@/handbooks/services/resolveCharacterHindrances'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import { ruDefaultCharacter } from '@/i18n/locales/ru/defaults'

describe('resolveHindranceDefinitions', () => {
  it('resolves system hindrances with world overrides and custom entries', () => {
    const definitions = resolveHindranceDefinitions([
      {
        mode: 'override',
        handbookCategory: 'hindrance',
        id: 'boleznennost',
        name: 'World Sickness',
        description: 'A world-specific effect.',
      },
      {
        mode: 'custom',
        handbookCategory: 'hindrance',
        id: 'house-rule',
        name: 'House Rule',
        type: 'Major',
        description: 'A custom world hindrance.',
      },
    ])

    expect(definitions.find(({ id }) => id === 'boleznennost')).toMatchObject({
      name: 'World Sickness',
      description: 'A world-specific effect.',
      type: 'Minor',
      source: 'world',
    })
    expect(definitions.find(({ id }) => id === 'house-rule')).toMatchObject({
      name: 'House Rule',
      type: 'Major',
      source: 'world',
    })
    expect(definitions.find(({ id }) => id === 'vernyy-drug')).toMatchObject({
      source: 'system',
    })
  })
})

describe('toCharacterHindrance', () => {
  it('creates a handbook reference with a name fallback', () => {
    expect(toCharacterHindrance({
      id: 'house-rule',
      name: 'House Rule',
      type: 'Major',
      description: 'A custom world hindrance.',
    })).toEqual({
      hindranceId: 'house-rule',
      name: 'House Rule',
      severity: 'major',
      description: 'A custom world hindrance.',
    })
  })
})

describe('resolveCharacterHindrances', () => {
  it.each([
    ['English', enDefaultCharacter],
    ['Russian', ruDefaultCharacter],
  ])('uses canonical handbook references in the %s default character', (_locale, character) => {
    expect(character.hindrances).toEqual([
      { id: '1', hindranceId: 'zhazhda-krovi' },
      { id: '2', hindranceId: 'obyazatelstva-minor' },
      { id: '3', hindranceId: 'vrag-minor' },
    ])

    const definitions = new Map(resolveHindranceDefinitions([]).map(definition => [definition.id, definition]))
    const resolved = resolveCharacterHindrances(character.hindrances, [])

    expect(resolved.map(({ name, severity, description }) => ({ name, severity, description }))).toEqual(
      character.hindrances.map(({ hindranceId }) => {
        if (!hindranceId) throw new Error('Expected a default hindrance handbook reference')
        const definition = definitions.get(hindranceId)
        return {
          name: definition?.name,
          severity: definition?.type === 'Major' ? 'major' : 'minor',
          description: definition?.description,
        }
      }),
    )
  })

  it('uses the current world override for selected references', () => {
    expect(resolveCharacterHindrances([
      {
        id: 'selected-row',
        hindranceId: 'boleznennost',
        name: 'Old fallback',
        severity: 'minor',
        description: 'Old description',
      },
    ], [{
      mode: 'override',
      handbookCategory: 'hindrance',
      id: 'boleznennost',
      name: 'World Sickness',
      description: 'A world-specific effect.',
    }])).toEqual([expect.objectContaining({
      id: 'selected-row',
      hindranceId: 'boleznennost',
      name: 'World Sickness',
      severity: 'minor',
      description: 'A world-specific effect.',
      source: 'world',
    })])
  })

  it('keeps fallback values when a legacy hindrance has no catalog reference', () => {
    expect(resolveCharacterHindrances([{
      id: 'legacy-row',
      name: 'Imported custom hindrance',
      severity: 'major',
      description: 'Legacy description',
    }], [])).toEqual([expect.objectContaining({
      id: 'legacy-row',
      name: 'Imported custom hindrance',
      severity: 'major',
      description: 'Legacy description',
    })])
  })
})
