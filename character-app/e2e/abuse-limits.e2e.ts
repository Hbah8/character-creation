import { expect, test } from '@playwright/test'

for (const locale of ['en', 'ru'] as const) {
  test(`closed registration explains the refusal without advancing to email confirmation (${locale})`, async ({ page }) => {
    await page.addInitScript(language => localStorage.setItem('swade-locale', language), locale)
    await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
    await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
    await page.route('**/api/auth/register', route => route.fulfill({
      status: 403, json: { code: 'registrationClosed' },
    }))
    await page.goto('/login')
    await page.getByRole('button', { name: locale === 'en' ? 'Create an account' : 'Создать аккаунт', exact: true }).click()
    await page.getByLabel('Email', { exact: true }).fill('player@example.test')
    const password = page.getByLabel(locale === 'en' ? 'Password' : 'Пароль', { exact: true })
    await password.fill('correct horse battery staple')
    await page.getByRole('button', { name: locale === 'en' ? 'Register' : 'Зарегистрироваться', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(
      locale === 'en' ? 'Registration is closed' : 'Регистрация закрыта',
    )
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('player@example.test')
    await expect(password).toHaveValue('')
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Registration' : 'Регистрация', exact: true })).toBeVisible()
  })

  test(`quota refusals retain both world and character form drafts (${locale})`, async ({ page }) => {
    await page.addInitScript(language => {
      localStorage.setItem('swade-locale', language)
      localStorage.setItem('swade-welcome-seen', 'true')
    }, locale)
    await page.route('**/api/auth/me', route => route.fulfill({ json: {
      id: 'quota-owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z',
    } }))
    await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
    await page.route('**/api/worlds', route => route.fulfill(route.request().method() === 'GET'
      ? { json: [] }
      : { status: 409, json: { code: 'worldLimitReached' } }))
    await page.route('**/api/characters', route => route.fulfill(route.request().method() === 'GET'
      ? { json: [] }
      : { status: 409, json: { code: 'standaloneCharacterLimitReached' } }))
    const save = locale === 'en' ? 'Save' : 'Сохранить'
    await page.goto('/worlds/new')
    await page.locator('#world-name').fill('World draft at quota')
    await page.getByRole('button', { name: save, exact: true }).click()
    await expect(page.getByRole('alert').first()).toContainText(
      locale === 'en' ? 'world limit' : 'лимит миров',
    )
    await expect(page.locator('#world-name')).toHaveValue('World draft at quota')
    await expect(page).toHaveURL(/\/worlds\/new$/)
    await page.goto('/creator')
    await page.locator('#callsign:visible').fill('Character draft at quota')
    await page.getByRole('button', { name: save, exact: true }).click()
    await expect(page.getByRole('alert').first()).toContainText(
      locale === 'en' ? 'standalone character limit' : 'лимит персонажей без мира',
    )
    await expect(page.locator('#callsign:visible')).toHaveValue('Character draft at quota')
    await expect(page).toHaveURL(/\/creator$/)
  })
}
