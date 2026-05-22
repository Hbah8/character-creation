export type Locale = 'ru' | 'en'

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'en']

// Module augmentation for i18next typed keys
import type enCommon from './locales/en/common'
import type enHeader from './locales/en/header'
import type enNavigation from './locales/en/navigation'
import type enForm from './locales/en/form'
import type enPreview from './locales/en/preview'
import type enValidation from './locales/en/validation'
import type enLibrary from './locales/en/library'
import type enShare from './locales/en/share'
import type enHandbooks from './locales/en/handbooks'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof enCommon
      header: typeof enHeader
      navigation: typeof enNavigation
      form: typeof enForm
      preview: typeof enPreview
      validation: typeof enValidation
      library: typeof enLibrary
      share: typeof enShare
      handbooks: typeof enHandbooks
    }
  }
}
