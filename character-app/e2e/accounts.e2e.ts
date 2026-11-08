import { expect, test } from '@playwright/test'
import type { Page, APIRequestContext } from '@playwright/test'
import { execFileSync } from 'node:child_process'

const password = 'correct horse battery staple'
const appUrl = `http://localhost:${process.env.ACCOUNTS_UI_PORT ?? '5173'}`

async function mailpitJson(request: APIRequestContext, path: string): Promise<unknown> {
  const url = `http://127.0.0.1:8025${path}`
  if (process.env.ACCOUNTS_MAILPIT_WSL === '1') {
    return JSON.parse(execFileSync('wsl', ['-d', 'Ubuntu-24.04', '--', 'curl', '--silent', '--fail', url], { encoding: 'utf8' })) as unknown
  }
  return (await request.get(url)).json() as Promise<unknown>
}

test('password reset form requests a link and does not consume it on opening', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  let completions = 0
  await page.route('**/api/auth/password-reset/request', route => route.fulfill({ status: 202 }))
  await page.route('**/api/auth/password-reset/complete', route => {
    completions++
    return route.fulfill({ status: 204 })
  })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill('user@example.test')
  await page.getByRole('button', { name: 'Send reset link', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('If this address is eligible')
  await page.goto('/login#resetToken=example')
  await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
  expect(completions).toBe(0)
  await page.getByLabel('New password', { exact: true }).fill('a sufficiently long password')
  await page.getByLabel('Confirm new password', { exact: true }).fill('a sufficiently long password')
  await page.getByRole('button', { name: 'Save new password', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Password updated')
  expect(completions).toBe(1)
})

test('invalid reset links offer recovery and validation errors do not submit', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  let submissions = 0
  await page.route('**/api/auth/password-reset/complete', route => {
    submissions++
    return route.fulfill({ status: 400, json: { code: 'invalidToken' } })
  })
  await page.goto('/login#resetToken=invalid')
  await page.getByLabel('New password', { exact: true }).fill('a sufficiently long password')
  await page.getByLabel('Confirm new password').fill('a different long password')
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page.getByRole('alert')).toContainText('Passwords do not match')
  expect(submissions).toBe(0)
  await page.getByLabel('Confirm new password').fill('a sufficiently long password')
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page.getByRole('alert')).toContainText('invalid, expired or already used')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
})

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
    const inbox = await mailpitJson(request, '/api/v1/messages') as { messages: { ID: string; To: { Address: string }[] }[] }
    const letter = inbox.messages.find(message => message.To.some(to => to.Address === email))
    if (!letter) return false
    const body = await mailpitJson(request, `/api/v1/message/${letter.ID}`) as { Text: string }
    link = body.Text.match(/http:\/\/localhost:\d+\/(?:login|account)#token=[A-Za-z0-9_-]+/)?.[0] ?? ''
    return Boolean(link)
  }).toBe(true)
  return link
}

