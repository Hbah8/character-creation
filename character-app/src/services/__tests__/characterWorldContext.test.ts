import { describe, expect, it } from 'vitest'
import characterFixture from '../../../../backend/src/test/resources/fixtures/character-rich.json'
import { validateCharacterImport } from '@/services/validateImport'
import { attachActiveWorldToNewCharacter } from '@/services/characterWorldContext'

const character = validateCharacterImport(characterFixture)

describe('attachActiveWorldToNewCharacter', () => {
  it('links only an unlinked new character to the active world', () => {
    expect(attachActiveWorldToNewCharacter(character, 'world-1').worldId).toBe('world-1')
    expect(attachActiveWorldToNewCharacter(character, null)).toBe(character)
    expect(attachActiveWorldToNewCharacter({ ...character, worldId: 'world-2' }, 'world-1').worldId)
      .toBe('world-2')
  })
})
