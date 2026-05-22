import type { Edge } from '@/types/handbook'

export const SWADE_EDGES: readonly Edge[] = [
  // Background
  {
    id: 'luck',
    name: 'Luck',
    type: 'Background',
    description:
      'The hero draws one additional benny per game session. This Edge may be taken twice (as Great Luck), granting two extra bennies.',
  },
  {
    id: 'rich',
    name: 'Rich',
    type: 'Background',
    description:
      'The character starts with $1,500 and maintains a comfortable lifestyle without needing to track day-to-day expenses.',
  },
  // Combat
  {
    id: 'block',
    name: 'Block',
    type: 'Combat',
    description: 'The hero is skilled at defense. They add +1 to their Parry.',
    requirements: { rank: 'Seasoned', skills: { Fighting: 'd8' } },
  },
  {
    id: 'counterattack',
    name: 'Counterattack',
    type: 'Combat',
    description:
      'Once per round, when a foe fails a Fighting attack against the hero, she may immediately make a free attack at –2.',
    requirements: { rank: 'Seasoned', skills: { Fighting: 'd8' } },
  },
  // Leadership
  {
    id: 'command',
    name: 'Command',
    type: 'Leadership',
    description:
      'The hero is a capable leader who inspires his troops. Allies within Command Range who can see and hear him may reroll their Shaken recovery rolls.',
    requirements: { attributes: { Smarts: 'd6' } },
  },
  {
    id: 'inspire',
    name: 'Inspire',
    type: 'Leadership',
    description:
      'The commander is adept at inspiring those under his command. All allies within Command Range add +1 to their Trait rolls.',
    requirements: { rank: 'Seasoned', edges: ['command'] },
  },
  // Power
  {
    id: 'channeling',
    name: 'Channeling',
    type: 'Power',
    description:
      'The hero has learned to tap into ambient magical energy. Once per round they may reduce the Power Point cost of a power by 1 (minimum 1).',
    requirements: { rank: 'Seasoned', edges: ['arcane-background'] },
  },
  {
    id: 'rapid-recharge',
    name: 'Rapid Recharge',
    type: 'Power',
    description:
      'The hero recovers 1 Power Point per 30 minutes of rest rather than the usual 1 per hour.',
    requirements: { rank: 'Seasoned', attributes: { Spirit: 'd6' }, edges: ['arcane-background'] },
  },
  // Professional
  {
    id: 'ace',
    name: 'Ace',
    type: 'Professional',
    description:
      'Aces are as comfortable piloting a vehicle as most people are sitting in a chair. They may spend bennies to make Soak rolls for their vehicles.',
    requirements: { attributes: { Agility: 'd8' } },
  },
  {
    id: 'mcgyver',
    name: 'McGyver',
    type: 'Professional',
    description:
      'The hero can cobble together improvised devices from whatever is at hand. With a Repair roll they can create a temporary gadget for a single use.',
    requirements: {
      attributes: { Smarts: 'd6' },
      skills: { Repair: 'd6', Notice: 'd8' },
    },
  },
  // Social
  {
    id: 'charismatic',
    name: 'Charismatic',
    type: 'Social',
    description:
      'The hero is likable and trustworthy. He gains +2 to Persuasion rolls.',
    requirements: { attributes: { Spirit: 'd8' } },
  },
  {
    id: 'connections',
    name: 'Connections',
    type: 'Social',
    description:
      'The hero has contacts who can provide aid in various ways — information, equipment, or muscle — when called upon.',
  },
  // Weird
  {
    id: 'beast-bond',
    name: 'Beast Bond',
    type: 'Weird',
    description:
      'The character has a deep empathy with animals. Beasts under his care gain +2 to all Trait rolls.',
  },
  {
    id: 'danger-sense',
    name: 'Danger Sense',
    type: 'Weird',
    description:
      'The hero has an uncanny ability to sense when something bad is about to happen. He may make a Notice roll at –2 to detect ambushes or surprise attacks.',
    requirements: { skills: { Notice: 'd6' } },
  },
  // WildCard
  {
    id: 'sidekick',
    name: 'Sidekick',
    type: 'WildCard',
    description:
      'The hero has a loyal companion who counts as a Wild Card with their own Advances and personal development arc.',
    requirements: { rank: 'Seasoned' },
  },
]