test('Mailpit reset and password change revoke sessions across browsers', async ({ page, browser, request }) => {
  const email = `password-${Date.now()}@example.test`
  await page.goto('/login')
  await page.getByRole('button', { name: 'Create an account', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Register', exact: true }).click()
  await page.goto(await confirmationLink(request, email))
  await page.getByRole('button', { name: 'Back to sign in', exact: true }).click()
  await signIn(page, email)
  await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/account')
  const second = await browser.newContext()
  try {
    await second.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
    const other = await second.newPage()
    await other.goto('/login')
    await signIn(other, email)
    await expect(other).not.toHaveURL(/\/login/)
    await page.getByLabel('Current password').fill('incorrect')
    await page.getByLabel('New password', { exact: true }).fill('a new sufficiently long password')
    await page.getByLabel('Confirm new password').fill('a new sufficiently long password')
    await page.getByRole('button', { name: 'Change password', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('current password is incorrect')
    await other.reload()
    await expect(other).not.toHaveURL(/\/login/)
    await page.getByLabel('Current password').fill(password)
    await page.getByRole('button', { name: 'Change password', exact: true }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('status')).toContainText('Password updated')
    await other.reload()
    await expect(other).toHaveURL(/\/login/)
    await signIn(page, email)
    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
    for (const signedOut of [page, other]) {
      await signedOut.getByLabel('Email', { exact: true }).fill(email)
      await signedOut.getByLabel('Password', { exact: true }).fill('a new sufficiently long password')
      await signedOut.getByRole('button', { name: 'Sign in', exact: true }).click()
      await expect(signedOut).not.toHaveURL(/\/login/)
    }
    const resetContext = await browser.newContext()
    await resetContext.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
    const resetPage = await resetContext.newPage()
    await resetPage.goto('/login')
    await resetPage.getByRole('button', { name: 'Forgot password?', exact: true }).click()
    await resetPage.getByLabel('Email', { exact: true }).fill(email)
    await resetPage.getByRole('button', { name: 'Send reset link', exact: true }).click()
    await expect(resetPage.getByRole('status')).toContainText('If this address is eligible')
    let link = ''
    await expect.poll(async () => {
      const inbox = await mailpitJson(request, '/api/v1/messages') as {
        messages: { ID: string; To: { Address: string }[]; Subject: string }[]
      }
      const letter = inbox.messages.find(message => message.Subject.includes('Reset')
        && message.To.some(to => to.Address === email))
      if (!letter) return false
      const body = await mailpitJson(request, `/api/v1/message/${letter.ID}`) as { Text: string }
      link = body.Text.match(/http:\/\/localhost:\d+\/login#resetToken=[A-Za-z0-9_-]+/)?.[0] ?? ''
      return Boolean(link)
    }).toBe(true)
    await resetPage.goto(link)
    await resetPage.getByLabel('New password', { exact: true }).fill('a reset sufficiently long password')
    await resetPage.getByLabel('Confirm new password').fill('a reset sufficiently long password')
    await resetPage.getByRole('button', { name: 'Save new password' }).click()
    await expect(resetPage.getByRole('status')).toContainText('Password updated')
    for (const session of [page, other]) {
      await session.reload()
      await expect(session).toHaveURL(/\/login/)
    }
    await resetPage.getByRole('button', { name: 'Back to sign in', exact: true }).click()
    await resetPage.getByLabel('Email', { exact: true }).fill(email)
    await resetPage.getByLabel('Password', { exact: true }).fill('a new sufficiently long password')
    await resetPage.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(resetPage.getByRole('alert')).toContainText('Invalid email or password')
    await resetPage.getByLabel('Password', { exact: true }).fill('a reset sufficiently long password')
    await resetPage.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(resetPage).not.toHaveURL(/\/login/)
    await resetContext.close()
  } finally {
    await second.close()
  }
})

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
})

async function registerAndSignIn(page: Page, request: APIRequestContext, email: string) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Create an account', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Register', exact: true }).click()
  await page.goto(await confirmationLink(request, email))
  await page.getByRole('button', { name: 'Back to sign in', exact: true }).click()
  await signIn(page, email)
  await expect(page).not.toHaveURL(/\/login/)
}

