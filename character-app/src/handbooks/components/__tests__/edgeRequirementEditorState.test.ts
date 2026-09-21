import { describe, expect, it } from 'vitest'
import {
  addAlternative,
  addAlternativeGroup,
  addRequirement,
  removeAlternative,
  removeRequirement,
  replaceRequirement,
  replaceAlternative,
} from '@/handbooks/components/edgeRequirementEditorState'

describe('edge requirement editor state', () => {
  it('preserves root requirements while editing an alternative group', () => {
    const withRank = addRequirement(
      { allOf: [] },
      { type: 'rank', minimum: 'Seasoned' },
    )
    const withAlternatives = addAlternativeGroup(
      withRank,
      { type: 'skill', skill: 'athletics', minimum: 'd8' },
    )
    const updated = replaceAlternative(
      withAlternatives,
      1,
      0,
      { type: 'skill', skill: 'shooting', minimum: 'd8' },
    )

    expect(updated).toEqual({
      allOf: [
        { type: 'rank', minimum: 'Seasoned' },
        { anyOf: [{ type: 'skill', skill: 'shooting', minimum: 'd8' }] },
      ],
    })
  })

  it('removes only the selected root requirement', () => {
    const requirements = {
      allOf: [
        { type: 'rank' as const, minimum: 'Seasoned' as const },
        { type: 'wildCard' as const },
      ],
    }

    expect(removeRequirement(requirements, 0)).toEqual({
      allOf: [{ type: 'wildCard' }],
    })
  })

  it('updates root requirements and alternatives without changing sibling values', () => {
    const requirements = {
      allOf: [
        { type: 'rank' as const, minimum: 'Novice' as const },
        { anyOf: [{ type: 'wildCard' as const }] },
      ],
    }

    const withUpdatedRank = replaceRequirement(requirements, 0, {
      type: 'rank',
      minimum: 'Veteran',
    })
    const withAdditionalAlternative = addAlternative(withUpdatedRank, 1, {
      type: 'text',
      text: 'A special permit',
    })

    expect(removeAlternative(withAdditionalAlternative, 1, 0)).toEqual({
      allOf: [
        { type: 'rank', minimum: 'Veteran' },
        { anyOf: [{ type: 'text', text: 'A special permit' }] },
      ],
    })
  })
})