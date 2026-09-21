import type { EdgeRequirements, Rank } from '@/types/handbook'

export function getEdgeRequirementRank(requirements: EdgeRequirements | undefined): Rank | undefined {
  return requirements?.allOf.find(
    (requirement): requirement is Extract<EdgeRequirements['allOf'][number], { type: 'rank' }> =>
      'type' in requirement && requirement.type === 'rank',
  )?.minimum
}