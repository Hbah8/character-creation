import { describe, expect, it } from 'vitest'
import { RouteErrorBoundary } from '../RouteErrorBoundary'

describe('RouteErrorBoundary', () => {
  it('switches to the error state when a page throws', () => {
    const error = new Error('page failed')

    expect(RouteErrorBoundary.getDerivedStateFromError(error)).toEqual({ error })
  })
})
