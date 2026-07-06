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

  agility: 'd8',
  strength: 'd6',
  smarts: 'd8',
  spirit: 'd6',
  vigor: 'd8',

  pace: '6',
  parry: '6',
  toughness: '8 (2)',
  armor: '2',
  bennies: '3',
  wounds: '0 / 3',
  fatigue: '0 / 2',
  mana: '-',

  skills: [
    { id: '1', name: 'Shooting', die: 'd10', linkedAttribute: 'agility', isStarter: false },
    { id: '2', name: 'Fighting', die: 'd8', linkedAttribute: 'agility', isStarter: false },
    { id: '3', name: 'Athletics', die: 'd8', linkedAttribute: 'agility', isStarter: false },
    { id: '4', name: 'Notice', die: 'd8', linkedAttribute: 'smarts', isStarter: false },
    { id: '5', name: 'Stealth', die: 'd6', linkedAttribute: 'agility', isStarter: false },
    { id: '6', name: 'Intimidation', die: 'd6', linkedAttribute: 'spirit', isStarter: false },
    { id: '7', name: 'Repair', die: 'd6', linkedAttribute: 'smarts', isStarter: false },
    { id: '8', name: 'Driving', die: 'd6', linkedAttribute: 'agility', isStarter: false },
    { id: '9', name: 'Healing', die: 'd4', linkedAttribute: 'smarts', isStarter: false },
    { id: '10', name: 'Common Knowledge', die: 'd6', linkedAttribute: 'smarts', isStarter: false },
  ],

  edges: [
    { id: '1', name: 'Level Headed', effect: 'Draw two action cards at the start of the round, choose one.' },
    { id: '2', name: 'Marksman', effect: '+2 to Shooting if you did not move this turn.' },
    { id: '3', name: 'Combat Hardened', effect: '+1 to Toughness.' },
    { id: '4', name: 'Team Tactics', effect: '+1 to support an ally within communication range.' },
  ],

  hindrances: [
    { id: '1', name: 'Bloodthirsty', severity: 'major', description: 'Prone to finishing off enemies and making harsh decisions.' },
    { id: '2', name: 'Duty', severity: 'minor', description: 'Obligated to follow orders from their organization.' },
    { id: '3', name: 'Enemy', severity: 'minor', description: 'A specific faction is hunting the operator.' },
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
