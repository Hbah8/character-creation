import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultWorld } from '@/world/data/defaultWorld'
import type { WorldLibraryEntry } from '@/world/services/worldLibraryService'
import { MapLibraryPanel } from '@/maps/components/MapLibraryPanel'
import { MapViewer } from '@/maps/components/MapViewer'
import type { MapListItem } from '@/maps/components/MapLibraryPanel'
import { DEFAULT_MAP_GRID_SETTINGS } from '@/maps/types'

const { mockUseWorldLibrary, mockNavigate } = vi.hoisted(() => ({
  mockUseWorldLibrary: vi.fn(),
  mockNavigate: vi.fn(),
}))

vi.mock('@/world/store/useWorldLibrary', () => ({
  useWorldLibrary: mockUseWorldLibrary,
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

import { MapsPage } from '@/maps/pages/MapsPage'

describe('MapsPage', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  beforeEach(async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')
    mockUseWorldLibrary.mockReturnValue({
      entries: [],
      activeWorldId: null,
      setActiveWorldId: vi.fn(),
    })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('explains that maps require an active world', () => {
    const html = renderToStaticMarkup(createElement(MapsPage))

    expect(html).toContain('No active world')
    expect(html).toContain('Select a world to view its maps')
    expect(html).not.toContain('Upload image')
  })

  it('renders the empty map library for an active world', () => {
    const worldEntry: WorldLibraryEntry = {
      id: 'world-1',
      savedAt: '2026-11-01T00:00:00.000Z',
      world: getDefaultWorld('en'),
    }
    mockUseWorldLibrary.mockReturnValue({
      entries: [worldEntry],
      activeWorldId: worldEntry.id,
      setActiveWorldId: vi.fn(),
    })

    const html = renderToStaticMarkup(createElement(MapsPage))

    expect(html).toContain('New World')
    expect(html).toContain('Loading maps…')
  })

  it('renders map thumbnails in an independently scrolling list', () => {
    const item: MapListItem = {
      imageUrl: 'blob:map-thumbnail',
      map: {
        id: 'map-1',
        worldId: 'world-1',
        filename: 'very-long-village-map-filename.png',
        mediaType: 'image/png',
        byteLength: 10,
        image: new Blob(['map']),
        gridSettings: DEFAULT_MAP_GRID_SETTINGS,
        rotation: 0,
        zoom: 1,
        addedAt: '2026-11-01T00:00:00.000Z',
      },
    }

    const html = renderToStaticMarkup(createElement(MapLibraryPanel, {
      maps: [item],
      selectedMapId: item.map.id,
      isLoading: false,
      onSelect: vi.fn(),
      onAddMap: vi.fn(),
    }))

    expect(html).toContain('data-slot="scroll-area-viewport"')
    expect(html).toContain('min-h-0 flex-1')
    expect(html).toContain('very-long-village-map-filename.png')
    expect(html).toContain('title="very-long-village-map-filename.png"')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('>1 image</span>')
    expect(html).toContain('min-w-0 w-full truncate')
    expect(html).toContain('flex flex-col items-stretch gap-2')
    expect(html).toContain('class="flex min-w-0 flex-col gap-1 rounded-lg p-1')
    expect(html).not.toContain('items-start gap-1')
    expect(html).not.toContain('aria-label="Delete very-long-village-map-filename.png"')
  })

  it('renders an empty-library state after a successful empty load', () => {
    const html = renderToStaticMarkup(createElement(MapLibraryPanel, {
      maps: [],
      selectedMapId: null,
      isLoading: false,
      onSelect: vi.fn(),
      onAddMap: vi.fn(),
    }))

    expect(html).toContain('No maps in this world yet')
    expect(html).toContain('Upload image')
  })

  it('uses the singular Russian count form', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('ru')
    const html = renderToStaticMarkup(createElement(MapLibraryPanel, {
      maps: [{
        imageUrl: 'blob:map-thumbnail',
        map: {
          id: 'map-1',
          worldId: 'world-1',
          filename: 'Карта.png',
          mediaType: 'image/png',
          byteLength: 10,
          image: new Blob(['map']),
          gridSettings: DEFAULT_MAP_GRID_SETTINGS,
          rotation: 0,
          zoom: 2.25,
          addedAt: '2026-11-01T00:00:00.000Z',
        },
      }],
      selectedMapId: 'map-1',
      isLoading: false,
      onSelect: vi.fn(),
      onAddMap: vi.fn(),
    }))

    expect(html).toContain('>1 изображение</span>')
  })

  it('does not show an empty-library state when map storage failed to load', () => {
    const html = renderToStaticMarkup(createElement(MapLibraryPanel, {
      maps: [],
      selectedMapId: null,
      isLoading: false,
      hasLoadError: true,
      onSelect: vi.fn(),
      onAddMap: vi.fn(),
    }))

    expect(html).toContain('Maps are unavailable until storage can be read')
    expect(html).not.toContain('No maps in this world yet')
  })

  it('renders a proportional map viewer with grid and fullscreen controls', () => {
    const item: MapListItem = {
      imageUrl: 'blob:map-image',
      map: {
        id: 'map-1',
        worldId: 'world-1',
        name: 'Old Village',
        filename: 'village.png',
        mediaType: 'image/png',
        byteLength: 10,
        image: new Blob(['map']),
        gridSettings: DEFAULT_MAP_GRID_SETTINGS,
        rotation: 0,
        zoom: 1,
        addedAt: '2026-11-01T00:00:00.000Z',
      },
    }

    const html = renderToStaticMarkup(createElement(MapViewer, {
      selectedMap: item,
      onGridSettingsChange: vi.fn(),
      onResetGridSettings: vi.fn(),
      onRotate: vi.fn(),
      onZoom: vi.fn(),
      onRemoveMap: vi.fn(),
      onRenameMap: vi.fn().mockResolvedValue(true),
    }))

    expect(html).toContain('object-contain')
    expect(html).toContain('Old Village')
    expect(html).not.toContain('>village.png</span>')
    expect(html).toContain('aria-label="Rename map"')
    expect(html).toContain('aria-label="Map actions"')
    expect(html).toContain('data-slot="dropdown-menu-trigger"')
    expect(html).not.toContain('aria-label="Delete village.png"')
    expect(html).not.toContain('data-slot="alert-dialog-trigger"')
    expect(html).not.toContain('bg-destructive')
    expect(html).not.toContain('aria-label="Toggle grid"')
    expect(html).toContain('aria-label="Grid settings"')
    expect(html).toContain('aria-label="Open fullscreen view"')
    expect(html).toContain('aria-label="Rotate clockwise 90 degrees"')
    expect(html).toContain('aria-label="Rotate counterclockwise 90 degrees"')
    expect(html).toContain('rotate(0deg) scale(1)')
    expect(html).not.toContain('aria-label="Zoom in"')
    expect(html).not.toContain('aria-label="Zoom out"')
    expect(html).not.toContain('data-slot="dialog"')
  })
})
