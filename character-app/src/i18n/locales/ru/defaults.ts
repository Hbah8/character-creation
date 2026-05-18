import type { Character } from '@/types/character'
import { DEFAULT_LAYOUT } from '@/types/character'
import type { World } from '@/world/types'
import { WORLD_SCHEMA_VERSION } from '@/world/types'

export const ruDefaultCharacter: Character = {
  sheetTitle: 'Лист персонажа',
  callsign: 'KRIEG',
  name: 'Имя Фамилия',
  rank: 'Ветеран',
  role: 'Штурмовик',
  fileNo: 'WLF-██-001',
  portraitUrl: '',

  agility: 'd8',
  strength: 'd6',
  smarts: 'd8',
  spirit: 'd6',
  vigor: 'd8',

  pace: '6',
  parry: '6',
  toughness: '8 (2)',
  bennies: '3',
  wounds: '0 / 3',
  fatigue: '0 / 2',
  mana: '-',

  skills: [
    { id: '1', name: 'Стрельба', die: 'd10', linkedAttribute: 'agility', isStarter: false },
    { id: '2', name: 'Драка', die: 'd8', linkedAttribute: 'agility', isStarter: false },
    { id: '3', name: 'Атлетика', die: 'd8', linkedAttribute: 'agility', isStarter: false },
    { id: '4', name: 'Внимание', die: 'd8', linkedAttribute: 'smarts', isStarter: false },
    { id: '5', name: 'Скрытность', die: 'd6', linkedAttribute: 'agility', isStarter: false },
    { id: '6', name: 'Запугивание', die: 'd6', linkedAttribute: 'spirit', isStarter: false },
    { id: '7', name: 'Ремонт', die: 'd6', linkedAttribute: 'smarts', isStarter: false },
    { id: '8', name: 'Вождение', die: 'd6', linkedAttribute: 'agility', isStarter: false },
    { id: '9', name: 'Лечение', die: 'd4', linkedAttribute: 'smarts', isStarter: false },
    { id: '10', name: 'Общие знания', die: 'd6', linkedAttribute: 'smarts', isStarter: false },
  ],

  edges: [
    { id: '1', name: 'Хладнокровие', effect: 'в начале раунда бери две карты действия, выбирай одну.' },
    { id: '2', name: 'Меткий стрелок', effect: '+2 к Стрельбе, если не двигался в этом ходу.' },
    { id: '3', name: 'Боевая закалка', effect: '+1 к Стойкости.' },
    { id: '4', name: 'Командная подготовка', effect: '+1 к поддержке союзника в пределах связи.' },
  ],

  hindrances: [
    { id: '1', name: 'Кровожадность', severity: 'major', description: 'склонен добивать врагов и идти на жесткие решения.' },
    { id: '2', name: 'Долг', severity: 'minor', description: 'обязан выполнять приказы своей структуры.' },
    { id: '3', name: 'Враг', severity: 'minor', description: 'за оператором охотится конкретная сторона конфликта.' },
  ],

  weapons: [
    { id: '1', name: 'Sturmgewehr', range: '24/48/96', damage: '2d8+1', ap: '2', rof: '3', magazine: '30' },
    { id: '2', name: 'Pistole', range: '12/24/48', damage: '2d6', ap: '1', rof: '1', magazine: '10' },
    { id: '3', name: 'Kampfmesser', range: 'ближ.', damage: 'Сил+d4', ap: '-', rof: '-', magazine: '-' },
  ],

  gear: [
    'Бронежилет, шлем, рация.',
    'Аптечка, турникет, фонарь.',
    'Гранаты x2, дымовая граната x1.',
    'Инструмент для вскрытия / технический набор.',
  ],

  specialRules: [
    { id: '1', name: 'Тяжелая броня', description: 'уже учтена в Стойкости; при снятии брони пересчитать защиту.' },
    { id: '2', name: 'Очередь', description: 'используй RoF оружия; расход патронов отмечай в поле заметок.' },
    { id: '3', name: 'Сектор подавления', description: 'работает только при наличии боеприпасов и линии огня.' },
  ],

  notes: '',

  layout: DEFAULT_LAYOUT,
}

export const ruDefaultWorld: World = {
  schemaVersion: WORLD_SCHEMA_VERSION,
  name: 'Новый мир',
  summary: '',
  entities: [
    {
      id: 'default-location',
      type: 'location',
      title: 'Стартовая локация',
      summary: 'Первое важное место кампании.',
      description: '',
      tags: [],
      position: { x: 120, y: 120 },
    },
    {
      id: 'default-faction',
      type: 'faction',
      title: 'Местная фракция',
      summary: 'Группа, влияющая на стартовую ситуацию.',
      description: '',
      tags: [],
      position: { x: 420, y: 120 },
    },
  ],
  relationships: [],
}
