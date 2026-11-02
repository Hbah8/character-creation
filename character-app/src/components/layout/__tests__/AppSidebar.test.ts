import { describe, expect, it } from 'vitest'
import { NAV_ITEMS } from '../navigationItems'

describe('AppSidebar navigation', () => {
  it('uses the characters library as the single character navigation item', () => {
    const navItems: ReadonlyArray<{ labelKey: string; href: string }> = NAV_ITEMS
    const characterItems = navItems.filter(item =>
      item.labelKey === 'characters' || item.labelKey === 'overview'
    )

    expect(characterItems).toHaveLength(1)
    expect(characterItems[0]).toMatchObject({
      labelKey: 'characters',
      href: '/',
    })
    expect(navItems.some(item => item.href === '/creator')).toBe(false)
  })
})
