import type { RacialAbility } from '@/types/handbook'

export const SWADE_RACIAL_ABILITIES: readonly RacialAbility[] = [
  // Positive
  {
    id: 'agile',
    name: 'Agile',
    type: 'positive',
    points: 2,
    description:
      'The race is naturally nimble. Their Agility attribute starts at d6 instead of d4.',
  },
  {
    id: 'aquatic',
    name: 'Aquatic',
    type: 'positive',
    points: 2,
    description:
      'The race can breathe water as easily as air and swims at their full Pace. They suffer no movement penalties underwater.',
  },
  {
    id: 'infravision',
    name: 'Infravision',
    type: 'positive',
    points: 1,
    description:
      'The hero can see heat signatures in darkness, halving all penalties for Dim and Dark illumination when tracking or targeting warm-blooded creatures.',
  },
  {
    id: 'low-light-vision',
    name: 'Low Light Vision',
    type: 'positive',
    points: 1,
    description:
      'The character ignores penalties for Dim and Dark lighting conditions, seeing clearly in all but complete darkness.',
  },
  {
    id: 'natural-armor',
    name: 'Natural Armor (+2)',
    type: 'positive',
    points: 2,
    description:
      'The hero has thick scales, hide, or other natural protection, providing +2 Armor.',
  },
  {
    id: 'keen-senses',
    name: 'Keen Senses',
    type: 'positive',
    points: 1,
    description:
      'The race has exceptionally sharp senses. They add +2 to Notice rolls and ignore one point of penalties from darkness or concealment.',
  },
  // Negative
  {
    id: 'outsider',
    name: 'Outsider',
    type: 'negative',
    points: -1,
    description:
      'The hero is considered an outsider by the dominant culture. He suffers –2 to Persuasion rolls when dealing with members of that culture.',
  },
  {
    id: 'big',
    name: 'Big',
    type: 'negative',
    points: -2,
    description:
      'The character is Large-sized. Equipment costs 20% more and the hero is very difficult to conceal or dress in standard armour.',
  },
  {
    id: 'dependency',
    name: 'Dependency',
    type: 'negative',
    points: -2,
    description:
      'The race requires some unusual sustenance — sunlight, blood, a specific element — once per day. Failure to meet this need causes a level of Fatigue each day.',
  },
  {
    id: 'weakness-common',
    name: 'Weakness (Common)',
    type: 'negative',
    points: -1,
    description:
      'The creature has a common Weakness (iron, fire, holy water, etc.) that deals +4 damage when exploited.',
  },
]
