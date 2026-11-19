import { expect, test } from '@playwright/test'
import { getDefaultWorld } from '../src/world/data/defaultWorld'
import { enDefaultCharacter } from '../src/i18n/locales/en/defaults'

for (const [appTheme, systemTheme] of [
  ['light', 'light'],
  ['light', 'dark'],
  ['dark', 'light'],
  ['dark', 'dark'],
] as const) {
  test(`toast description remains readable in ${appTheme} theme with ${systemTheme} system preference`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: systemTheme })
    await page.addInitScript(() => {
      localStorage.setItem('swade-locale', 'ru')
      localStorage.setItem('swade-welcome-seen', 'true')
    })
    await page.route('**/api/auth/me', route => route.fulfill({
      json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
    }))
    await page.route('**/api/characters', route => route.fulfill({ json: [] }))
    await page.route('**/api/worlds', route => route.fulfill({ json: [{
      id: 'world-1', version: 1, createdAt: '2026-11-08T00:00:00Z',
      updatedAt: '2026-11-08T00:00:00Z', world: { ...getDefaultWorld('ru'), name: 'Тестовый мир' },
    }] }))
    await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
    await page.route('**/api/worlds/world-1', route => route.fulfill({
      status: 409, json: { code: 'referencedResource' },
    }))
    await page.goto('/worlds')
    await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), appTheme)

    async function checkError() {
      await page.getByRole('button', { name: 'Удалить мир' }).click()
      const toast = page.locator('[data-sonner-toast][data-type="error"]')
      const description = toast.locator('[data-description]')
      await expect(description).toHaveText('Этот мир используется персонажем или другой записью. Перед удалением или изменением удалите или обновите связи.')
      await expect(toast).toHaveCSS('opacity', '1')
      await expect(toast.locator('[data-content]')).toHaveCSS('opacity', '1')
      const measured = await description.evaluate(element => {
        const toastElement = element.closest('[data-sonner-toast]')
        if (!toastElement) throw new Error('Toast container missing')
        const style = getComputedStyle(element)
        const toastStyle = getComputedStyle(toastElement)
        const context = document.createElement('canvas').getContext('2d')
        if (!context) throw new Error('Canvas context unavailable')
        function luminance(color: string) {
          if (!context) throw new Error('Canvas context unavailable')
          context.clearRect(0, 0, 1, 1)
          context.fillStyle = color
          context.fillRect(0, 0, 1, 1)
          const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
            const channel = value / 255
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
        }
        const foreground = luminance(style.color)
        const background = luminance(toastStyle.backgroundColor)
        return {
          color: style.color,
          background: toastStyle.backgroundColor,
          opacity: style.opacity,
          rootClass: document.documentElement.className,
          rootPopover: getComputedStyle(document.documentElement).getPropertyValue('--popover'),
          toastPopover: toastStyle.getPropertyValue('--popover'),
          sonnerTheme: toastElement.closest('[data-sonner-toaster]')?.getAttribute('data-sonner-theme'),
          contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        }
      })
      expect(measured.opacity).toBe('1')
      expect(measured.contrast, JSON.stringify(measured)).toBeGreaterThanOrEqual(4.5)
      return toast
    }

    const firstToast = await checkError()
    await firstToast.getByRole('button', { name: 'Закрыть' }).click()
    await page.getByRole('link', { name: 'Персонажи', exact: true }).click()
    await page.getByRole('button', { name: 'Новый персонаж', exact: true }).first().click()
    await expect(page.locator('button[title="Назад к обзору"]')).toBeVisible()
    await page.locator('button[title="Назад к обзору"]').click()
    await page.getByRole('link', { name: 'Миры', exact: true }).click()
    await checkError()
    if (appTheme !== systemTheme) {
      await page.screenshot({ path: testInfo.outputPath(`${appTheme}-toast.png`), animations: 'disabled' })
    }
  })
}

