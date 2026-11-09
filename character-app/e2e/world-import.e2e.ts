import { expect, test } from '@playwright/test'
import { getDefaultWorld } from '../src/world/data/defaultWorld'

test('world import survives session verification when the file picker returns focus', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  let holdSession = false
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/auth/me', async route => {
    if (holdSession) await pending
    await route.fulfill({ json: {
      id: 'import-owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z',
    } })
  })
  await page.route('**/api/worlds', route => route.fulfill({ json: [] }))
  await page.goto('/worlds/new')
  await expect(page.locator('#world-name')).toHaveValue('New World')

  holdSession = true
  const checking = page.waitForRequest('**/api/auth/me')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await checking
  try {
    // The native picker delivers its file to this existing input after focus returns.
    await expect(page.locator('input[type="file"]')).toHaveCount(1)
    await page.locator('input[type="file"]').setInputFiles({
      name: 'imported-world.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ ...getDefaultWorld('en'), name: 'Imported world' })),
    })
  } finally {
    holdSession = false
    release()
  }
  await expect(page.locator('#world-name')).toHaveValue('Imported world')
  await page.locator('#world-name').fill('Edited imported world')
  const checked = page.waitForResponse('**/api/auth/me')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await checked
  await expect(page.locator('#world-name')).toHaveValue('Edited imported world')
  const visibleCheck = page.waitForResponse('**/api/auth/me')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await visibleCheck
  await expect(page.locator('#world-name')).toHaveValue('Edited imported world')
})

test('background session verification still removes the editor after expiry or an account change', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  let accountId: string | null = 'first-owner'
  await page.route('**/api/auth/me', route => route.fulfill(accountId
    ? { json: { id: accountId, email: `${accountId}@example.test`, expiresAt: '2099-01-01T00:00:00Z' } }
    : { status: 401 }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [] }))
  await page.goto('/worlds/new')
  await page.locator('#world-name').fill('Private draft')
  accountId = 'second-owner'
  const checked = page.waitForResponse('**/api/auth/me')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await checked
  await expect(page.locator('#world-name')).toHaveValue('New World')
  accountId = null
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('#world-name')).toHaveCount(0)
})
