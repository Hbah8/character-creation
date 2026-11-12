import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { SoundEffectsPanel } from '@/audio/components/SoundEffectsPanel'
import { TooltipProvider } from '@/components/ui/tooltip'

describe('SoundEffectsPanel', () => {
  it('renders assigned sounds, separate menus, and the add control', () => {
    const html = renderToStaticMarkup(createElement(TooltipProvider, null, createElement(SoundEffectsPanel, {
      audio: {
        schemaVersion: 1,
        assets: [{ id: 'asset-1', filename: 'knock.wav', mediaType: 'audio/wav', byteLength: 4 }],
        tracks: [], scenes: [], presets: [],
        soundButtons: [{ id: 'button-1', assetId: 'asset-1' }],
      },
      availability: { 'asset-1': 'available' },
      onChange: vi.fn(),
      onPlaybackError: vi.fn(),
    })))
    expect(html).toContain('knock.wav')
    expect(html).toContain('aspect-square')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('data-slot="dropdown-menu-trigger"')
    expect(html).toContain('data-sound-effects')
  })
})
