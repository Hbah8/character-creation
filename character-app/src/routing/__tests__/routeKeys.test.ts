import { describe, expect, it } from 'vitest'
import { entityEditorKey } from '../routeKeys'

describe('entityEditorKey', () => {
  it('uses a distinct key for creating a new entity', () => {
    expect(entityEditorKey()).toBe('create')
  })

  it('uses the entity id for edit keys', () => {
    expect(entityEditorKey('abc')).toBe('edit:abc')
    expect(entityEditorKey('def')).toBe('edit:def')
  })

  it('does not reuse the create key for an entity named create', () => {
    expect(entityEditorKey('create')).toBe('edit:create')
  })
})
