import { describe, expect, it } from 'vitest'
import {
  getAvailableRacialAbilities,
  resolveRacialAbilitiesForWorld,
} from '@/racebuilder/services/racialAbilityOptions'
import type { HandbookOverride } from '@/types/handbook'

describe('racial ability options', () => {
  it('resolves the 10 SWADE racial abilities through the handbook resolver', () => {
    const abilities = resolveRacialAbilitiesForWorld([])

    expect(abilities).toHaveLength(10)
    expect(abilities.map(ability => ability.id)).toContain('agile')
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

  it('filters selected abilities out of the available list', () => {
    const available = getAvailableRacialAbilities(
      resolveRacialAbilitiesForWorld([]),
      [{ id: 'agile' }, { id: 'outsider' }],
    )

    expect(available.map(ability => ability.id)).not.toContain('agile')
    expect(available.map(ability => ability.id)).not.toContain('outsider')
  })
})
