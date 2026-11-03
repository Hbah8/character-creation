import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildShareUrl } from '@/services/shareService'

afterEach(() => vi.unstubAllGlobals())

describe('buildShareUrl', () => {
  it('builds a share URL from the active Vite base path', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://app.example.test' },
    })

    expect(buildShareUrl('shared-character')).toBe(
      'https://app.example.test/creator#shared-character',
    )
  })
})
