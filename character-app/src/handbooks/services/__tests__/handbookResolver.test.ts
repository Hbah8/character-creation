import { describe, it, expect } from 'vitest'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { Edge } from '@/types/handbook'

const systemEdges: Edge[] = [
  { id: 'level-headed', name: 'Level Headed', description: 'Draw two action cards, choose one.', type: 'Combat' },
  { id: 'marksman', name: 'Marksman', description: '+2 to Shooting if you did not move.', type: 'Combat' },
]

describe('resolveHandbookEntries', () => {
  it('returns all system entries tagged system when worldHandbook is empty', () => {
    const result = resolveHandbookEntries('edge', [], systemEdges)

    expect(result).toHaveLength(2)
    expect(result[0].source).toBe('system')
    expect(result[1].source).toBe('system')
  })

  it('preserves all system entry fields when worldHandbook is empty', () => {
    const result = resolveHandbookEntries('edge', [], systemEdges)

    expect(result[0].id).toBe('level-headed')
    expect(result[0].name).toBe('Level Headed')
    expect(result[0].description).toBe('Draw two action cards, choose one.')
    expect(result[0].type).toBe('Combat')
  })

  it('shadows a system entry when a world override matches by id', () => {
    const result = resolveHandbookEntries('edge', [
      { id: 'level-headed', category: 'edge', name: 'Level Headed (House Rule)' },
    ], systemEdges)

    const shadowed = result.find(e => e.id === 'level-headed')!
    expect(shadowed.name).toBe('Level Headed (House Rule)')
    expect(shadowed.source).toBe('world')
  })

  it('preserves system fields not provided by the override', () => {
    const result = resolveHandbookEntries('edge', [
      { id: 'level-headed', category: 'edge', name: 'Level Headed (House Rule)' },
    ], systemEdges)

    const shadowed = result.find(e => e.id === 'level-headed')!
    expect(shadowed.description).toBe('Draw two action cards, choose one.')
    expect(shadowed.type).toBe('Combat')
  })

  it('leaves non-overridden system entries tagged system', () => {
    const result = resolveHandbookEntries('edge', [
      { id: 'level-headed', category: 'edge', name: 'Level Headed (House Rule)' },
    ], systemEdges)

    const untouched = result.find(e => e.id === 'marksman')!
    expect(untouched.name).toBe('Marksman')
    expect(untouched.source).toBe('system')
  })

  it('appends world-only entries after system entries and tags them world', () => {
    const result = resolveHandbookEntries('edge', [
      { id: 'world-edge-1', category: 'edge', name: 'Custom Edge', description: 'World-specific.', type: 'Weird' },
    ], systemEdges)

    expect(result).toHaveLength(3)
    expect(result[2].id).toBe('world-edge-1')
    expect(result[2].name).toBe('Custom Edge')
    expect(result[2].source).toBe('world')
  })

  it('ignores world entries of a different category', () => {
    const result = resolveHandbookEntries('edge', [
      { id: 'bloodthirsty', category: 'hindrance', name: 'Bloodthirsty', type: 'Major' },
    ], systemEdges)

    expect(result).toHaveLength(2)
    expect(result.every(e => e.source === 'system')).toBe(true)
  })

  it('returns empty array when systemData is empty and worldHandbook is empty', () => {
    const result = resolveHandbookEntries('edge', [], [])

    expect(result).toHaveLength(0)
  })

  it('returns only world entries when systemData is empty but worldHandbook has entries', () => {
    const result = resolveHandbookEntries<Edge>('edge', [
      { id: 'world-edge-1', category: 'edge', name: 'Custom Edge', description: 'World-specific.', type: 'Weird' },
    ], [])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('world-edge-1')
    expect(result[0].source).toBe('world')
  })
})
