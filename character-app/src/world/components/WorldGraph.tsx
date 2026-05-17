import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeMouseHandler,
  type NodeChange,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { World, WorldPosition } from '@/world/types'
import type { WorldEntityType, WorldRelationshipType } from '@/world/types'
import {
  type WorldGraphNode,
  worldToGraph,
} from '@/world/graph/worldGraphMapper'
import {
  WORLD_ENTITY_LABEL_KEYS,
  WORLD_RELATIONSHIP_LABEL_KEYS,
} from '@/world/i18nKeys'

interface Props {
  world: World
  selectedEntityId: string | null
  selectedRelationshipId: string | null
  onSelectEntity: (id: string | null) => void
  onSelectRelationship: (id: string | null) => void
  onMoveEntity: (id: string, position: WorldPosition) => void
  onCreateRelationship: (sourceId: string, targetId: string) => void
}

export function WorldGraph({
  world,
  selectedEntityId,
  selectedRelationshipId,
  onSelectEntity,
  onSelectRelationship,
  onMoveEntity,
  onCreateRelationship,
}: Props) {
  const { t } = useTranslation('form')
  const { nodes, edges } = useMemo(
    () => worldToGraph(world, selectedEntityId, selectedRelationshipId, {
      entityType: (type: WorldEntityType) => t(WORLD_ENTITY_LABEL_KEYS[type]),
      relationshipType: (type: WorldRelationshipType) => t(WORLD_RELATIONSHIP_LABEL_KEYS[type]),
    }),
    [world, selectedEntityId, selectedRelationshipId, t],
  )

  const handleNodesChange = useCallback((changes: NodeChange<WorldGraphNode>[]) => {
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        onMoveEntity(change.id, change.position)
      }
    }
  }, [onMoveEntity])

  const handleNodeClick: NodeMouseHandler<WorldGraphNode> = useCallback((_, node) => {
    onSelectRelationship(null)
    onSelectEntity(node.id)
  }, [onSelectEntity, onSelectRelationship])

  const handleEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
    onSelectEntity(null)
    onSelectRelationship(edge.id)
  }, [onSelectEntity, onSelectRelationship])

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    onCreateRelationship(connection.source, connection.target)
  }, [onCreateRelationship])

  return (
    <div className="h-full w-full bg-muted/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onPaneClick={() => {
          onSelectEntity(null)
          onSelectRelationship(null)
        }}
        fitView
        nodesDraggable
        nodesConnectable
        elementsSelectable
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}