test('saved standalone characters persist across browser contexts and stay private', async ({ page, browser, request }) => {
  test.setTimeout(45_000)
  const ownerEmail = `character-owner-${Date.now()}@example.test`
  const otherEmail = `character-other-${Date.now()}@example.test`
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.setItem('swade-locale', 'en')
    localStorage.setItem('swade-welcome-seen', 'true')
  })
  await page.evaluate(() => {
    localStorage.setItem('swade-characters', '[{"id":"local-only"}]')
    localStorage.setItem('swade-worlds', '[{"id":"local-world-only"}]')
  })
  await registerAndSignIn(page, request, ownerEmail)

  await page.goto('/creator')
  await page.getByLabel('Callsign', { exact: true }).fill('Cross-device scout')
  const createResponse = page.waitForResponse(response => response.request().method() === 'POST'
    && response.url().endsWith('/api/characters'))
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  expect((await createResponse).status()).toBe(201)
  await expect(page.getByRole('status')).toContainText('Saved')
  const characterId = new URL(page.url()).pathname.split('/').pop()!

  const secondContext = await browser.newContext()
  const otherAccountContext = await browser.newContext()
  try {
    const secondPage = await secondContext.newPage()
    await secondPage.goto('/login')
    await secondPage.evaluate(() => {
      localStorage.setItem('swade-locale', 'en')
      localStorage.setItem('swade-welcome-seen', 'true')
    })
    await secondPage.reload()
    await signIn(secondPage, ownerEmail)
    const savedCharacter = secondPage.getByText('Cross-device scout', { exact: true }).last()
    await expect(savedCharacter).toBeVisible()
    await savedCharacter.click()
    await expect(secondPage).toHaveURL(new RegExp(`/creator/${characterId}$`))
    await secondPage.getByLabel('Callsign', { exact: true }).fill('Updated from another browser')

    await secondPage.route('**/api/characters/*', route =>
      route.request().method() === 'PUT'
        ? route.fulfill({ status: 503, json: { code: 'unavailable' } })
        : route.continue())
    await secondPage.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(secondPage.getByRole('alert')).toContainText('save')
    await expect(secondPage.getByLabel('Callsign', { exact: true }))
      .toHaveValue('Updated from another browser')
    await secondPage.unroute('**/api/characters/*')

    const updateResponse = secondPage.waitForResponse(response => response.request().method() === 'PUT'
      && response.url().endsWith(`/api/characters/${characterId}`))
    await secondPage.getByRole('button', { name: 'Save', exact: true }).click()
    expect((await updateResponse).status()).toBe(200)
    await expect(secondPage.getByRole('status')).toContainText('Saved')

    await page.getByLabel('Callsign', { exact: true }).fill('Draft after version conflict')
    const conflictResponse = page.waitForResponse(response => response.request().method() === 'PUT'
      && response.url().endsWith(`/api/characters/${characterId}`))
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    expect((await conflictResponse).status()).toBe(409)
    await expect(page.getByRole('alert')).toContainText('changed in another browser')
    await expect(page.getByLabel('Callsign', { exact: true }))
      .toHaveValue('Draft after version conflict')

    await page.reload()
    await expect(page.getByLabel('Callsign', { exact: true }))
      .toHaveValue('Updated from another browser')

    const saved = await secondPage.evaluate(async id =>
      (await fetch(`/api/characters/${id}`, { cache: 'no-store' })).json(), characterId)
    const otherAccountPage = await otherAccountContext.newPage()
    await otherAccountPage.goto('/login')
    await otherAccountPage.evaluate(() => {
      localStorage.setItem('swade-locale', 'en')
      localStorage.setItem('swade-welcome-seen', 'true')
    })
    await otherAccountPage.reload()
    await registerAndSignIn(otherAccountPage, request, otherEmail)
    await expect(otherAccountPage.getByText('Updated from another browser', { exact: true })).toHaveCount(0)
    const foreignStatuses = await otherAccountPage.evaluate(async ({ id, record }) => {
      const csrfResponse = await fetch('/api/auth/csrf')
      const csrf = await csrfResponse.json() as { token: string }
      const currentAccount = await fetch('/api/auth/me')
      const ownCharacters = await fetch('/api/characters')
      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf.token,
        'If-Match': `"${record.version}"`,
      }
      const get = await fetch(`/api/characters/${id}`, { cache: 'no-store' })
      const put = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ character: { ...record.character, callsign: 'Unauthorized edit' } }),
      })
      const remove = await fetch(`/api/characters/${id}`, { method: 'DELETE', headers })
      return {
        statuses: [get.status, put.status, remove.status],
        codes: await Promise.all([get, put, remove].map(async response => {
          try {
            return (await response.json() as { code?: string }).code
          } catch {
            return undefined
          }
        })),
        csrfStatus: csrfResponse.status,
        accountStatus: currentAccount.status,
        ownListStatus: ownCharacters.status,
      }
    }, { id: characterId, record: saved })
    expect(foreignStatuses).toMatchObject({
      statuses: [404, 404, 404],
      codes: ['notFound', 'notFound', 'notFound'],
      csrfStatus: 200,
      accountStatus: 200,
      ownListStatus: 200,
    })

    await secondPage.getByRole('button', { name: 'Library', exact: true }).click()
    const libraryDialog = secondPage.getByRole('dialog', { name: 'Character Library' })
    await libraryDialog.getByRole('button', { name: 'Delete', exact: true }).click()
    const deleteResponse = secondPage.waitForResponse(response => response.request().method() === 'DELETE'
      && response.url().endsWith(`/api/characters/${characterId}`))
    await secondPage.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
    expect((await deleteResponse).status()).toBe(204)
    await expect(libraryDialog.getByText('No saved characters yet.')).toBeVisible()
    expect(await page.evaluate(() => [
      localStorage.getItem('swade-characters'), localStorage.getItem('swade-worlds'),
    ])).toEqual(['[{"id":"local-only"}]', '[{"id":"local-world-only"}]'])
  } finally {
    await secondContext.close()
    await otherAccountContext.close()
  }
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
