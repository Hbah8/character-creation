import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import { enDefaultCharacter } from '../src/i18n/locales/en/defaults'
import { getDefaultWorld } from '../src/world/data/defaultWorld'

async function setup(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('swade-locale', 'en')
    localStorage.setItem('swade-welcome-seen', 'true')
  })
  await context.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'draft-owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await context.route('**/api/worlds', route => route.fulfill({ json: [] }))
}

test('a new local draft can be continued from the library without duplicating it', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/')
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await page.getByLabel('Callsign', { exact: true }).fill('Unfinished scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Unfinished scout', { exact: true })).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue editing', exact: true }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Unfinished scout')
  await page.getByLabel('Callsign', { exact: true }).fill('Edited scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Edited scout', { exact: true })).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(1)
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Restore draft', exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Callsign', { exact: true })).not.toHaveValue('Edited scout')
})

test('independent edits in two tabs remain separate draft versions', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Original')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('button', { name: 'Continue editing' })).toBeVisible()
  const second = await context.newPage()
  await second.goto('/')
  await page.getByRole('button', { name: 'Continue editing' }).click()
  await second.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Original')
  await expect(second.getByLabel('Callsign', { exact: true })).toHaveValue('Original')
  const observer = await context.newPage()
  await observer.goto('/')
  await expect(observer.getByText('Draft', { exact: true })).toHaveCount(1)
  await page.getByLabel('Callsign', { exact: true }).fill('First tab')
  await second.getByLabel('Callsign', { exact: true }).fill('Second tab')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('First tab', { exact: true })).toBeVisible()
  await expect(page.getByText('Second tab', { exact: true })).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(2)
})

test('saving keeps edits made while the server request is pending', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  let release: () => void = () => { throw new Error('request not received') }
  const waiting = new Promise<void>(resolve => { release = resolve })
  let saved: { id: string; version: number; createdAt: string; updatedAt: string; character: unknown } | null = null
  await context.route('**/api/characters', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: saved ? [saved] : [] })
      return
    }
    const body = route.request().postDataJSON() as { id: string; character: unknown }
    await waiting
    saved = {
      id: body.id, version: 1, createdAt: '2026-11-20T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z', character: body.character,
    }
    await route.fulfill({ status: 201, json: saved, headers: { ETag: '"1"' } })
  })

  await context.route('**/api/characters/*', route => {
    if (!saved) throw new Error('character not saved')
    return route.fulfill({ json: saved, headers: { ETag: '"1"' } })
  })
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Submitted')
  const request = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/api/characters'))
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await request
  await page.getByLabel('Callsign', { exact: true }).fill('Edited during save')
  const response = page.waitForResponse(res => res.request().method() === 'POST' && res.url().endsWith('/api/characters'))
  release()
  await response
  await expect(page).toHaveURL(/\/creator\/[^/?]+\?draft=/)
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Edited during save')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Edited during save', { exact: true })).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(1)
  await expect(page.getByText('Submitted', { exact: true }).first()).toBeVisible()
})

test('a confirmed save removes its local draft', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  let saved: { id: string; version: number; createdAt: string; updatedAt: string; character: unknown } | null = null
  await context.route('**/api/characters', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: saved ? [saved] : [] })
    const body = route.request().postDataJSON() as { id: string; character: unknown }
    saved = { ...body, version: 1, createdAt: '2026-11-20T00:00:00Z', updatedAt: '2026-11-20T00:00:00Z' }
    return route.fulfill({ status: 201, json: saved, headers: { ETag: '"1"' } })
  })
  await context.route('**/api/characters/*', route => {
    if (!saved) throw new Error('character not saved')
    return route.fulfill({ json: saved, headers: { ETag: '"1"' } })
  })
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Saved scout')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page).toHaveURL(/\/creator\/[^/?]+$/)
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Saved scout', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(0)
  const count = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('swade-character-drafts')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const countRequest = database.transaction('drafts').objectStore('drafts').count()
      countRequest.onsuccess = () => { resolve(countRequest.result); database.close() }
      countRequest.onerror = () => reject(countRequest.error)
    }
  }))
  expect(count).toBe(0)
})

