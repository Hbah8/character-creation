import type { Character } from '@/types/character'
import { DEFAULT_LAYOUT } from '@/types/character'
import type { World } from '@/world/types'
import { WORLD_SCHEMA_VERSION } from '@/world/types'

export const enDefaultCharacter: Character = {
  sheetTitle: 'Character Sheet',
  callsign: 'CALLSIGN',
  name: 'First Last',
  rank: 'Veteran',
  role: 'Assault Trooper',
  fileNo: 'WLF-██-001',
  portraitUrl: '',
  isWildCard: true,

  agility: 'd8',
  strength: 'd6',
  smarts: 'd8',
  spirit: 'd6',
  vigor: 'd8',

  pace: '6',
  parry: '6',
  toughness: '8 (2)',
  armor: '2',
  combatModifiers: [{ id: 'default-armor', source: 'equipment', name: 'Body armor', armor: 2 }],

  skills: [
    { id: '1', skillKey: 'shooting', die: 'd10' },
    { id: '2', skillKey: 'fighting', die: 'd8' },
    { id: '3', skillKey: 'athletics', die: 'd8' },
    { id: '4', skillKey: 'notice', die: 'd8' },
    { id: '5', skillKey: 'stealth', die: 'd6' },
    { id: '6', skillKey: 'intimidation', die: 'd6' },
    { id: '7', skillKey: 'repair', die: 'd6' },
    { id: '8', skillKey: 'driving', die: 'd6' },
    { id: '9', skillKey: 'healing', die: 'd4' },
    { id: '10', skillKey: 'common-knowledge', die: 'd6' },
    { id: '11', skillKey: 'persuasion', die: 'd4' },
  ],

  edges: [
    { id: '1', edgeId: 'hladnokrovie' },
    { id: '2', edgeId: 'metkiy-strelok' },
    { id: '3', edgeId: 'boevaya-zakalka' },
    { id: '4', edgeId: 'komandnyy-golos' },
  ],

  hindrances: [
    { id: '1', hindranceId: 'zhazhda-krovi' },
    { id: '2', hindranceId: 'obyazatelstva-minor' },
    { id: '3', hindranceId: 'vrag-minor' },
  ],

  weapons: [
    { id: '1', name: 'Sturmgewehr', range: '24/48/96', damage: '2d8+1', ap: '2', rof: '3', magazine: '30' },
    { id: '2', name: 'Pistole', range: '12/24/48', damage: '2d6', ap: '1', rof: '1', magazine: '10' },
    { id: '3', name: 'Kampfmesser', range: 'melee', damage: 'Str+d4', ap: '-', rof: '-', magazine: '-' },
  ],

  gear: [
    'Body armor, helmet, radio.',
    'First aid kit, tourniquet, flashlight.',
    'Grenades x2, smoke grenade x1.',
    'Breaching tool / technical kit.',
  ],

  specialRules: [
    { id: '1', name: 'Heavy Armor', description: 'Already factored into Toughness; recalculate if armor is removed.' },
    { id: '2', name: 'Burst Fire', description: 'Use weapon RoF; track ammo consumption in the notes field.' },
    { id: '3', name: 'Suppression Zone', description: 'Requires available ammunition and line of sight.' },
  ],

  powers: [],

  notes: '',

  layout: DEFAULT_LAYOUT,
}

export const enDefaultWorld: World = {
  schemaVersion: WORLD_SCHEMA_VERSION,
  name: 'New World',
  summary: '',
  settingRules: {
    skillPointsBudget: 12,
    attributePointsBudget: 5,
    racePointsBudget: 2,
  },
  races: [],
  worldHandbook: [],
  entities: [
    {
      id: 'default-location',
      type: 'location',
      title: 'Starting Location',
      summary: 'The first important place in the campaign.',
      description: '',
      tags: [],
      position: { x: 120, y: 120 },
    },
    {
      id: 'default-faction',
      type: 'faction',
      title: 'Local Faction',
      summary: 'A group with influence over the starting situation.',
      description: '',
      tags: [],
      position: { x: 420, y: 120 },
    },
  ],
  relationships: [],
}
