import type { ArcaneBackgroundDefinition } from '@/types/handbook'

export const SWADE_ARCANE_BACKGROUNDS: readonly ArcaneBackgroundDefinition[] = [
  {
    id: 'Magic',
    name: 'Magic',
    description: 'Маги творят заклинания с помощью чистой магической энергии, ритуалов, слов силы и древних рун.',
    skillId: 'spellcasting',
  },
  {
    id: 'Miracles',
    name: 'Miracles',
    description: 'Чудотворцы получают сверхъестественные силы от божеств, духов или самой природы.',
    skillId: 'faith',
  },
  {
    id: 'Psionics',
    name: 'Psionics',
    description: 'Псионики используют ментальную энергию, чтобы читать мысли, перемещать предметы и воздействовать на мир.',
    skillId: 'psionics',
  },
  {
    id: 'SuperPowers',
    name: 'Super Powers',
    description: 'Врождённые сверхъестественные способности, не относящиеся к классической магии, чудесам или псионике.',
    skillId: 'talent',
  },
  {
    id: 'WeirdScience',
    name: 'Weird Science',
    description: 'Безумная наука позволяет создавать устройства, выходящие за пределы доступных технологий.',
    skillId: 'weird-science',
  },
]
