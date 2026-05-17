import type { Edge, Node } from '@xyflow/react'
import type { World, WorldEntityType, WorldRelationshipType } from '@/world/types'

export interface WorldNodeData extends Record<string, unknown> {
  entityId: string
  label: string
  type: WorldEntityType
  typeLabel: string
  summary: string
}

export interface WorldEdgeData extends Record<string, unknown> {
  relationshipId: string
  type: WorldRelationshipType
  typeLabel: string
}

export type WorldGraphNode = Node<WorldNodeData>
export type WorldGraphEdge = Edge<WorldEdgeData>

interface WorldGraphLabels {
  entityType: (type: WorldEntityType) => string
  relationshipType: (type: WorldRelationshipType) => string
}

const DEFAULT_LABELS: WorldGraphLabels = {
  entityType: type => type,
  relationshipType: type => type,
}

export function worldToGraph(
  world: World,
  selectedEntityId: string | null = null,
  selectedRelationshipId: string | null = null,
  labels: WorldGraphLabels = DEFAULT_LABELS,
) {
  const nodes: WorldGraphNode[] = world.entities.map(entity => ({
    id: entity.id,
    type: 'default',
    position: entity.position,
    selected: entity.id === selectedEntityId,
    data: {
      entityId: entity.id,
      label: entity.title || labels.entityType(entity.type),
      type: entity.type,
      typeLabel: labels.entityType(entity.type),
      summary: entity.summary,
    },
    style: {
      background: 'var(--card)',
      border: entity.id === selectedEntityId ? '2px solid var(--primary)' : '1px solid var(--border)',
      borderRadius: 8,
      color: 'var(--card-foreground)',
      minWidth: 160,
      maxWidth: 220,
      boxShadow: entity.id === selectedEntityId ? '0 8px 24px oklch(0 0 0 / 12%)' : 'none',
    },
  }))

  const edges: WorldGraphEdge[] = world.relationships.map(relationship => ({
    id: relationship.id,
    source: relationship.sourceId,
    target: relationship.targetId,
    selected: relationship.id === selectedRelationshipId,
    label: relationship.label || labels.relationshipType(relationship.type),
    type: 'smoothstep',
    data: {
      relationshipId: relationship.id,
      type: relationship.type,
      typeLabel: labels.relationshipType(relationship.type),
    },
    style: {
      stroke: relationship.id === selectedRelationshipId ? 'var(--primary)' : 'var(--muted-foreground)',
      strokeWidth: relationship.id === selectedRelationshipId ? 2 : 1.5,
    },
  }))

  return { nodes, edges }
}

export function applyEntityPosition(world: World, entityId: string, position: { x: number; y: number }): World {
  return {
    ...world,
    entities: world.entities.map(entity =>
      entity.id === entityId
        ? { ...entity, position: { x: position.x, y: position.y } }
        : entity
    ),
  }
}
