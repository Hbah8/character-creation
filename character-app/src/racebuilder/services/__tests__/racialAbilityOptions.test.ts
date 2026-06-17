import { describe, expect, it } from 'vitest'
import {
  getAvailableRacialAbilities,
  getUsedRepeatCount,
  resolveRacialAbilitiesForWorld,
} from '@/racebuilder/services/racialAbilityOptions'
import type { HandbookOverride, RacialAbility } from '@/types/handbook'
import type { RacialAbilityRef } from '@/world/types'

describe('racial ability options', () => {
  it('resolves the full SWADE racial ability catalog through the handbook resolver', () => {
    const abilities = resolveRacialAbilitiesForWorld([])

    expect(abilities).toHaveLength(46)
    expect(abilities.map(ability => ability.id)).toContain('attribute-bonus')
    expect(abilities.map(ability => ability.id)).not.toContain('keen-senses')
    expect(abilities.every(ability => ability.source === 'system')).toBe(true)
  })

  it('applies world overrides and appends world-only racial abilities', () => {
    const worldHandbook: HandbookOverride[] = [
      {
        id: 'agile',
        category: 'racialAbility',
        name: 'World Agile',
      },
      {
        id: 'crystal-skin',
        category: 'racialAbility',
        name: 'Crystal Skin',
        description: 'A world-specific racial ability.',
        type: 'positive',
        points: 2,
        maxRepeat: 1,
        parameterSchema: [],
      },
    ]

    const abilities = resolveRacialAbilitiesForWorld(worldHandbook)

    expect(abilities.find(ability => ability.id === 'agile')).toMatchObject({
      name: 'World Agile',
      source: 'world',
    })
    expect(abilities.find(ability => ability.id === 'crystal-skin')).toMatchObject({
      name: 'Crystal Skin',
      source: 'world',
    })
  })

  it('filters maxRepeat 1 selected abilities out of the available list', () => {
    const available = getAvailableRacialAbilities(
      resolveRacialAbilitiesForWorld([]),
      [{ id: 'no-vital-organs', repeatCount: 1, parameters: {} }],
    )

    expect(available.map(ability => ability.id)).not.toContain('no-vital-organs')
  })

  it('keeps repeatable abilities available until maxRepeat is reached', () => {
    const catalog = resolveRacialAbilitiesForWorld([])

    const once = getAvailableRacialAbilities(
      catalog,
      [{ id: 'armor', repeatCount: 1, parameters: {} }],
    )
    const threeTimes = getAvailableRacialAbilities(
      catalog,
      [{ id: 'armor', repeatCount: 3, parameters: {} }],
    )

    expect(once.map(ability => ability.id)).toContain('armor')
    expect(threeTimes.map(ability => ability.id)).not.toContain('armor')
  })

  it('counts selected repeatCount values', () => {
    const selected: RacialAbilityRef[] = [
      { id: 'armor', repeatCount: 2, parameters: {} },
      { id: 'size-plus-1', repeatCount: 1, parameters: {} },
      { id: 'armor', repeatCount: 1, parameters: {} },
    ]

    expect(getUsedRepeatCount(selected, 'armor')).toBe(3)
    expect(getUsedRepeatCount(selected, 'size-plus-1')).toBe(1)
  })

  it('keeps unlimited parameterized abilities available for distinct parameter choices', () => {
    const ability: RacialAbility = {
      id: 'attribute-bonus',
      name: 'Attribute Bonus',
      description: '',
      type: 'positive',
      points: 2,
      maxRepeat: 'unlimited',
      parameterSchema: [{ type: 'attribute-picker', key: 'attributeId', labelKey: 'parameters.attribute' }],
    }

    const available = getAvailableRacialAbilities(
      [{ ...ability, source: 'system' }],
      [{ id: 'attribute-bonus', repeatCount: 1, parameters: { attributeId: 'agility' } }],
    )

    expect(available.map(item => item.id)).toContain('attribute-bonus')
  })
})
