import { expect, test } from '@playwright/test'
import type { Page, APIRequestContext } from '@playwright/test'

const password = 'correct horse battery staple'
const appUrl = `http://localhost:${process.env.ACCOUNTS_UI_PORT ?? '5173'}`

test('registration and resend reject incomplete domains inline without requests or advancing', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'test-csrf' } }))
  let submissions = 0
  await page.route(/\/api\/auth\/(register|resend)$/, route => {
    submissions++
    return route.fulfill({ status: 202 })
  })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Create an account', exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill(password)
  for (const address of ['test@test', 'test@localhost', 'test@-example.com', 'test@example-.com', 'test@exam..com']) {
    await page.getByLabel('Email', { exact: true }).fill(address)
    await page.getByRole('button', { name: 'Register', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Enter an email with a full domain, for example user@example.com.')
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('heading', { name: 'Registration', exact: true })).toBeVisible()
    expect(submissions).toBe(0)
  }
  await page.getByLabel('Email', { exact: true }).fill('user+tag@sub.example.test')
  await page.getByRole('button', { name: 'Register', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible()
  expect(submissions).toBe(1)
  await page.getByLabel('Email', { exact: true }).fill('test@test')
  await page.getByRole('button', { name: 'Resend confirmation', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter an email with a full domain, for example user@example.com.')
  expect(submissions).toBe(1)
  await page.getByLabel('Email', { exact: true }).fill('user@example.com')
  await page.getByRole('button', { name: 'Resend confirmation', exact: true }).click()
  await expect.poll(() => submissions).toBe(2)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

async function signIn(page: Page, email: string) {
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

async function confirmationLink(request: APIRequestContext, email: string) {
  let link = ''
  await expect.poll(async () => {
    const response = await request.get('http://localhost:8025/api/v1/messages')
    const inbox = await response.json() as { messages: { ID: string; To: { Address: string }[] }[] }
    const letter = inbox.messages.find(message => message.To.some(to => to.Address === email))
    if (!letter) return false
    const body = await (await request.get(`http://localhost:8025/api/v1/message/${letter.ID}`)).json() as { Text: string }
    link = body.Text.match(/http:\/\/localhost:\d+\/(?:login|account)#token=[A-Za-z0-9_-]+/)?.[0] ?? ''
    return Boolean(link)
  }).toBe(true)
  return link
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
})

test('mandatory login, confirmation, deep-link return, refresh, session revoke and logout preserve local data', async ({ page, context, browser, request }) => {
  const email = `ui-${Date.now()}@example.test`
  await page.goto('/handbooks?view=edges#section')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
  await page.evaluate(() => {
    localStorage.setItem('swade-characters', '[ ]')
    localStorage.setItem('swade-worlds', '[ ]')
  })
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible()
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.getByLabel('Confirmation token')).toHaveCount(0)
  await page.getByRole('button', { name: 'Create an account', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Registration', exact: true })).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Register', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible()
  await expect(page.getByText('Follow the link in the email to confirm your address.')).toBeVisible()
  await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Back to sign in', exact: true }).click()
  await signIn(page, email)
  await expect(page.getByRole('alert')).toContainText('Confirm your email')
  await page.getByRole('button', { name: 'Resend confirmation', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible()
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(email)
  await page.getByRole('button', { name: 'Resend confirmation', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('If this address is eligible')
  const link = await confirmationLink(request, email)
  // Test compatibility with already-issued /account links as well.
  await page.goto(link.replace('/login#', '/account#'))
  await expect.poll(() => new URL(page.url()).hash.length).toBe(0)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('status')).toContainText('Email confirmed')
  await expect(page.getByLabel('Confirmation token')).toHaveCount(0)
  await page.getByRole('button', { name: 'Back to sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible()
  await page.goto('/handbooks?view=edges#section')
  await expect(page).toHaveURL(/\/login$/)
  await page.reload()
  await signIn(page, email)
  await expect(page).toHaveURL(`${appUrl}/handbooks?view=edges#section`)
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toBeVisible()
  await expect(page).toHaveURL(`${appUrl}/handbooks?view=edges#section`)
  await page.getByRole('link', { name: 'Account', exact: true }).click()
  await expect(page.getByText(email, { exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Register', exact: true })).toHaveCount(0)
  await expect(page.getByText('Current session', { exact: true })).toBeVisible()
  expect((await context.cookies()).find(value => value.name === 'SESSION')?.httpOnly).toBe(true)
  const second = await browser.newContext()
  try {
    await second.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
    const otherPage = await second.newPage()
    await otherPage.goto('/combat')
    await expect(otherPage).toHaveURL(/\/login$/)
    await signIn(otherPage, email)
    await expect(otherPage).toHaveURL(`${appUrl}/combat`)
    await page.getByRole('button', { name: 'Refresh sessions', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Revoke session', exact: true })).toHaveCount(2)
    const [revoked] = await Promise.all([
      page.waitForResponse(response => response.request().method() === 'DELETE'
        && response.url().includes('/api/auth/sessions/')),
      page.getByRole('listitem').filter({ hasNotText: 'Current session' })
        .getByRole('button', { name: 'Revoke session', exact: true }).click(),
    ])
    expect(revoked.status()).toBe(204)
    await expect(page.getByRole('button', { name: 'Revoke session', exact: true })).toHaveCount(1)
    await otherPage.reload()
    await expect(otherPage.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(otherPage.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
    await page.goBack()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    expect(await page.evaluate(() => [
      localStorage.getItem('swade-characters'), localStorage.getItem('swade-worlds'),
    ])).toEqual(['[ ]', '[ ]'])
  } finally {
    await second.close()
  }
})

test('invalid email link offers a new email without manual token input', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'test-csrf' } }))
  let confirmations = 0
  await page.route('**/api/auth/confirm', route => {
    confirmations++
    expect(route.request().postDataJSON()).toEqual({ token: 'invalid-test-link' })
    return route.fulfill({ status: 400, json: { code: 'invalidToken' } })
  })
  await page.route('**/api/auth/resend', route => {
    expect(route.request().postDataJSON()).toEqual({ email: 'replacement@example.test' })
    return route.fulfill({ status: 202 })
  })
  await page.goto('/login#token=invalid-test-link')
  await expect(page.getByRole('alert')).toContainText('invalid, expired or already used')
  expect(confirmations).toBe(1)
  await expect(page).toHaveURL(`${appUrl}/login`)
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.getByLabel('Confirmation token')).toHaveCount(0)
  await page.getByLabel('Email', { exact: true }).fill('replacement@example.test')
  await page.getByRole('button', { name: 'Resend confirmation', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('If this address is eligible')
})

test('confirmation result survives window focus without consuming the link again', async ({ page }) => {
  let sessionChecks = 0
  await page.route('**/api/auth/me', route => {
    sessionChecks++
    return route.fulfill({ json: {
      id: 'existing-account', email: 'existing@example.test',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    } })
  })

  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'test-csrf' } }))
  let confirmations = 0
  await page.route('**/api/auth/confirm', route => {
    confirmations++
    return route.fulfill(confirmations === 1
      ? { status: 204 }
      : { status: 400, json: { code: 'invalidToken' } })
  })
  await page.goto('/login#token=single-use-test-link')
  await expect(page.getByRole('status')).toContainText('Email confirmed')
  const checksBeforeFocus = sessionChecks
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(() => sessionChecks).toBeGreaterThan(checksBeforeFocus)
  await expect(page.getByRole('status')).toContainText('Email confirmed')
  expect(confirmations).toBe(1)
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
})

test('login distinguishes invalid credentials, unverified email and service failures', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'test-csrf' } }))
  let result: 'invalidCredentials' | 'emailUnverified' | 'server' | 'network' = 'invalidCredentials'
  await page.route('**/api/auth/login', route => result === 'network' ? route.abort()
    : result === 'server' ? route.fulfill({ status: 503, body: 'Service unavailable' })
      : route.fulfill({ status: 401, json: { code: result } }))
  await page.goto('/login')
  await expect(page.getByText('Use 12 to 128 characters.')).toHaveCount(0)
  await signIn(page, 'random@example.test')
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password')
  await expect(page.getByRole('button', { name: 'Resend confirmation', exact: true })).toHaveCount(0)
  result = 'emailUnverified'
  await signIn(page, 'unverified@example.test')
  await expect(page.getByRole('alert')).toHaveText('Confirm your email using the link in the message before signing in.')
  await expect(page.getByRole('button', { name: 'Resend confirmation', exact: true })).toBeVisible()
  for (const failure of ['server', 'network'] as const) {
    result = failure
    await signIn(page, 'unverified@example.test')
    await expect(page.getByRole('alert')).toHaveText('Account service is unavailable. Try again later.')
    await expect(page.getByRole('button', { name: 'Resend confirmation', exact: true })).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Create an account', exact: true }).click()
  await expect(page.getByText('Use 12 to 128 characters.')).toBeVisible()
})

test('session loading and failed checks never render application contents', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/auth/me', async route => {
    await pending
    await route.abort()
  })
  await page.goto('/creator')
  await expect(page.getByRole('status')).toContainText('Checking session')
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
  await expect(page.locator('input')).toHaveCount(0)
  release()
  await expect(page.getByRole('alert')).toContainText('Account service is unavailable')
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('server expiry closes an already-open local page without polling or renewing an idle session', async ({ page }) => {
  const deadline = Date.now() + 3000
  await page.route('**/api/auth/me', route => {
    return route.fulfill(Date.now() < deadline
      ? { json: { id: 'expiry-account', email: 'expiry@example.test', expiresAt: new Date(deadline).toISOString() } }
      : { status: 401, json: { code: 'unauthenticated' } })
  })
  await page.goto('/handbooks')
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/login$/, { timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
})

test('expired protected API response closes the whole app, not just the account card', async ({ page }) => {
  let expired = false
  await page.route('**/api/auth/me', route => route.fulfill(expired
    ? { status: 401, json: { code: 'unauthenticated' } }
    : { json: { id: 'expired', email: 'expired@example.test', expiresAt: new Date(Date.now() + 60000).toISOString() } }))
  await page.route('**/api/auth/sessions', route => {
    expired = true
    return route.fulfill({ status: 401, json: { code: 'unauthenticated' } })
  })
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('link', { name: 'Characters', exact: true })).toHaveCount(0)
})
