import { expect, test } from '@playwright/test'
import { getDefaultWorld } from '../src/world/data/defaultWorld'
import type { World } from '../src/world/types'

test('sound labels wrap by word, truncate within the button, and expose the full name on hover', async ({ page, context }) => {
  const world = getDefaultWorld('en')
  const labels = ['soft tiny taps', 'A very loud distant thunder sound across the valley', 'Supercalifragilisticexpialidocious']
  const record = {
    id: 'world-1', version: 1, createdAt: '2026-11-08T00:00:00Z', updatedAt: '2026-11-08T00:00:00Z',
    world: {
      ...world, name: 'Audio world',
      audio: {
        ...world.audio!,
        assets: [{ id: 'asset-1', filename: 'sound.wav', mediaType: 'audio/wav', byteLength: 4 }],
        soundButtons: labels.map((name, index) => ({ id: `button-${index}`, assetId: 'asset-1', name })),
      },
    },
  }
  await context.addInitScript(() => localStorage.setItem('swade-locale', 'en'))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/worlds', route => route.fulfill({ json: [record] }))
  await page.goto('/audio')
  await page.getByRole('button', { name: 'Select world', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Audio world' }).click()
  const panel = page.locator('[data-sound-effects]')
  const short = panel.getByRole('button', { name: labels[0], exact: true })
  const long = panel.getByRole('button', { name: labels[1], exact: true })
  const singleWord = panel.getByRole('button', { name: labels[2], exact: true })

  const dimensions = await short.locator('[data-sound-label]').evaluate(element => {
    const text = element.textContent ?? ''
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const positions = new Map<number, number>()
    let node: Node | null
    let offset = 0
    while ((node = walker.nextNode())) {
      const content = node.textContent ?? ''
      for (let index = 0; index < content.length; index++) {
        const range = document.createRange()
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        positions.set(offset + index, range.getBoundingClientRect().top)
      }
      offset += content.length
    }
    return text.split(' ').map(word => {
      const start = text.indexOf(word)
      return [...new Set(Array.from({ length: word.length }, (_, index) => positions.get(start + index)))]
    })
  })
  expect(dimensions.every(positions => positions.length === 1)).toBe(true)
  expect(new Set(dimensions.map(positions => positions[0])).size).toBeGreaterThan(1)
  await expect(long.locator('[data-sound-label]')).toHaveCSS('-webkit-line-clamp', '3')
  expect(await long.locator('[data-sound-label]').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  expect(await singleWord.locator('[data-sound-label] [data-sound-word]').evaluate(element =>
    element.scrollWidth > element.clientWidth && getComputedStyle(element).textOverflow === 'ellipsis')).toBe(true)
  await long.hover()
  await expect(page.getByRole('tooltip')).toHaveText(labels[1])
})

test('a real browser audio element plays a short effect once', async ({ page, context }) => {
    const world = getDefaultWorld('en')
    const asset = { id: 'chirp', filename: 'chirp.wav', mediaType: 'audio/wav', byteLength: 8044 }
    const record = {
      id: 'world-1', version: 1, createdAt: '2026-11-08T00:00:00Z', updatedAt: '2026-11-08T00:00:00Z',
      world: { ...world, name: 'Audio world', audio: {
        ...world.audio!, assets: [asset], soundButtons: [{ id: 'button-1', assetId: asset.id }],
      } },
    }
    await context.addInitScript(() => {
      localStorage.setItem('swade-locale', 'en')
      const NativeAudio = window.Audio
      Object.defineProperty(window, 'Audio', { value: function (source: string) {
        const element = new NativeAudio(source)
        const state = window as Window & { realTestAudio?: HTMLAudioElement[] }
        state.realTestAudio ??= []
        state.realTestAudio.push(element)
        return element
      } })
    })
    await page.route('**/src/audio/services/localAudioAssetBindingRepository.ts*', route => route.fulfill({
      contentType: 'text/javascript',
      body: `
        const bytes = new Uint8Array(8044)
        const view = new DataView(bytes.buffer)
        for (const [offset, text] of [[0, 'RIFF'], [8, 'WAVE'], [12, 'fmt '], [36, 'data']])
          for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i)
        view.setUint32(4, 8036, true); view.setUint32(16, 16, true)
        view.setUint16(20, 1, true); view.setUint16(22, 1, true)
        view.setUint32(24, 8000, true); view.setUint32(28, 16000, true)
        view.setUint16(32, 2, true); view.setUint16(34, 16, true)
        view.setUint32(40, 8000, true)
        export async function getLocalAudioAssetBinding(assetId) {
          return { assetId, fileHandle: {
            queryPermission: async () => 'granted', requestPermission: async () => 'granted',
            getFile: async () => new File([bytes], 'chirp.wav', { type: 'audio/wav' })
          }};
        }
        export async function saveLocalAudioAssetBinding() {}
        export async function deleteLocalAudioAssetBinding() {}
      `,
    }))
    await page.route('**/api/auth/me', route => route.fulfill({
      json: { id: 'owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z' },
    }))
    await page.route('**/api/worlds', route => route.fulfill({ json: [record] }))
    await page.goto('/audio')
    await page.getByRole('button', { name: 'Select world', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Audio world' }).click()
    const sound = page.locator('[data-sound-effects]').getByRole('button', { name: 'chirp.wav', exact: true })
    await sound.click()
    await expect.poll(() => page.evaluate(() => {
      const audio = (window as Window & { realTestAudio?: HTMLAudioElement[] }).realTestAudio?.[0]
      return audio?.ended && !audio.loop && audio.currentTime > 0
    })).toBe(true)
    await expect(sound).toHaveAttribute('data-variant', 'outline')
  })

test('sound buttons are world-scoped, editable, and do not cover the page', async ({ page, context }) => {
  const assets = [
    { id: 'knock', filename: 'knock.wav', mediaType: 'audio/wav', byteLength: 4 },
    { id: 'boom', filename: 'boom.wav', mediaType: 'audio/wav', byteLength: 4 },
  ]
  const records = ['Alpha', 'Beta'].map((name, index) => {
    const world = getDefaultWorld('en')
    return {
      id: `world-${index}`, version: 1,
      createdAt: '2026-11-08T00:00:00Z', updatedAt: '2026-11-08T00:00:00Z',
      world: { ...world, name, audio: { ...world.audio!, assets } },
    }
  })

  await context.addInitScript(() => {
    localStorage.setItem('swade-locale', 'en')
    localStorage.setItem('swade-welcome-seen', 'true')
    class FakeAudio extends EventTarget {
      loop = false
      paused = true
      currentTime = 0
      volume = 1
      constructor() {
        super()
        const state = window as Window & { effectTestAudio?: FakeAudio[] }
        state.effectTestAudio ??= []
        state.effectTestAudio.push(this)
      }
      play() { this.paused = false; return Promise.resolve() }
      pause() { this.paused = true }
    }
    Object.defineProperty(window, 'Audio', { value: FakeAudio })
  })
  await page.route('**/src/audio/services/localAudioAssetBindingRepository.ts*', route => route.fulfill({
    contentType: 'text/javascript',
    body: `
      export async function getLocalAudioAssetBinding(assetId) {
        return { assetId, fileHandle: {
          queryPermission: async () => 'granted',
          requestPermission: async () => 'granted',
          getFile: async () => new File(['test'], assetId + '.wav', { type: 'audio/wav' })
        }};
      }
      export async function saveLocalAudioAssetBinding() {}
      export async function deleteLocalAudioAssetBinding() {}
    `,
  }))
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { id: 'owner', email: 'owner@example.test', expiresAt: '2099-01-01T00:00:00Z' },
  }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { token: 'csrf' } }))
  await page.route('**/api/worlds', route => route.fulfill({ json: records }))
  await page.route('**/api/worlds/*', async route => {
    const record = records.find(item => route.request().url().endsWith(item.id))
    if (!record) return route.fulfill({ status: 404 })
    if (route.request().method() === 'PUT') {
      expect(route.request().headers()['if-match']).toBe(`"${record.version}"`)
      record.world = (route.request().postDataJSON() as { world: World }).world as typeof record.world
      record.version++
    }
    return route.fulfill({ json: record, headers: { ETag: `"${record.version}"` } })
  })

  await page.goto('/audio')
  await page.getByRole('button', { name: 'Select world', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Alpha', exact: true }).click()
  const panel = page.locator('[data-sound-effects]')
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Add sound effect' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'knock.wav' }).click()
  await expect(panel.getByRole('button', { name: 'knock.wav', exact: true })).toBeVisible()
  await expect.poll(() => records[0].world.audio.soundButtons.length).toBe(1)

  await page.getByText('knock.wav', { exact: true }).first().locator('..').locator('..')
    .getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  const sound = panel.getByRole('button', { name: 'knock.wav', exact: true })
  await sound.click()
  await sound.click()
  await expect.poll(() => page.evaluate(() =>
    (window as Window & { effectTestAudio: Array<{ paused: boolean }> }).effectTestAudio.length)).toBe(3)
  await expect(sound).toHaveAttribute('data-variant', 'default')
  await page.evaluate(() => {
    const sounds = (window as Window & { effectTestAudio: EventTarget[] }).effectTestAudio
    sounds[1].dispatchEvent(new Event('ended'))
  })
  await expect(sound).toHaveAttribute('data-variant', 'default')
  await page.evaluate(() => {
    const sounds = (window as Window & { effectTestAudio: EventTarget[] }).effectTestAudio
    sounds[2].dispatchEvent(new Event('ended'))
  })
  await expect(sound).toHaveAttribute('data-variant', 'outline')
  expect(await page.evaluate(() =>
    (window as Window & { effectTestAudio: Array<{ paused: boolean }> }).effectTestAudio[0].paused)).toBe(false)

  await panel.getByRole('button', { name: 'Options for knock.wav' }).click()
  await page.getByRole('menuitem', { name: 'Rename button' }).click()
  const renameDialog = page.getByRole('dialog', { name: 'Rename button' })
  const renameInput = renameDialog.getByRole('textbox', { name: 'Button name' })
  await expect(renameInput).toHaveValue('knock.wav')
  await renameInput.fill('   ')
  await expect(renameDialog.getByRole('button', { name: 'Save' })).toBeDisabled()
  await renameInput.fill('  Door knock  ')
  await renameDialog.getByRole('button', { name: 'Save' }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toBeVisible()
  await expect.poll(() => records[0].world.audio.soundButtons[0].name).toBe('Door knock')
  expect(records[0].world.audio.assets[0].filename).toBe('knock.wav')

  await panel.getByRole('button', { name: 'Options for Door knock' }).click()
  await page.getByRole('menuitem', { name: 'Rename button' }).click()
  await renameInput.fill('Discarded name')
  await renameDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toBeVisible()

  await panel.getByRole('button', { name: 'Options for Door knock' }).click()
  await page.getByRole('menuitem', { name: 'Replace sound' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'boom.wav' }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toBeVisible()
  await expect.poll(() => records[0].world.audio.soundButtons[0].assetId).toBe('boom')
  await page.reload()
  await page.getByRole('button', { name: 'Select world', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Alpha', exact: true }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toBeVisible()

  const position = await panel.boundingBox()
  const sidebar = await page.locator('[data-slot="sidebar-container"]').boundingBox()
  expect(position).not.toBeNull()
  expect(sidebar).not.toBeNull()
  expect(Math.abs(position!.y + position!.height - page.viewportSize()!.height),
    JSON.stringify({ position, parents: await panel.evaluate(element => {
      const results = []
      for (let current: Element | null = element; current; current = current.parentElement) {
        const bounds = current.getBoundingClientRect()
        results.push([current.tagName, current.className, bounds.y, bounds.height])
      }
      return results
    }) })).toBeLessThanOrEqual(1)
  expect(position!.x).toBeGreaterThanOrEqual(sidebar!.x + sidebar!.width - 1)

  await panel.getByRole('button', { name: 'Sound effects' }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toHaveCount(0)
  await panel.getByRole('button', { name: 'Sound effects' }).click()
  await page.getByRole('button', { name: 'Change', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Beta', exact: true }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Change', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Alpha', exact: true }).click()
  await expect(panel.getByRole('button', { name: 'Door knock', exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Options for Door knock' }).click()
  await page.getByRole('menuitem', { name: 'Remove button' }).click()
  await expect.poll(() => records[0].world.audio.soundButtons.length).toBe(0)
  expect(records[0].world.audio.assets).toHaveLength(2)

  await page.setViewportSize({ width: 390, height: 844 })
  for (let index = 0; index < 12; index++) {
    await panel.getByRole('button', { name: 'Add sound effect' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'knock.wav' }).click()
  }
  await expect(panel.getByRole('button', { name: 'knock.wav', exact: true })).toHaveCount(12)
  const mobile = await panel.boundingBox()
  expect(mobile!.height).toBeLessThanOrEqual(844 * 0.45 + 1)
  expect(Math.abs(mobile!.y + mobile!.height - 844)).toBeLessThanOrEqual(1)
  expect(await panel.locator('#sound-effects-content').evaluate(element =>
    element.scrollHeight > element.clientHeight)).toBe(true)
  await expect(page.getByRole('heading', { name: 'Audio', exact: true })).toBeVisible()
})
