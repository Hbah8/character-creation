import { describe, expect, it } from 'vitest'
import { filterCharactersByWorld } from '@/services/filterCharactersByWorld'

describe('filterCharactersByWorld', () => {
  const standalone = { id: 'standalone', character: {} }
  const first = { id: 'first', character: { worldId: 'world-a' } }
  const second = { id: 'second', character: { worldId: 'world-b' } }
  const entries = [second, standalone, first]

  it('shows only standalone characters when no world is selected', () => {
    expect(filterCharactersByWorld(entries, null)).toEqual([standalone])
  })

  it('shows only characters belonging to the selected world', () => {
    expect(filterCharactersByWorld(entries, 'world-a')).toEqual([first])
    expect(filterCharactersByWorld(entries, 'world-b')).toEqual([second])
  })

  it('does not fall back to all characters for an empty or missing world', () => {
    expect(filterCharactersByWorld(entries, 'empty-world')).toEqual([])
  })

  it('preserves record identity, order and the full account collection', () => {
    const another = { id: 'another', character: { worldId: 'world-a' } }
    const source = Object.freeze([...entries, another])
    const filtered = filterCharactersByWorld(source, 'world-a')
    expect(filtered).toEqual([first, another])
    expect(filtered[0]).toBe(first)
    expect(source).toEqual([...entries, another])
  })

  it('supports legacy empty world IDs as standalone records', () => {
    const legacy = { id: 'legacy', character: { worldId: '' } }
    expect(filterCharactersByWorld([legacy, first], null)).toEqual([legacy])
  })
})
