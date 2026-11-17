import { describe, expect, it } from 'vitest'
import { resolveArcaneBackgrounds } from '@/handbooks/services/resolveArcaneBackgrounds'
import type { ArcaneBackgroundDefinition } from '@/types/handbook'

const SYSTEM_BACKGROUNDS: ArcaneBackgroundDefinition[] = [
  { id: 'Magic', name: 'Magic', description: 'System description.', skillId: 'spellcasting' },
]

describe('resolveArcaneBackgrounds', () => {
  it('resolves world overrides and custom backgrounds with their linked skills', () => {
    const backgrounds = resolveArcaneBackgrounds([
      {
        mode: 'override',
        handbookCategory: 'arcaneBackground',
        id: 'Magic',
        name: 'Sorcery',
        skillId: 'ritualism',
      },
      {
        mode: 'custom',
        handbookCategory: 'arcaneBackground',
        id: 'ancestral-magic',
        name: 'Ancestral Magic',
        description: 'Power passed through a family.',
        skillId: 'ritualism',
      },
    ], SYSTEM_BACKGROUNDS)

    expect(backgrounds).toEqual([
      expect.objectContaining({
        id: 'Magic',
        name: 'Sorcery',
        description: 'System description.',
        skillId: 'ritualism',
        source: 'world',
      }),
      expect.objectContaining({
        id: 'ancestral-magic',
        name: 'Ancestral Magic',
        skillId: 'ritualism',
        source: 'world',
      }),
    ])
  })
})
