import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CharacterSheet } from '@/components/preview/CharacterSheet'
import type { Character } from '@/types/character'

const SOURCE_CHARACTER: Character = {
  sheetTitle: 'Test', callsign: 'ACE', name: 'Test Name', rank: 'Novice', role: '', fileNo: '', portraitUrl: '',
  isWildCard: false,
  agility: 'd6', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6',
  pace: '99', parry: '99', toughness: '99', armor: '99',
  bennies: '3', wounds: '0', fatigue: '0', mana: '0', notes: '',
  skills: [], edges: [], hindrances: [], weapons: [], gear: [], specialRules: [], powers: [],
}

describe('CharacterSheet', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders source data with explicit effective attributes and combat output', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CharacterSheet, {
      resolvedCharacter: {
        source: SOURCE_CHARACTER,
        attributes: { agility: 'd8', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6' },
        skills: [],
        edges: [{
          id: 'vigilant-row',
          edgeId: 'bditelnost',
          name: 'Vigilant',
          description: 'Notice every detail.',
          type: 'Background',
          source: 'system',
        }],
        hindrances: [],
        modifierBreakdown: [],
        combat: {
          pace: 6,
          parry: 5,
          toughness: 7,
          armor: 2,
          runningDie: 'd8',
          size: 0,
          bennies: 3,
          maxWounds: 3,
          maxFatigue: 2,
          powerPoints: 0,
        },
      },
    }))

    expect(html).toContain('AGILITY d8')
    expect(html).toContain('7 (2)')
    expect(html).toContain('Vigilant')
    expect(html).toContain('Notice every detail.')
    expect(html).not.toContain('99')
  })

  it('renders the compact shell with fixed marks and ammunition strips', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('ru')

    const html = renderToStaticMarkup(createElement(CharacterSheet, {
      resolvedCharacter: {
        source: {
          ...SOURCE_CHARACTER,
          gear: ['Medkit', 'Rations'],
          notes: 'Background first line.\nSecond line.\n\n1. First note\n2. **Second note**',
          specialRules: [{
            id: 'special-rule',
            name: 'Лазерный резак',
            description: 'Имеет два режима:\n\n- Режет **металлические решётки** и листы.\n- Стрельба лазерными пучками на короткую дистанцию.',
          }],
          weapons: [
            {
              id: 'rifle',
              name: 'Sturmgewehr',
              range: { type: 'bands', short: 24, medium: 48, long: 96, extreme: true },
              damage: '2d8+1',
              ap: '2',
              rof: '3',
              magazine: '30',
              areaTemplate: 'cone',
            },
            {
              id: 'pistol',
              name: 'Pistole',
              range: '12/24/48',
              damage: '2d6',
              ap: '1',
              rof: '1',
              magazine: '10',
            },
          ],
        },
        attributes: { agility: 'd8', strength: 'd6', smarts: 'd6', spirit: 'd6', vigor: 'd6' },
        skills: [],
        edges: [{
          id: 'compact-edge',
          edgeId: 'bditelnost',
          name: 'Vigilant',
          description: 'Notice every detail.',
          type: 'Background',
          source: 'system',
        }],
        hindrances: [{
          id: 'compact-hindrance',
          name: 'Bad Eyes',
          severity: 'minor',
          description: 'Needs corrective lenses.',
        }],
        modifierBreakdown: [],
        combat: {
          pace: 6,
          parry: 5,
          toughness: 7,
          armor: 2,
          runningDie: 'd8',
          size: 0,
          bennies: 3,
          maxWounds: 3,
          maxFatigue: 2,
          powerPoints: 0,
        },
      },
      templateId: 'compact',
      printMode: true,
    }))

    expect(html).toContain('sheet--compact')
    expect(html).toContain('Отметки')
    expect(html).toContain('compact-mark-row')
    expect(html).toContain('compact-mark-group--effects')
    expect(html).toContain('Заметки · боеприпасы')
    expect(html).toContain('compact-notes-writing-area')
    expect(html).not.toContain('compact-notes-blank-lines')
    expect(html).not.toContain('compact-notes-lines')
    expect(html).toContain('Sturmgewehr')
    expect(html).toContain('24/48/96 (Предельная дистанция)')
    expect(html).toContain('Конус')
    expect(html).not.toContain('[object Object]')
    expect(html).toContain('data-ammo-capacity="30"')
    expect(html).toContain('--ammo-width:96mm')
    expect(html).toContain('--ammo-width:32mm')
    expect(html).toContain('compact-gear-list')
    expect(html.match(/compact-markerless-item/g)).toHaveLength(3)
    expect(html).toContain('<p class="item">Medkit</p>')
    expect(html).toContain('quick-stats--compact')
    expect(html).toContain('compact-special-rule')
    expect(html).toContain('Имеет два режима:')
    expect(html).toContain('<ul>')
    expect(html).toContain('<strong>металлические решётки</strong>')
    expect(html).toContain('Background first line.<br/>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<strong>Second note</strong>')
    expect(html).toContain('class="quick-stat quick-stat--power-points"')
    expect(html.match(/class="quick-stat(?: quick-stat--power-points)?"/g)).toHaveLength(6)
    expect(html).toContain('data-ammo-width="96mm"')
    expect(html).toContain('data-ammo-width="32mm"')
    expect(html.indexOf('compact-attributes-skills')).toBeLessThan(html.indexOf('compact-marks'))
    expect(html.indexOf('compact-marks')).toBeLessThan(html.indexOf('class="columns"'))
    expect(html).not.toContain('sheet-scale-wrapper')
    expect(html).not.toContain('transform:')
    expect(html).not.toContain('zoom:')
  })
})