test('a failed world deletion appears as a bottom-right toast without moving the page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  const record = {
    id: 'world-1',
    version: 1,
    createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z',
    world: { ...getDefaultWorld('en'), name: 'Test world' },
  }
  await page.route('**/api/worlds', route => route.fulfill({ json: [record] }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await page.route('**/api/worlds/world-1', route => route.fulfill({
    status: 409, json: { code: 'referencedResource' },
  }))

  await page.goto('/worlds')
  const heading = page.getByRole('heading', { name: 'Worlds', exact: true })
  await expect(heading).toBeVisible()
  const top = (await heading.boundingBox())!.y
  await page.getByRole('button', { name: 'Delete world', exact: true }).click()

  const message = page.getByText('This world is still used by a character or another record. Remove or update those links before deleting or changing it.')
  await expect(message).toBeVisible()
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toHaveAttribute('data-type', 'error')
  await expect(toast).toHaveAttribute('data-styled', 'true')
  await expect(toast.locator('[data-title]')).toHaveText('Error')
  await expect(toast.locator('[data-description]')).toHaveText(await message.textContent() ?? '')
  await expect(toast.locator('[data-icon]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toHaveCount(0)
  expect((await heading.boundingBox())!.y).toBe(top)
  const box = (await message.boundingBox())!
  const viewport = page.viewportSize()!
  expect(box.x + box.width / 2).toBeGreaterThan(viewport.width / 2)
  expect(box.y + box.height / 2).toBeGreaterThan(viewport.height / 2)
  await expect(page.getByRole('heading', { name: 'Test world' })).toBeVisible()
})

test('a world save conflict keeps overwrite and reload actions available', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  const record = {
    id: 'world-1',
    version: 1,
    createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z',
    world: { ...getDefaultWorld('en'), name: 'Test world' },
  }
  await page.route('**/api/worlds', route => route.fulfill({ json: [record] }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await page.route('**/api/worlds/world-1', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { ...record, version: 2 }, headers: { ETag: '"2"' } })
    : route.fulfill({ status: 409, json: { code: 'conflict' } }))

  await page.goto('/worlds/world-1')
  await page.locator('#world-name').fill('Local changes')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('This world changed in another browser', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Resolve conflict' }).click()
  const choices = page.getByRole('alertdialog')
  await expect(choices.getByRole('button', { name: 'Reload latest' })).toBeVisible()
  await choices.getByRole('button', { name: 'Overwrite latest' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('server version 2')
  await expect(page.locator('#world-name')).toHaveValue('Local changes')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Resolve conflict' }).click()
  await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Reload latest' })).toBeVisible()
})

test('a failed world deletion reports the deletion failure and offers a retry', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  const record = {
    id: 'world-1',
    version: 1,
    createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z',
    world: { ...getDefaultWorld('en'), name: 'Test world' },
  }
  await page.route('**/api/worlds', route => route.fulfill({ json: [record] }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await page.route('**/api/worlds/world-1', route => route.fulfill({ status: 503 }))
  await page.goto('/worlds')
  await page.getByRole('button', { name: 'Delete world', exact: true }).click()
  await expect(page.getByText('The server could not delete the world. Try again.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
})

test('account operation failures use the same corner without shifting the account page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [] }))
  await page.route('**/api/auth/sessions', route => route.fulfill({ json: [] }))
  await page.goto('/account')
  const heading = page.getByRole('heading', { name: 'Account', exact: true })
  await expect(heading).toBeVisible()
  const top = (await heading.boundingBox())!.y
  await page.unroute('**/api/auth/sessions')
  await page.route('**/api/auth/sessions', route => route.fulfill({ status: 503 }))
  await page.getByRole('button', { name: 'Refresh sessions' }).click()
  const message = page.getByText('Account service is unavailable. Try again later.')
  await expect(message).toBeVisible()
  expect((await heading.boundingBox())!.y).toBe(top)
  const box = (await message.boundingBox())!
  expect(box.y + box.height / 2).toBeGreaterThan(page.viewportSize()!.height / 2)
})

test('a real offline account request displays a standard localized error', async ({ page, context }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'ru'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [] }))
  await page.route('**/api/auth/sessions', route => route.fulfill({ json: [] }))
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Аккаунт' })).toBeVisible()
  await page.unroute('**/api/auth/sessions')
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Обновить сессии' }).click()
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toHaveAttribute('data-type', 'error')
  await expect(toast).toHaveCSS('opacity', '1')
  await expect(toast.locator('[data-title]')).toHaveText('Ошибка')
  await expect(toast.locator('[data-description]')).toHaveText('Сервис аккаунтов недоступен. Попробуйте позже.')
  const box = (await toast.boundingBox())!
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  await page.screenshot({ path: testInfo.outputPath('offline-account-error.png'), animations: 'disabled' })
})

test('sign-in failure is shown as a toast without moving the form', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await page.route('**/api/auth/login', route => route.fulfill({ status: 503 }))
  await page.goto('/login')
  const heading = page.getByRole('heading', { name: 'Sign in' })
  await expect(heading).toBeVisible()
  const top = (await heading.boundingBox())!.y
  await page.getByLabel('Email').fill('owner@example.test')
  await page.getByLabel('Password', { exact: true }).fill('password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  const message = page.getByText('Account service is unavailable. Try again later.')
  await expect(message).toBeVisible()
  expect((await heading.boundingBox())!.y).toBe(top)
  expect((await message.boundingBox())!.y).toBeGreaterThan(page.viewportSize()!.height / 2)
})

test('a failed character deletion keeps the list visible and shows a single error', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('swade-locale', 'en')
    localStorage.setItem('swade-welcome-seen', 'true')
  })
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [] }))
  await page.route('**/api/characters', route => route.fulfill({ json: [{
    id: 'character-1', version: 1, createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z', character: { ...enDefaultCharacter, callsign: 'Test scout' },
  }] }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await page.route('**/api/characters/character-1', route => route.fulfill({ status: 503 }))
  await page.goto('/')
  const card = page.locator('[data-slot="card"]').filter({ hasText: 'Test scout' }).last()
  await card.getByRole('button').click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('The server could not delete the character. Try again.')).toBeVisible()
  await expect(card).toBeVisible()
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1)
})

