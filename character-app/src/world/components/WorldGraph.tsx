import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeMouseHandler,
  type OnNodeDrag,
  type NodeMouseHandler,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const mappedGraph = useMemo(
    () => worldToGraph(world, selectedEntityId, selectedRelationshipId, {
      entityType: (type: WorldEntityType) => t(WORLD_ENTITY_LABEL_KEYS[type]),
      relationshipType: (type: WorldRelationshipType) => t(WORLD_RELATIONSHIP_LABEL_KEYS[type]),
    }),
    [world, selectedEntityId, selectedRelationshipId, t],
  )

  const [nodes, setNodes, handleNodesChange] = useNodesState<WorldGraphNode>(mappedGraph.nodes)
  const [edges, setEdges, handleEdgesChange] = useEdgesState(mappedGraph.edges)
  const [showMiniMap, setShowMiniMap] = useState(false)

  useEffect(() => {
    setNodes(mappedGraph.nodes)
    setEdges(mappedGraph.edges)
  }, [mappedGraph, setEdges, setNodes])

  const handleNodeDragStop: OnNodeDrag<WorldGraphNode> = useCallback((_, node) => {
    onMoveEntity(node.id, node.position)
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
    <div className="relative h-full w-full bg-muted/40">
      <div className="absolute right-3 top-3 z-10">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shadow-sm"
          onClick={() => setShowMiniMap(prev => !prev)}
        >
          <Map className="size-3.5 mr-1.5" />
          {showMiniMap ? t('world.hideMiniMap') : t('world.showMiniMap')}
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onPaneClick={() => {
          onSelectEntity(null)
          onSelectRelationship(null)
        }}
        fitView
        onlyRenderVisibleElements
        nodesDraggable
        nodesConnectable
        elementsSelectable
      >
        <Background />
        <Controls />
        {showMiniMap && <MiniMap pannable zoomable />}
      </ReactFlow>
    </div>
  )
}
