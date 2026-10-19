import type { ArcaneBackground } from '@/types/handbook'
import type { Edge } from '@/types/character'

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