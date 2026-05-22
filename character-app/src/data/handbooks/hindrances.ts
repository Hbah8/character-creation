import type { Hindrance } from '@/types/handbook'

export const SWADE_HINDRANCES: readonly Hindrance[] = [
  // Major
  {
    id: 'arrogant',
    name: 'Arrogant',
    type: 'Major',
    description:
      'The hero believes he is the best and must prove it at every opportunity. He must challenge the leader of any group he joins and is insulted when not given the best assignments.',
  },
  {
    id: 'bad-eyes-major',
    name: 'Bad Eyes',
    type: 'Major',
    description:
      'Without corrective lenses the character suffers –2 to all Trait rolls dependent on vision at medium range or beyond. Lenses are lost or broken on a result of 1 on the Trait die.',
  },
  {
    id: 'blind',
    name: 'Blind',
    type: 'Major',
    description:
      'The character cannot see. He suffers –6 to all actions that require sight and –2 to social interactions with strangers who are not accustomed to blindness.',
  },
  {
    id: 'clueless',
    name: 'Clueless',
    type: 'Major',
    description:
      'Lacking common sense, the hero suffers –2 to Common Knowledge rolls and is frequently unaware of what is happening around him.',
  },
  {
    id: 'code-of-honor',
    name: 'Code of Honor',
    type: 'Major',
    description:
      'The character takes great pride in acting morally and honorably. He keeps his word, never attacks or harms an unarmed foe, and so on.',
  },
  {
    id: 'delusional-major',
    name: 'Delusional',
    type: 'Major',
    description:
      'Something has twisted the hero\'s perception of the world. He believes something that is not true and acts upon it in a way that is sometimes dangerous.',
  },
  // Minor
  {
    id: 'all-thumbs',
    name: 'All Thumbs',
    type: 'Minor',
    description:
      'The hero has trouble with modern devices. He suffers –2 to Repair rolls and when he rolls a 1 on the Trait die the device is broken.',
  },
  {
    id: 'anemic',
    name: 'Anemic',
    type: 'Minor',
    description:
      'The character is frail and loses Fatigue more easily. He rolls Vigor at –2 whenever he must make Fatigue checks.',
  },
  {
    id: 'bad-eyes-minor',
    name: 'Bad Eyes (Minor)',
    type: 'Minor',
    description:
      'Without corrective lenses the character suffers –1 to all Trait rolls dependent on vision. Lenses are lost or broken on a result of 1 on the Trait die.',
  },
  {
    id: 'cautious',
    name: 'Cautious',
    type: 'Minor',
    description:
      'The character plans excessively before acting. He rarely takes chances and never acts rashly or without careful deliberation.',
  },
  {
    id: 'curious',
    name: 'Curious',
    type: 'Minor',
    description:
      'The hero is naturally inquisitive and must investigate every mystery, puzzle, or unusual object he comes across.',
  },
  {
    id: 'loyal',
    name: 'Loyal',
    type: 'Minor',
    description:
      'The hero is completely loyal to his friends and allies. He would never betray them and goes out of his way to help them in any situation.',
  },
]
