import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  enterMapFullscreen,
  exitMapFullscreen,
} from '@/maps/services/mapFullscreenService'

describe('mapFullscreenService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests browser fullscreen for the map viewer element', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const element = { requestFullscreen } as unknown as HTMLElement

    await enterMapFullscreen(element)

    expect(requestFullscreen).toHaveBeenCalledOnce()
  })

  it('exits browser fullscreen when a map is currently fullscreen', async () => {
    const exitFullscreen = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('document', { fullscreenElement: {}, exitFullscreen })

    await exitMapFullscreen()

    expect(exitFullscreen).toHaveBeenCalledOnce()
  })
})
