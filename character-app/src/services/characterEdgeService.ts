import type { ArcaneBackground } from '@/types/handbook'
import type { Character, Edge } from '@/types/character'
import type { Edge as EdgeDefinition } from '@/types/handbook'
import { getUnmetRequirements } from '@/services/edgeSelectionService'

export function addEdgeReference(edges: readonly Edge[], edgeId: string, id: string): Edge[] {
  if (edges.some(edge => edge.edgeId === edgeId)) return edges as Edge[]
  return [...edges, { id, edgeId }]
}

export function removeEdgeReference(
  edges: readonly Edge[],
  id: string,
  arcaneBackground: ArcaneBackground | undefined,
): { edges: Edge[]; arcaneBackground: ArcaneBackground | undefined } {
  const nextEdges = edges.filter(edge => edge.id !== id)
  return {
    edges: nextEdges,
    arcaneBackground: nextEdges.some(edge => edge.edgeId === 'misticheskiy-dar') ? arcaneBackground : undefined,
  }
}

export function getDependentEdges(
  currentCharacter: Character,
  proposedCharacter: Character,
  definitions: readonly EdgeDefinition[],
): Edge[] {
  const definitionsById = new Map(definitions.map(edge => [edge.id, edge]))
  const dependents: Edge[] = []
  const dependentIds = new Set<string>()
  let candidate = proposedCharacter

  while (true) {
    const newlyInvalid = candidate.edges.filter(edge => {
      if (dependentIds.has(edge.id) || !edge.edgeId) return false
      const definition = definitionsById.get(edge.edgeId)
      return definition !== undefined
        && getUnmetRequirements(definition, currentCharacter).length === 0
        && getUnmetRequirements(definition, candidate).length > 0
    })

    if (newlyInvalid.length === 0) return dependents

    dependents.push(...newlyInvalid)
    for (const edge of newlyInvalid) dependentIds.add(edge.id)
    candidate = {
      ...candidate,
      edges: candidate.edges.filter(edge => !dependentIds.has(edge.id)),
    }
  }
}