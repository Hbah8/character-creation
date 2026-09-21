import { describe, expect, it } from 'vitest'
import { buildHandbookEntry } from '@/handbooks/services/buildHandbookEntry'

describe('buildHandbookEntry', () => {
  it('builds a complete custom edge record', () => {
    expect(buildHandbookEntry('edge', 'fleet-footed', undefined, {
      name: 'Fleet-Footed',
      description: '',
      type: 'Background',
    })).toMatchObject({
      mode: 'custom',
      handbookCategory: 'edge',
      id: 'fleet-footed',
    })
  })

  it('builds an explicit override from a partial diff', () => {
    expect(buildHandbookEntry('edge', 'level-headed', {
      id: 'level-headed',
      name: 'Level Headed',
      description: '',
      type: 'Combat',
    }, {
      name: 'House Rule',
    })).toEqual({
      mode: 'override',
      handbookCategory: 'edge',
      id: 'level-headed',
      name: 'House Rule',
    })
  })
})