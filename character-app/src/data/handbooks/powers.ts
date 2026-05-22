import type { Power } from '@/types/handbook'

export const SWADE_POWERS: readonly Power[] = [
  {
    id: 'bolt',
    name: 'Bolt',
    arcaneBackground: ['Magic', 'Miracles', 'Psionics', 'WeirdScience'],
    ppCost: '1–6',
    range: '12/24/48',
    duration: 'Instant',
    description:
      'A projectile of raw energy. Costs 1 PP per bolt (up to 3 bolts), each dealing 2d6 damage. For 3 PP a single bolt deals 3d6.',
  },
  {
    id: 'blast',
    name: 'Blast',
    arcaneBackground: ['Magic', 'WeirdScience'],
    ppCost: '3–4',
    range: '24/48/96',
    duration: 'Instant',
    description:
      'An area effect attack affecting everyone in a Medium Burst Template. Deals 2d6 damage (3 PP) or 3d6 (4 PP).',
  },
  {
    id: 'healing',
    name: 'Healing',
    arcaneBackground: ['Magic', 'Miracles'],
    ppCost: '3',
    range: 'Touch',
    duration: 'Instant',
    description:
      'Heals up to 2 wounds on success, 3 on a raise. Must be used within the Golden Hour for the best results.',
  },
  {
    id: 'boost-lower-trait',
    name: 'Boost/Lower Trait',
    arcaneBackground: ['Magic', 'Miracles', 'Psionics'],
    ppCost: '2',
    range: 'Smarts',
    duration: '3 (1/round)',
    description:
      'Raises or lowers one of the target\'s Trait dice by one step on a success, two steps on a raise. Opposed by Spirit when used against unwilling targets.',
  },
  {
    id: 'deflection',
    name: 'Deflection',
    arcaneBackground: ['Magic', 'Miracles', 'Psionics'],
    ppCost: '2',
    range: 'Touch',
    duration: '3 (1/round)',
    description:
      'Attacks are deflected away from the target. Attackers suffer –2 to hit (–4 on a raise).',
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    arcaneBackground: ['Magic', 'Psionics'],
    ppCost: '5',
    range: 'Self',
    duration: '3 (1/round)',
    description:
      'The target becomes invisible. Attackers suffer –6 to hit (–4 if they can sense the target by other means). A raise extends the radius to nearby allies.',
  },
  {
    id: 'smite',
    name: 'Smite',
    arcaneBackground: ['Magic', 'Miracles', 'SuperPowers'],
    ppCost: '2',
    range: 'Touch',
    duration: '3 (1/round)',
    description:
      'Imbues a weapon with magical energy, adding +2 damage on success or +4 on a raise.',
  },
  {
    id: 'speed',
    name: 'Speed',
    arcaneBackground: ['Psionics', 'SuperPowers', 'WeirdScience'],
    ppCost: '1',
    range: 'Touch',
    duration: '3 (1/round)',
    description:
      'The target can move more quickly, doubling their Pace on success. On a raise they may also ignore Running penalties.',
  },
]
