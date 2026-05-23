import { useCallback, useState } from 'react'
import type {
  World,
  WorldEntity,
  WorldEntityType,
  WorldPosition,
  WorldRelationship,
  WorldRelationshipType,
  SettingRules,
  Race,
} from '@/world/types'
import type { HandbookOverride } from '@/types/handbook'
import { defaultWorld, createWorldEntity } from '@/world/data/defaultWorld'
import { applyEntityPosition } from '@/world/graph/worldGraphMapper'

export function addRaceToWorld(world: World, race: Race): World {
  return {
    ...world,
    races: [...world.races, race],
  }
}

export function updateRaceInWorld(world: World, id: string, updates: Partial<Race>): World {
  return {
    ...world,
    races: world.races.map(race =>
      race.id === id ? { ...race, ...updates } : race
    ),
  }
}

export function removeRaceFromWorld(world: World, id: string): World {
  return {
    ...world,
    races: world.races.filter(race => race.id !== id),
  }
}

export function useWorldStore(initialWorld?: World) {
  const [world, setWorld] = useState<World>(initialWorld ?? defaultWorld)

  const replaceWorld = useCallback((nextWorld: World) => {
    setWorld(nextWorld)
  }, [])

  const updateWorldField = useCallback(<K extends 'name' | 'summary'>(key: K, value: World[K]) => {
    setWorld(prev => ({ ...prev, [key]: value }))
  }, [])

  const addEntity = useCallback((type: WorldEntityType, title: string, position?: WorldPosition) => {
    const entity = createWorldEntity(type, title, position)
    setWorld(prev => ({
      ...prev,
      entities: [...prev.entities, entity],
    }))
    return entity.id
  }, [])

  const updateEntity = useCallback((id: string, patch: Partial<WorldEntity>) => {
    setWorld(prev => ({
      ...prev,
      entities: prev.entities.map(entity =>
        entity.id === id ? { ...entity, ...patch } : entity
      ),
    }))
  }, [])

  const removeEntity = useCallback((id: string) => {
    setWorld(prev => ({
      ...prev,
      entities: prev.entities.filter(entity => entity.id !== id),
      relationships: prev.relationships.filter(
        relationship => relationship.sourceId !== id && relationship.targetId !== id
      ),
    }))
  }, [])

  const moveEntity = useCallback((id: string, position: WorldPosition) => {
    setWorld(prev => applyEntityPosition(prev, id, position))
  }, [])

  const addRelationship = useCallback((
    sourceId: string,
    targetId: string,
    type: WorldRelationshipType = 'mentions',
  ) => {
    if (sourceId === targetId) return null
    const relationship: WorldRelationship = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      type,
      label: '',
      description: '',
    }
    setWorld(prev => ({
      ...prev,
      relationships: [...prev.relationships, relationship],
    }))
    return relationship.id
  }, [])

  const updateRelationship = useCallback((id: string, patch: Partial<WorldRelationship>) => {
    setWorld(prev => ({
      ...prev,
      relationships: prev.relationships.map(relationship =>
        relationship.id === id ? { ...relationship, ...patch } : relationship
      ),
    }))
  }, [])

  const removeRelationship = useCallback((id: string) => {
    setWorld(prev => ({
      ...prev,
      relationships: prev.relationships.filter(relationship => relationship.id !== id),
    }))
  }, [])

  const updateSettingRules = useCallback((rules: Partial<SettingRules>) => {
    setWorld(prev => ({
      ...prev,
      settingRules: { ...prev.settingRules, ...rules },
    }))
  }, [])

  const addRace = useCallback((race: Race) => {
    setWorld(prev => addRaceToWorld(prev, race))
  }, [])

  const updateRace = useCallback((id: string, updates: Partial<Race>) => {
    setWorld(prev => updateRaceInWorld(prev, id, updates))
  }, [])

  const removeRace = useCallback((id: string) => {
    setWorld(prev => removeRaceFromWorld(prev, id))
  }, [])

  const addHandbookEntry = useCallback((entry: HandbookOverride) => {
    setWorld(prev => ({
      ...prev,
      worldHandbook: [...prev.worldHandbook, entry],
    }))
  }, [])

  const updateHandbookEntry = useCallback((id: string, patch: Partial<HandbookOverride>) => {
    setWorld(prev => ({
      ...prev,
      worldHandbook: prev.worldHandbook.map(e =>
        e.id === id ? { ...e, ...patch, id: e.id, category: e.category } as HandbookOverride : e
      ),
    }))
  }, [])

  const removeHandbookEntry = useCallback((id: string) => {
    setWorld(prev => ({
      ...prev,
      worldHandbook: prev.worldHandbook.filter(e => e.id !== id),
    }))
  }, [])

  return {
    world,
    replaceWorld,
    updateWorldField,
    addEntity,
    updateEntity,
    removeEntity,
    moveEntity,
    addRelationship,
    updateRelationship,
    removeRelationship,
    updateSettingRules,
    addRace,
    updateRace,
    removeRace,
    addHandbookEntry,
    updateHandbookEntry,
    removeHandbookEntry,
  }
}
