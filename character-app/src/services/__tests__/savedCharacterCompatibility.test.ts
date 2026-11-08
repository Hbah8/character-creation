import { describe, expect, it } from 'vitest'
import richCharacterFixture from '../../../../backend/src/test/resources/fixtures/character-rich.json'
import { createCharacterExportPayload } from '@/services/exportService'
import { validateCharacterImport } from '@/services/validateImport'

describe('saved character JSON compatibility', () => {
  it('preserves nested and user-defined values across export, import, and export', () => {
    const firstExport = createCharacterExportPayload(validateCharacterImport(richCharacterFixture))
    const imported = validateCharacterImport(JSON.parse(JSON.stringify(firstExport)))
    const secondExport = createCharacterExportPayload(imported)

    expect(secondExport).toEqual(firstExport)
  })
})
