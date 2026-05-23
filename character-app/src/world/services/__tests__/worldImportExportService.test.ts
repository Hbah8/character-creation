import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateWorldImport } from '@/world/services/validateWorldImport'
import { exportWorldToJson } from '@/world/services/worldImportExportService'
import type { World } from '@/world/types'

function validWorld(): World {
  return {
    schemaVersion: 1,
    name: 'Race World',
    summary: '',
    settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
    races: [
      {
        id: 'human',
        name: 'Human',
        description: 'Adaptable people.',
        abilities: [{ id: 'free-edge' }],
        size: 0,
      },
      {
        id: 'giant',
        name: 'Giant',
        description: '',
        abilities: [],
        size: 20,
      },
    ],
    worldHandbook: [],
    entities: [],
    relationships: [],
  }
}

describe('worldImportExportService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports races and keeps them valid for import', async () => {
    const world = validWorld()
    let exportedBlob: Blob | undefined
    const anchor = {
      href: '',
      download: '',
      click: vi.fn(),
    }

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => {
        exportedBlob = blob
        return 'blob:world-json'
      }),
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor),
    })

    exportWorldToJson(world)

    expect(anchor.download).toBe('Race World.json')
    expect(anchor.click).toHaveBeenCalledOnce()
    expect(exportedBlob).toBeInstanceOf(Blob)
    if (!exportedBlob) {
      throw new Error('Expected world export to create a JSON blob.')
    }

    const exportedWorld = JSON.parse(await exportedBlob.text()) as World
    const importedWorld = validateWorldImport(exportedWorld)

    expect(exportedWorld.races).toEqual(world.races)
    expect(importedWorld.races).toEqual(world.races)
  })
})
