import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultWorld } from '@/world/data/defaultWorld'
import type { WorldLibraryEntry } from '@/world/services/worldLibraryService'
import type { AudioAsset, AudioScene, AudioTrack } from '@/world/types'
import { AudioTrackCard } from '@/audio/components/AudioMixerPanel'
import { AudioScenesPanel } from '@/audio/components/AudioScenesPanel'

const audioAsset: AudioAsset = {
  id: 'asset-1',
  filename: 'Rain on the roof.mp3',
  mediaType: 'audio/mpeg',
  byteLength: 2400,
  durationSeconds: 128,
}

const audioTrack: AudioTrack = {
  id: 'track-1',
  assetId: audioAsset.id,
  name: audioAsset.filename,
  loop: true,
  defaultVolume: 0.7,
}

const audioScene: AudioScene = {
  id: 'scene-1',
  name: 'Storm at the inn',
  trackIds: [audioTrack.id],
}

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

import { AudioSoundboardPage } from '@/audio/pages/AudioSoundboardPage'

describe('AudioSoundboardPage component integration', () => {
  function renderPage() {
    return renderToStaticMarkup(createElement(AudioSoundboardPage))
  }

  const worldEntry: WorldLibraryEntry = {
    id: 'world-1',
    savedAt: '2025-01-01T00:00:00.000Z',
    world: {
      ...getDefaultWorld('en'),
      name: 'Pine Hollow',
      audio: {
        ...getDefaultWorld('en').audio!,
        assets: [audioAsset],
        tracks: [audioTrack],
        scenes: [audioScene],
      },
    },
  }

  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  beforeEach(async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')
    mockUseWorldLibrary.mockReturnValue({
      entries: [worldEntry],
      activeWorldId: worldEntry.id,
      saveById: vi.fn(),
      setActiveWorldId: vi.fn(),
    })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders the world library, mixer controls, and saved scenes', () => {
    const html = renderPage()

    expect(html).toContain('Pine Hollow')
    expect(html).toContain('Audio library')
    expect(html).toContain(audioAsset.filename)
    expect(html).toContain('data-slot="badge"')
    expect(html).toContain('Active mixer')
    expect(html).toContain('Add files from the library to start mixing.')
    expect(html).toContain(audioScene.name)
    expect(html).toContain('aria-label="Remove scene"')
    expect(html).not.toMatch(/class="dark(?:\s|")/)
  })

  it('renders a volume range that includes zero', () => {
    const html = renderToStaticMarkup(createElement(AudioTrackCard, {
      track: audioTrack,
      isPlaying: false,
      onPlayPause: vi.fn(),
      onTrackChange: vi.fn(),
      onRemove: vi.fn(),
      onStop: vi.fn(),
      onDuck: vi.fn(),
    }))

    expect(html).toContain('type="range"')
    expect(html).toContain('min="0"')
    expect(html).toContain('max="100"')
  })

  it('marks only the selected scene active when scenes contain the same tracks', () => {
    const html = renderToStaticMarkup(createElement(AudioScenesPanel, {
      scenes: [
        { id: 'scene-1', name: 'Storm', trackIds: ['track-1'] },
        { id: 'scene-2', name: 'Dawn', trackIds: ['track-1'] },
      ],
      activeSceneId: 'scene-1',
      activeTrackIds: ['track-1'],
      sceneName: '',
      onSceneNameChange: vi.fn(),
      onSaveScene: vi.fn(),
      onActivateScene: vi.fn(),
      onRemoveScene: vi.fn(),
    }))

    expect(html.match(/>Active</g)).toHaveLength(1)
    expect(html.match(/>Restart</g)).toHaveLength(1)
    expect(html.match(/>Launch</g)).toHaveLength(1)
  })

  it('renders the empty-world state when no world is selected', () => {
    mockUseWorldLibrary.mockReturnValue({
      entries: [],
      activeWorldId: null,
      saveById: vi.fn(),
      setActiveWorldId: vi.fn(),
    })

    const html = renderPage()

    expect(html).toContain('No active world')
    expect(html).toContain('Create world')
    expect(html).not.toContain('Audio library')
    expect(html).not.toMatch(/class="dark(?:\s|")/)
  })
})
