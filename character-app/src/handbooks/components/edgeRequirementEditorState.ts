import type {
  EdgeRequirement,
  EdgeRequirementCondition,
  EdgeRequirements,
} from '@/types/handbook'

export function addRequirement(
  requirements: EdgeRequirements,
  condition: EdgeRequirement,
): EdgeRequirements {
  return { allOf: [...requirements.allOf, condition] }
}

export function replaceRequirement(
  requirements: EdgeRequirements,
  index: number,
  condition: EdgeRequirement,
): EdgeRequirements {
  return {
    allOf: requirements.allOf.map((requirement, requirementIndex) =>
      requirementIndex === index ? condition : requirement,
    ),
  }
}

export function removeRequirement(
  requirements: EdgeRequirements,
  index: number,
): EdgeRequirements {
  return {
    allOf: requirements.allOf.filter((_, requirementIndex) => requirementIndex !== index),
  }
}

export function addAlternativeGroup(
  requirements: EdgeRequirements,
  condition: EdgeRequirementCondition,
): EdgeRequirements {
  return addRequirement(requirements, { anyOf: [condition] })
}

export function addAlternative(
  requirements: EdgeRequirements,
  requirementIndex: number,
  condition: EdgeRequirementCondition,
): EdgeRequirements {
  return replaceAlternativeGroup(requirements, requirementIndex, alternatives => [
    ...alternatives,
    condition,
  ])
}

export function replaceAlternative(
  requirements: EdgeRequirements,
  requirementIndex: number,
  alternativeIndex: number,
  condition: EdgeRequirementCondition,
): EdgeRequirements {
  return replaceAlternativeGroup(requirements, requirementIndex, alternatives =>
    alternatives.map((alternative, index) => index === alternativeIndex ? condition : alternative),
  )
}

export function removeAlternative(
  requirements: EdgeRequirements,
  requirementIndex: number,
  alternativeIndex: number,
): EdgeRequirements {
  return replaceAlternativeGroup(requirements, requirementIndex, alternatives =>
    alternatives.filter((_, index) => index !== alternativeIndex),
  )
}

function replaceAlternativeGroup(
  requirements: EdgeRequirements,
  requirementIndex: number,
  update: (alternatives: EdgeRequirementCondition[]) => EdgeRequirementCondition[],
): EdgeRequirements {
  const requirement = requirements.allOf[requirementIndex]
  if (!requirement || !('anyOf' in requirement)) return requirements

  return replaceRequirement(requirements, requirementIndex, {
    anyOf: update(requirement.anyOf),
  })
}