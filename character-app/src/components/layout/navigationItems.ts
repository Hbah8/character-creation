import { BookOpen, Globe2, Map, Music2, ShieldIcon, Swords, Users, UserRound } from 'lucide-react'

export const NAV_ITEMS = [
  { labelKey: 'characters', href: '/', icon: Users, requiresWorld: false },
  { labelKey: 'worlds', href: '/worlds', icon: Globe2, requiresWorld: false },
  { labelKey: 'combat', href: '/combat', icon: Swords, requiresWorld: false },
  { labelKey: 'handbooks', href: '/handbooks', icon: BookOpen, requiresWorld: false },
  { labelKey: 'raceBuilder', href: '/races', icon: ShieldIcon, requiresWorld: true },
  { labelKey: 'audio', href: '/audio', icon: Music2, requiresWorld: true },
  { labelKey: 'maps', href: '/maps', icon: Map, requiresWorld: true },
  { labelKey: 'account', href: '/account', icon: UserRound, requiresWorld: false },
] as const
