import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportErrorDialog } from '@/components/ImportErrorDialog'
import { detectInitialLocale } from '@/i18n'
import { getDefaultWorld } from '@/world/data/defaultWorld'
import { WorldControlPanel } from '@/world/components/WorldControlPanel'
import { WorldExportDropdown } from '@/world/components/WorldExportDropdown'
import { WorldGraph } from '@/world/components/WorldGraph'
import { WorldInspector } from '@/world/components/WorldInspector'
import { exportWorldToJson, importWorldFromJson } from '@/world/services/worldImportExportService'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { useWorldStore } from '@/world/store/useWorldStore'
import type { WorldEntityType } from '@/world/types'
import { WORLD_ENTITY_LABEL_KEYS } from '@/world/i18nKeys'

const initialLocale = detectInitialLocale()

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WorldBuilderPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { t: tForm } = useTranslation('form')
  const { t: tHeader } = useTranslation('header')
  const { t: tLibrary } = useTranslation('library')
  const { t: tNav } = useTranslation('navigation')
  const library = useWorldLibrary()
  const store = useWorldStore(getDefaultWorld(initialLocale))
  const { world } = store

  const [cleanSnapshot, setCleanSnapshot] = useState(() => JSON.stringify(world))
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    () => world.entities[0]?.id ?? null,
  )
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const loadedIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (id && id !== loadedIdRef.current) {
      try {
        const loaded = library.loadById(id)
        store.replaceWorld(loaded)
        setCleanSnapshot(JSON.stringify(loaded))
        setSavedAt(null)
        setSelectedEntityId(loaded.entities[0]?.id ?? null)
        setSelectedRelationshipId(null)
        loadedIdRef.current = id
      } catch {
        navigate('/worlds', { replace: true })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const selectedEntity = useMemo(
    () => world.entities.find(entity => entity.id === selectedEntityId) ?? null,
    [world.entities, selectedEntityId],
  )

  const selectedRelationship = useMemo(
    () => world.relationships.find(item => item.id === selectedRelationshipId) ?? null,
    [world.relationships, selectedRelationshipId],
  )

  const isDirty = useMemo(
    () => JSON.stringify(world) !== cleanSnapshot,
    [world, cleanSnapshot],
  )

  function handleSave() {
    const savedId = library.save(world)
    setCleanSnapshot(JSON.stringify(world))
    setSavedAt(new Date())
    if (!id) {
      navigate(`/worlds/${savedId}`, { replace: true })
    }
  }

  function handleAddEntity(type: WorldEntityType) {
    const idx = world.entities.length
    const typeLabel = tForm(WORLD_ENTITY_LABEL_KEYS[type])
    const entityId = store.addEntity(
      type,
      tForm('world.newEntityTitle', { type: typeLabel }),
      {
        x: 120 + (idx % 4) * 220,
        y: 120 + Math.floor(idx / 4) * 160,
      },
    )
    setSelectedRelationshipId(null)
    setSelectedEntityId(entityId)
  }

  function handleSelectEntity(entityId: string | null) {
    setSelectedRelationshipId(null)
    setSelectedEntityId(entityId)
  }

  function handleSelectRelationship(relationshipId: string | null) {
    setSelectedEntityId(null)
    setSelectedRelationshipId(relationshipId)
  }

  function handleCreateRelationship(sourceId: string, targetId: string) {
    const relationshipId = store.addRelationship(sourceId, targetId)
    if (relationshipId) {
      setSelectedEntityId(null)
      setSelectedRelationshipId(relationshipId)
    }
  }

  function handleRemoveEntity(entityId: string) {
    store.removeEntity(entityId)
    setSelectedEntityId(null)
    setSelectedRelationshipId(null)
  }

  function handleRemoveRelationship(relationshipId: string) {
    store.removeRelationship(relationshipId)
    setSelectedRelationshipId(null)
  }

  async function handleImportJson(file: File) {
    try {
      const imported = await importWorldFromJson(file)
      store.replaceWorld(imported)
      setCleanSnapshot(JSON.stringify(imported))
      setSavedAt(null)
      setSelectedEntityId(imported.entities[0]?.id ?? null)
      setSelectedRelationshipId(null)
      library.markNew()
      navigate('/worlds/new', { replace: true })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'validation.world.invalidJson')
    }
  }

  const controlPanel = (
    <WorldControlPanel
      world={world}
      selectedEntityId={selectedEntityId}
      onWorldNameChange={value => store.updateWorldField('name', value)}
      onWorldSummaryChange={value => store.updateWorldField('summary', value)}
      onUpdateSettingRules={store.updateSettingRules}
      onAddEntity={handleAddEntity}
      onSelectEntity={handleSelectEntity}
    />
  )

  const graph = (
    <WorldGraph
      world={world}
      selectedEntityId={selectedEntityId}
      selectedRelationshipId={selectedRelationshipId}
      onSelectEntity={handleSelectEntity}
      onSelectRelationship={handleSelectRelationship}
      onMoveEntity={store.moveEntity}
      onCreateRelationship={handleCreateRelationship}
    />
  )

  const inspector = (
    <WorldInspector
      world={world}
      entity={selectedEntity}
      relationship={selectedRelationship}
      onUpdateEntity={store.updateEntity}
      onRemoveEntity={handleRemoveEntity}
      onUpdateRelationship={store.updateRelationship}
      onRemoveRelationship={handleRemoveRelationship}
      onSelectEntity={handleSelectEntity}
      onSelectRelationship={handleSelectRelationship}
    />
  )

  return (
    <div className="h-[100svh] w-full flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-12 shrink-0 border-b px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => navigate('/worlds')}
            aria-label={tHeader('backToWorlds')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {world.name || tLibrary('worlds.untitledWorld')}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {tHeader('worldStats', {
                entities: world.entities.length,
                relationships: world.relationships.length,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && <span className="text-xs text-amber-500">{tHeader('unsaved')}</span>}
          {!isDirty && savedAt && (
            <span className="text-xs text-muted-foreground">
              {tHeader('savedAt', { time: formatTime(savedAt) })}
            </span>
          )}
          <Button size="sm" onClick={handleSave}>
            <Save className="size-4 mr-1.5" />
            {tLibrary('save')}
          </Button>
          <WorldExportDropdown
            onExportJson={() => exportWorldToJson(world)}
            onImportJson={handleImportJson}
          />
        </div>
      </header>

      <div className="hidden lg:grid flex-1 min-h-0 grid-cols-[320px_minmax(0,1fr)_360px]">
        {controlPanel}
        <main className="min-h-0 min-w-0">{graph}</main>
        {inspector}
      </div>

      <Tabs defaultValue="graph" className="lg:hidden flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 border-b px-3 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="data" className="flex-1">{tNav('data')}</TabsTrigger>
            <TabsTrigger value="graph" className="flex-1">{tNav('graph')}</TabsTrigger>
            <TabsTrigger value="edit" className="flex-1">{tNav('edit')}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="data" className="flex-1 min-h-0 mt-0">
          {controlPanel}
        </TabsContent>
        <TabsContent value="graph" className="flex-1 min-h-0 mt-0">
          {graph}
        </TabsContent>
        <TabsContent value="edit" className="flex-1 min-h-0 mt-0">
          {inspector}
        </TabsContent>
      </Tabs>

      <ImportErrorDialog
        open={importError !== null}
        message={importError ?? ''}
        onClose={() => setImportError(null)}
      />
    </div>
  )
}
