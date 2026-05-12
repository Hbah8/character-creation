import type { Character } from '@/types/character'
import type { Locale } from '@/i18n/types'
import { ruDefaultCharacter } from '@/i18n/locales/ru/defaults'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'

export function getDefaultCharacter(locale: Locale): Character {
  return locale === 'ru' ? ruDefaultCharacter : enDefaultCharacter
}

// Backward-compatible default export (Russian template)
export const defaultCharacter: Character = ruDefaultCharacter
