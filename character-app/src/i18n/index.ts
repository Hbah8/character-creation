import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from './types'
import { SUPPORTED_LOCALES } from './types'

import enCommon from './locales/en/common'
import enHeader from './locales/en/header'
import enNavigation from './locales/en/navigation'
import enForm from './locales/en/form'
import enPreview from './locales/en/preview'
import enValidation from './locales/en/validation'
import enLibrary from './locales/en/library'
import enShare from './locales/en/share'
import enHandbooks from './locales/en/handbooks'
import enRaceBuilder from './locales/en/raceBuilder'

import ruCommon from './locales/ru/common'
import ruHeader from './locales/ru/header'
import ruNavigation from './locales/ru/navigation'
import ruForm from './locales/ru/form'
import ruPreview from './locales/ru/preview'
import ruValidation from './locales/ru/validation'
import ruLibrary from './locales/ru/library'
import ruShare from './locales/ru/share'
import ruHandbooks from './locales/ru/handbooks'
import ruRaceBuilder from './locales/ru/raceBuilder'

const LOCALE_STORAGE_KEY = 'swade-locale'

export function detectInitialLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved

  const browser = navigator.language.slice(0, 2) as Locale
  if (SUPPORTED_LOCALES.includes(browser)) return browser

  return 'en'
}

export function changeLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  void i18n.changeLanguage(locale)
}

const initialLocale = detectInitialLocale()

i18n
  .use(initReactI18next)
  .init({
    lng: initialLocale,
    fallbackLng: 'en',
    defaultNS: 'common',
    resources: {
      en: {
        common: enCommon,
        header: enHeader,
        navigation: enNavigation,
        form: enForm,
        preview: enPreview,
        validation: enValidation,
        library: enLibrary,
        share: enShare,
        handbooks: enHandbooks,
        raceBuilder: enRaceBuilder,
      },
      ru: {
        common: ruCommon,
        header: ruHeader,
        navigation: ruNavigation,
        form: ruForm,
        preview: ruPreview,
        validation: ruValidation,
        library: ruLibrary,
        share: ruShare,
        handbooks: ruHandbooks,
        raceBuilder: ruRaceBuilder,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
