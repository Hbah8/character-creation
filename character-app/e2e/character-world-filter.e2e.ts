import { expect, test } from '@playwright/test'
import { enDefaultCharacter } from '../src/i18n/locales/en/defaults'
import { getDefaultWorld } from '../src/world/data/defaultWorld'

const worlds = ['Alpha world', 'Beta world', 'Empty world'].map((name, index) => ({
  id: `world-${index}`,
  version: 1,
  createdAt: '2026-11-08T00:00:00Z',
  updatedAt: '2026-11-08T00:00:00Z',
  world: { ...getDefaultWorld('en'), name },
}))
const characters = [
  { callsign: 'Beta scout', worldId: worlds[1].id },
  { callsign: 'Alpha scout', worldId: worlds[0].id },
  { callsign: 'Alpha mage', worldId: worlds[0].id },
  { callsign: 'Solo scout' },
].map((fields, index) => ({
  id: `character-${index}`,
  version: 1,
  createdAt: '2026-11-08T00:00:00Z',
  updatedAt: `2026-11-0${8 - index}T00:00:00Z`,
  character: { ...enDefaultCharacter, ...fields },
}))

for (const locale of ['en', 'ru'] as const) {
  test(`character lists and summaries follow world selection (${locale})`, async ({ page, context }) => {
    await context.addInitScript(language => {
      localStorage.setItem('swade-locale', language)
      localStorage.setItem('swade-welcome-seen', 'true')
    }, locale)
    await page.route('**/api/auth/me', route => route.fulfill({
      json: { id: 'owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z' },
    }))
    await page.route('**/api/worlds', route => route.fulfill({ json: worlds }))
    await page.route('**/api/characters', route => route.fulfill({ json: characters }))
    await page.route('**/api/characters/*', route => {
      const id = route.request().url().split('/').pop()
      const record = characters.find(item => item.id === id)
      return route.fulfill({ json: record })
    })

    await page.goto('/')
    const labels = locale === 'en'
      ? { count: 'Characters', last: 'Last edited', library: 'Library', title: 'Character Library', new: 'New Character' }
      : { count: 'Персонажей', last: 'Последний изменён', library: 'Библиотека', title: 'Библиотека персонажей', new: 'Новый персонаж' }

    async function checkDashboard(names: string[], last: string | null) {
      const main = page.locator('main')
      await expect(main.getByText(labels.count, { exact: true }).first()
        .locator('..').getByText(String(names.length), { exact: true })).toBeVisible()
      for (const record of characters) {
        const name = record.character.callsign
        if (names.includes(name)) await expect(main.getByText(name, { exact: true }).last()).toBeVisible()
        else await expect(main.getByText(name, { exact: true })).toHaveCount(0)
      }
      if (last) {
        await expect(main.getByText(labels.last, { exact: true })
          .locator('..').getByText(last, { exact: true })).toBeVisible()
      } else {
        await expect(main.getByText(labels.last, { exact: true })).toHaveCount(0)
      }
    }

    await checkDashboard(['Solo scout'], 'Solo scout')
    for (const [index, names, last] of [
      [0, ['Alpha scout', 'Alpha mage'], 'Alpha scout'],
      [1, ['Beta scout'], 'Beta scout'],
      [2, [], null],
    ] as const) {
      const previous = index === 0 ? '—' : worlds[index - 1].world.name
      await page.getByRole('button', { name: previous, exact: true }).click()
      await page.getByRole('menuitem', { name: worlds[index].world.name, exact: true }).click()
      await checkDashboard([...names], last)
      await page.getByRole('button', { name: labels.new, exact: true }).first().click()
      await page.getByRole('button', { name: labels.library, exact: true }).click()
      const dialog = page.getByRole('dialog', { name: labels.title, exact: true })
      await expect(dialog).toBeVisible()
      if (names.length === 0) {
        await expect(dialog.getByText(locale === 'en'
          ? 'No saved characters yet.' : 'Нет сохранённых персонажей.', { exact: true })).toBeVisible()
      } else {
        await expect(dialog.getByText(names[0], { exact: true })).toBeVisible()
      }
      for (const record of characters) {
        const name = record.character.callsign
        if (names.some(item => item === name)) await expect(dialog.getByText(name, { exact: true })).toBeVisible()
        else await expect(dialog.getByText(name, { exact: true })).toHaveCount(0)
      }
      await page.keyboard.press('Escape')
      await page.locator('button[title="Назад к обзору"]').click()
      await checkDashboard([...names], last)
    }
    await page.getByRole('button', { name: 'Empty world', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Без мира', exact: true }).click()
    await checkDashboard(['Solo scout'], 'Solo scout')
    await page.setViewportSize({ width: 390, height: 844 })
    await checkDashboard(['Solo scout'], 'Solo scout')
  })
}