test('a stale saved-character draft does not overwrite the current server version', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  let version = 1
  const record = () => ({
    id: 'existing', version, createdAt: '2026-11-20T00:00:00Z', updatedAt: '2026-11-20T00:00:00Z',
    character: { ...enDefaultCharacter, callsign: version === 1 ? 'Server original' : 'Other changes' },
  })
  await context.route('**/api/characters', route => route.fulfill({ json: [record()] }))
  let sentVersion = ''
  await context.route('**/api/characters/existing', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: record(), headers: { ETag: `"${version}"` } })
    }
    sentVersion = route.request().headers()['if-match'] ?? ''
    return route.fulfill({ status: 409, json: { code: 'conflict' } })
  })
  await page.goto('/creator/existing')
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Server original')
  await page.getByLabel('Callsign', { exact: true }).fill('Local changes')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('button', { name: 'Continue editing' })).toBeVisible()
  version = 2
  await page.reload()
  await page.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Local changes')
  await expect(page.getByText('The server version changed', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('This character changed in another browser', { exact: false }).first()).toBeVisible()
  expect(sentVersion).toBe('"1"')
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Local changes')
})

test('a draft of a deleted character remains editable without recreating it automatically', async ({ context, page }) => {
  await setup(context)
  let deleted = false
  let creates = 0
  let createdId = ''
  let created: { id: string; version: number; createdAt: string; updatedAt: string; character: unknown } | null = null
  const record = {
    id: 'existing', version: 1, createdAt: '2026-11-20T00:00:00Z', updatedAt: '2026-11-20T00:00:00Z',
    character: { ...enDefaultCharacter, callsign: 'Server original' },
  }
  await context.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await context.route('**/api/characters', route => {
    if (route.request().method() === 'POST') {
      creates++
      const body = route.request().postDataJSON() as { id: string; character: unknown }
      createdId = body.id
      created = { ...body, version: 1, createdAt: record.createdAt, updatedAt: record.updatedAt }
      return route.fulfill({
        status: 201, headers: { ETag: '"1"' },
        json: created,
      })
    }
    return route.fulfill({ json: created ? [created] : deleted ? [] : [record] })
  })
  await context.route('**/api/characters/*', route => {
    if (created && route.request().url().endsWith(`/${created.id}`)) {
      return route.fulfill({ json: created, headers: { ETag: '"1"' } })
    }
    return route.fallback()
  })
  await context.route('**/api/characters/existing', route => deleted
    ? route.fulfill({ status: 404, json: { code: 'notFound' } })
    : route.fulfill({ json: record, headers: { ETag: '"1"' } }))
  await page.goto('/creator/existing')
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Server original')
  await page.getByLabel('Callsign', { exact: true }).fill('Local work')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('button', { name: 'Continue editing' })).toBeVisible()
  deleted = true
  await page.reload()
  await page.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Local work')
  await expect(page.getByRole('button', { name: 'Save as new', exact: true })).toBeVisible()
  expect(creates).toBe(0)
  await page.getByRole('button', { name: 'Save as new', exact: true }).click()
  await expect(page).toHaveURL(/\/creator\/[^/?]+$/)
  expect(creates).toBe(1)
  expect(createdId).not.toBe('existing')
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Local work')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Local work', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(0)
})

test('a missing draft cannot silently turn into a new character', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator?draft=missing')
  await expect(page.getByText('This draft is no longer available', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0)
})

test('unavailable browser storage warns while the editor remains usable', async ({ context, page }) => {
  await setup(context)
  await context.addInitScript(() => Object.defineProperty(window, 'indexedDB', { value: undefined }))
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Still editable')
  await expect(page.getByText('Automatic draft recovery is unavailable', { exact: false })).toBeVisible()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Still editable')
})

