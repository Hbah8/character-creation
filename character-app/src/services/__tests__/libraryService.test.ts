import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadLibrary } from '@/services/libraryService'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import type { WorldLibraryEntry } from '@/world/services/worldLibraryService'
import type { World } from '@/world/types'
import { WORLD_SCHEMA_VERSION } from '@/world/types'

afterEach(() => vi.unstubAllGlobals())

describe('loadLibrary', () => {
  it('loads a custom-world character using the handbook of its referenced world', () => {
    const storage = new Map<string, string>()
    const customCharacter = {
      ...enDefaultCharacter,
      worldId: 'custom-world',
      skills: [{ id: 'house-magic-row', skillKey: 'house-magic', die: 'd6' as const }],
    }
    storage.set('swade-characters', JSON.stringify([
      { id: 'custom-character', savedAt: '2026-01-01T00:00:00.000Z', character: customCharacter },
    ]))
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    })
    const world: World = {
      schemaVersion: WORLD_SCHEMA_VERSION,
      name: 'Custom World',
      summary: '',
      settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
      races: [],
      entities: [],
      relationships: [],
      worldHandbook: [{
        mode: 'custom',
        handbookCategory: 'skill',
        id: 'house-magic',
        name: 'House Magic',
        description: '',
        linkedAttribute: 'spirit',
        isCore: true,
      }],
    }
    const worlds: WorldLibraryEntry[] = [{ id: 'custom-world', savedAt: '2026-01-01T00:00:00.000Z', world }]

    expect(loadLibrary(worlds)).toEqual([
      expect.objectContaining({
        id: 'custom-character',
        character: expect.objectContaining({
          worldId: 'custom-world',
          skills: [{ id: 'house-magic-row', skillKey: 'house-magic', die: 'd6' }],
        }),
      }),
    ])
  })
})
