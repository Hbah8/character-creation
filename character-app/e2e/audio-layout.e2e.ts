import { expect, test } from '@playwright/test'
import { getDefaultWorld } from '../src/world/data/defaultWorld'

test('audio workspace keeps long lists readable, contained, and reachable across screen sizes', async ({ page, context }) => {
  const world = getDefaultWorld('en')
  const assets = Array.from({ length: 60 }, (_, index) => ({
    id: `asset-${index}`,
    filename: index === 0
      ? `${'A very long atmospheric recording of rain and distant thunder '.repeat(3)}.mp3`
      : `ambience-${String(index).padStart(2, '0')}.wav`,
    mediaType: index === 0 ? 'audio/mpeg' : 'audio/wav',
    byteLength: 4096,
  }))
  const tracks = assets.slice(0, 6).map((asset, index) => ({
    id: `track-${index}`,
    assetId: asset.id,
    name: asset.filename,
    loop: true,
    defaultVolume: 0.7,
  }))
  const scenes = Array.from({ length: 8 }, (_, index) => ({
    id: `scene-${index}`,
    name: `Scene ${index + 1} with a long descriptive title`,
    trackIds: tracks.map(track => track.id),
  }))
  const record = {
    id: 'world-audio-layout',
    version: 1,
    createdAt: '2026-11-08T00:00:00Z',
    updatedAt: '2026-11-08T00:00:00Z',
    world: {
      ...world,
      name: 'Audio layout world',
      audio: {
        ...world.audio!,
        assets,
        tracks,
        scenes,
        soundButtons: assets.slice(0, 48).map((asset, index) => ({
          id: `effect-${index}`,
          assetId: asset.id,
          name: `Effect ${index + 1}`,
        })),
      },
    },
  }

  await context.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [record] }))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/audio')
  await page.getByRole('button', { name: 'Select world', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Audio layout world' }).click()

  const library = page.locator('[data-slot="card"]').filter({ has: page.getByText('Audio library', { exact: true }) })
  const fileList = library.locator('[data-slot="card-content"]').first()
  const longFilename = assets[0].filename
  const filename = library.getByText(longFilename, { exact: true })
  await expect(filename).toBeVisible()
  const titleLayout = await filename.evaluate(element => ({
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
  }))
  expect(titleLayout.fontSize).toBeGreaterThanOrEqual(14)
  expect(titleLayout.lineHeight).toBeGreaterThanOrEqual(titleLayout.fontSize)
  expect(titleLayout.scrollWidth).toBeLessThanOrEqual(titleLayout.clientWidth)
  expect(await filename.locator('../..').locator('span').nth(1).evaluate(element =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  )).toBeGreaterThanOrEqual(14)
  expect(await fileList.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await page.getByRole('button', { name: 'Launch', exact: true }).first().click()
  expect(await page.locator('[data-slot="card"]').filter({
    has: page.getByText('Active mixer', { exact: true }),
  }).locator('article').count()).toBe(6)
  const mixer = page.locator('[data-slot="card"]').filter({
    has: page.getByText('Active mixer', { exact: true }),
  })
  expect(await mixer.locator('article strong').first().evaluate(element =>
    Number.parseInt(getComputedStyle(element).fontWeight, 10),
  )).toBeLessThan(600)

  const lastSceneName = scenes[scenes.length - 1].name
  const scenesPanel = page.locator('[data-slot="card"]').filter({
    has: page.getByText(lastSceneName, { exact: true }),
  })
  expect(await scenesPanel.evaluate((panel, name) => {
    const scrollable = Array.from(panel.querySelectorAll<HTMLElement>('*')).find(element => {
      const style = getComputedStyle(element)
      return ['auto', 'scroll'].includes(style.overflowY) && element.scrollHeight > element.clientHeight
    })
    if (!scrollable) return false
    scrollable.scrollTop = scrollable.scrollHeight
    const title = Array.from(panel.querySelectorAll<HTMLElement>('*')).find(element => element.textContent === name)
    if (!title) return false
    const titleBounds = title.getBoundingClientRect()
    const listBounds = scrollable.getBoundingClientRect()
    return titleBounds.top >= listBounds.top && titleBounds.bottom <= listBounds.bottom
  }, lastSceneName)).toBe(true)

  const effects = page.locator('[data-sound-effects]')
  const effectsList = effects.locator('#sound-effects-content')
  expect(await effectsList.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await effectsList.evaluate(element => { element.scrollTop = element.scrollHeight })
  const lastEffect = effects.getByRole('button', { name: 'Effect 48', exact: true })
  await expect(lastEffect).toBeVisible()
  expect(await lastEffect.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const viewport = element.closest('#sound-effects-content')!.getBoundingClientRect()
    return bounds.bottom <= viewport.bottom && bounds.top >= viewport.top
  })).toBe(true)

  const viewport = page.viewportSize()!
  const desktopPanel = await effects.boundingBox()
  expect(desktopPanel).not.toBeNull()
  expect(desktopPanel!.height).toBeLessThanOrEqual(viewport.height * 0.36)
  expect(Math.abs(desktopPanel!.y + desktopPanel!.height - viewport.height)).toBeLessThanOrEqual(1)
  const expandedLibraryHeight = await library.evaluate(element => element.getBoundingClientRect().height)
  await effects.getByRole('button', { name: 'Sound effects' }).click()
  const collapsedLibraryHeight = await library.evaluate(element => element.getBoundingClientRect().height)
  expect(collapsedLibraryHeight).toBeGreaterThan(expandedLibraryHeight + 100)

  await fileList.evaluate(element => { element.scrollTop = element.scrollHeight })
  const lastAssetName = assets[59].filename
  const lastAssetTitle = library.getByText(lastAssetName, { exact: true })
  const lastAssetRow = lastAssetTitle.locator('../..')
  await expect(lastAssetTitle).toBeVisible()
  await expect(lastAssetRow.getByRole('button')).toHaveCount(3)
  expect(await lastAssetRow.evaluate(element => {
    const row = element.getBoundingClientRect()
    const list = element.closest('[data-slot="card-content"]')!.getBoundingClientRect()
    return row.top >= list.top && row.bottom <= list.bottom &&
      Array.from(element.querySelectorAll('button')).every(button => {
        const bounds = button.getBoundingClientRect()
        return bounds.left >= row.left && bounds.right <= row.right &&
          bounds.top >= list.top && bounds.bottom <= list.bottom
      })
  })).toBe(true)

  await effects.getByRole('button', { name: 'Sound effects' }).click()
  const reopenedLibraryHeight = await library.evaluate(element => element.getBoundingClientRect().height)
  expect(reopenedLibraryHeight).toBeLessThan(collapsedLibraryHeight - 100)
  expect(await library.evaluate(element => {
    let parent = element.parentElement
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent)
      if (['auto', 'scroll'].includes(style.overflowY) && parent.scrollHeight > parent.clientHeight + 1) return true
      parent = parent.parentElement
    }
    return false
  })).toBe(false)

  await page.setViewportSize({ width: 390, height: 844 })
  const mobileViewport = page.viewportSize()!
  const mobileEffects = await effects.boundingBox()
  expect(mobileEffects).not.toBeNull()
  expect(Math.abs(mobileEffects!.y + mobileEffects!.height - mobileViewport.height)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  const mobileWorkspace = page.locator('.audio-soundboard > div').first()
  const expandedMobileWorkspaceHeight = await mobileWorkspace.evaluate(element => element.getBoundingClientRect().height)
  await effects.getByRole('button', { name: 'Sound effects' }).click()
  const collapsedMobileWorkspaceHeight = await mobileWorkspace.evaluate(element => element.getBoundingClientRect().height)
  expect(collapsedMobileWorkspaceHeight).toBeGreaterThan(expandedMobileWorkspaceHeight + 100)
  const collapsedMobileEffects = await effects.boundingBox()
  expect(collapsedMobileEffects).not.toBeNull()
  expect(Math.abs(collapsedMobileEffects!.y + collapsedMobileEffects!.height - mobileViewport.height)).toBeLessThanOrEqual(1)
  await effects.getByRole('button', { name: 'Sound effects' }).click()
  await fileList.evaluate(element => { element.scrollTop = element.scrollHeight })
  const lastAsset = library.getByText(assets[59].filename, { exact: true })
  await expect(lastAsset).toBeVisible()
  expect(await lastAsset.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const list = element.closest('[data-slot="card-content"]')!.getBoundingClientRect()
    return bounds.bottom <= list.bottom && bounds.top >= list.top
  })).toBe(true)
})