test('the same audio error appears again after its toast was closed', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('swade-locale', 'en')
    localStorage.setItem('swade-welcome-seen', 'true')
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined })
  })
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/characters', route => route.fulfill({ json: [] }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [{
    id: 'world-1', version: 1, createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z', world: { ...getDefaultWorld('en'), name: 'Test world' },
  }] }))
  await page.goto('/')
  await page.getByRole('button', { name: '—', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Test world' }).click()
  await page.getByRole('link', { name: 'Audio', exact: true }).click()
  const add = page.getByRole('button', { name: 'Add audio' })
  await add.click()
  const message = page.getByText('This browser cannot keep access to selected files.', { exact: false })
  await expect(message).toBeVisible()
  await page.locator('[data-sonner-toast]').getByRole('button', { name: 'Close' }).click()
  await expect(message).not.toBeVisible()
  await add.click()
  await expect(message).toBeVisible()
})

test('a failed character load is not reported as a deletion failure', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('swade-locale', 'en')
    localStorage.setItem('swade-welcome-seen', 'true')
  })
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', approved: true, expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [] }))
  await page.route('**/api/characters', route => route.fulfill({ json: [{
    id: 'character-1', version: 1, createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z', character: { ...enDefaultCharacter, callsign: 'Test scout' },
  }] }))
  await page.route('**/api/characters/character-1', route => route.fulfill({ status: 503 }))
  await page.goto('/creator')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('dialog', { name: 'Character Library' }).getByRole('button', { name: 'Load' }).click()
  await expect(page.getByText('The server could not load the character. Try again.')).toBeVisible()
  await page.locator('[data-sonner-toast]').getByRole('button', { name: 'Close' }).click({ timeout: 5000 })
})
