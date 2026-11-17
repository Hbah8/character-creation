const LEGACY_ARCANE_BACKGROUND_IDS: Readonly<Record<string, string>> = {
  magic: 'Magic',
  miracles: 'Miracles',
  psionics: 'Psionics',
  gifted: 'SuperPowers',
  weirdScience: 'WeirdScience',
}

export function normalizeArcaneBackgroundId(id: string): string {
  return LEGACY_ARCANE_BACKGROUND_IDS[id] ?? id
}

export function getArcaneBackgroundLabel(
  background: { id: string; name: string; source?: 'system' | 'world' },
  translate: (key: ArcaneBackgroundSystemLabelKey) => string,
): string {
  const systemLabelKey = ARCANE_BACKGROUND_LABEL_KEYS[
    normalizeArcaneBackgroundId(background.id) as keyof typeof ARCANE_BACKGROUND_LABEL_KEYS
  ]
  return background.source === 'system' && systemLabelKey
    ? translate(systemLabelKey)
    : background.name
}
import { ARCANE_BACKGROUND_LABEL_KEYS } from '@/handbooks/utils/handbookTranslationKeys'

type ArcaneBackgroundSystemLabelKey = (typeof ARCANE_BACKGROUND_LABEL_KEYS)[keyof typeof ARCANE_BACKGROUND_LABEL_KEYS]

