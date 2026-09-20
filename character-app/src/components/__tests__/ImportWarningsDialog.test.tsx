import { describe, expect, it } from 'vitest'
import { getImportWarningTranslationKey } from '@/components/ImportWarningsDialog'

describe('ImportWarningsDialog', () => {
  it('maps the legacy armor conflict to its localized warning key', () => {
    expect(getImportWarningTranslationKey('validation.import.legacyArmorConflict')).toBe('import.legacyArmorConflict')
  })
})