test('local drafts remain visible when the character service is unavailable', async ({ context, page }) => {
  await setup(context)
  let unavailable = false
  await context.route('**/api/characters', route => unavailable
    ? route.fulfill({ status: 503 })
    : route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Offline scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Offline scout', { exact: true })).toBeVisible()
  unavailable = true
  await page.reload()
  await expect(page.getByText('Offline scout', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Offline scout')
})

test('creating a different character from the editor preserves the first draft', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('First scout')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('dialog', { name: 'Character Library' }).getByRole('button', { name: 'New Character' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'New Character' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).not.toHaveValue('First scout')
  await page.getByLabel('Callsign', { exact: true }).fill('Second scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('First scout', { exact: true })).toBeVisible()
  await expect(page.getByText('Second scout', { exact: true })).toBeVisible()
})

test('the editor library opens the selected draft and shows a local-storage warning tooltip', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Library scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Library scout', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Character Library' })
  await expect(dialog.getByText('Library scout', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'This draft is stored only in this browser and is not saved to the server.' }).hover()
  await expect(page.getByRole('tooltip')).toContainText('only in this browser')
  await dialog.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Library scout')
})

test('an unchanged editor creates no draft and drafts are scoped to the account', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await page.getByLabel('Callsign', { exact: true }).fill('Private draft')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Private draft', { exact: true })).toBeVisible()
  await context.unroute('**/api/auth/me')
  await context.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'another-owner', email: 'another@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Private draft', { exact: true })).toHaveCount(0)
})

test('automatic world association does not create an empty draft and world filtering applies', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/worlds', route => route.fulfill({ json: [{
    id: 'world-a', version: 1, createdAt: '2026-11-20T00:00:00Z', updatedAt: '2026-11-20T00:00:00Z',
    world: { ...getDefaultWorld('en'), name: 'World Alpha' },
  }] }))
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/')
  await page.getByRole('button', { name: '—', exact: true }).click()
  await page.getByRole('menuitem', { name: 'World Alpha' }).click()
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await page.getByLabel('Callsign', { exact: true }).fill('World scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('World scout', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'World Alpha', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Без мира' }).click()
  await expect(page.getByText('World scout', { exact: true })).toHaveCount(0)
})

test('switching drafts from a dirty editor requires confirmation', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('First scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('First scout', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New Character', exact: true }).first().click()
  await page.getByLabel('Callsign', { exact: true }).fill('Second scout')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Character Library' })
  const item = dialog.getByText('First scout', { exact: true }).locator('..').locator('..')
  await item.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('unsaved changes')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Second scout')
  await item.getByRole('button', { name: 'Continue editing' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('First scout')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Second scout', { exact: true })).toBeVisible()
})

test('unsaved changes remain available from the library after reload', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Reload scout')
  await page.reload()
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Reload scout', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue editing' }).click()
  await expect(page.getByLabel('Callsign', { exact: true })).toHaveValue('Reload scout')
})

test('deleting a changed draft fails visibly without deleting the newer revision', async ({ context, page }) => {
  await setup(context)
  await context.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Old draft')
  await page.locator('button[title="Назад к обзору"]').click()
  await expect(page.getByRole('heading', { name: 'SWADE Characters' })).toBeVisible()
  await expect(page.getByText('Old draft', { exact: true })).toBeVisible()
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('swade-character-drafts')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const tx = database.transaction('drafts', 'readwrite')
      const store = tx.objectStore('drafts')
      const read = store.getAll()
      read.onsuccess = () => {
        const draft = read.result[0] as { revision: number; character: { callsign: string } }
        store.put({ ...draft, revision: draft.revision + 1, character: { ...draft.character, callsign: 'Newer draft' } })
      }
      tx.oncomplete = () => { database.close(); resolve() }
      tx.onabort = () => reject(tx.error)
    }
  }))
  await page.getByRole('button', { name: 'Delete draft' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('This draft changed in another tab', { exact: false })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Newer draft', { exact: true })).toBeVisible()
})
