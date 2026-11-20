import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SkillsForm } from '@/components/form/SkillsForm'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'

describe('SkillsForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders catalog-backed skill data without manual skill mechanics controls', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SkillsForm, {
      skills: enDefaultCharacter.skills,
      character: enDefaultCharacter,
      onAdd: vi.fn(),
      onUpdate: vi.fn(),
      onRemove: vi.fn(),
    }))

    expect(html).toContain('Стрельба')
    expect(html).toContain('Select a skill')
    expect(html).toContain('min-w-0 max-w-full')
    expect(html).toContain('>Agility</span>')
    expect(html).toContain('>Core</span>')
    expect(html).not.toMatch(/class="[^"]*\btruncate\b/)
    expect(html).toContain('data-size="icon-sm"')
    expect(html).not.toContain('Skill name')
    expect(html).not.toContain('type="checkbox"')
  })

  it('renders character skills in linked-attribute order and alphabetically within each group', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SkillsForm, {
      skills: [...enDefaultCharacter.skills].reverse(),
      character: enDefaultCharacter,
      onAdd: vi.fn(),
      onUpdate: vi.fn(),
      onRemove: vi.fn(),
    }))
    const orderedNames = [
      'Атлетика',
      'Вождение',
      'Драка',
      'Скрытность',
      'Стрельба',
      'Внимание',
      'Лечение',
      'Осведомлённость',
      'Ремонт',
      'Запугивание',
      'Убеждение',
    ]

    const positions = orderedNames.map(name => html.indexOf(`>${name}</span>`))
    expect(positions.every(position => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })
})
