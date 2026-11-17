import { SWADE_EDGES } from '@/data/handbooks/edges'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { Edge as CharacterEdge } from '@/types/character'
import type { Edge, ResolvedEntry, StoredHandbookEntry } from '@/types/handbook'

export type ResolvedCharacterEdge = CharacterEdge & ResolvedEntry<Edge>
export type GroupedResolvedCharacterEdge = ResolvedCharacterEdge & { repeatCount: number }

export function resolveEdgeDefinitions(
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedEntry<Edge>[] {
  return resolveHandbookEntries('edge', [...worldHandbook], [...SWADE_EDGES])
}

export function resolveCharacterEdges(
  edges: readonly CharacterEdge[],
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedCharacterEdge[] {
  const definitionsById = new Map(
    resolveEdgeDefinitions(worldHandbook).map(definition => [definition.id, definition]),
  )

  return edges.map(edge => {
    const definition = definitionsById.get(edge.edgeId)
    if (!definition) throw new Error(`validation.edge.unknownEdge:${edge.edgeId}`)
    return { ...definition, ...edge }
  })
}

export function groupResolvedCharacterEdges(
  edges: readonly ResolvedCharacterEdge[],
): GroupedResolvedCharacterEdge[] {
  const result: GroupedResolvedCharacterEdge[] = []
  const indexByEdgeId = new Map<string, number>()

  for (const edge of edges) {
    const existingIndex = edge.repeatable ? indexByEdgeId.get(edge.edgeId) : undefined
    if (existingIndex !== undefined) {
      result[existingIndex].repeatCount += 1
      continue
    }

    const grouped = { ...edge, repeatCount: 1 }
    if (edge.repeatable) indexByEdgeId.set(edge.edgeId, result.length)
    result.push(grouped)
  }

  return result
}