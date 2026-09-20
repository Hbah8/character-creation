import { describe, expect, it } from 'vitest'
import schemaText from '../../../public/schemas/character.schema.json?raw'

describe('character JSON schema', () => {
  it('describes combat modifiers without requiring derived combat fields', () => {
    const schema = JSON.parse(schemaText) as {
      required: string[]
      properties: Record<string, unknown>
      $defs: Record<string, unknown>
    }

    expect(schema.required).not.toContain('pace')
    expect(schema.required).not.toContain('parry')
    expect(schema.required).not.toContain('toughness')
    expect(schema.properties).toHaveProperty('combatModifiers')
    expect(schema.$defs).toHaveProperty('combatModifier')
  })

  it('describes race and power fields emitted by source-only character exports', () => {
    const schema = JSON.parse(schemaText) as {
      properties: Record<string, unknown>
      $defs: Record<string, unknown>
    }

    expect(schema.properties).toHaveProperty('raceId')
    expect(schema.properties).toHaveProperty('raceName')
    expect(schema.properties).toHaveProperty('size')
    expect(schema.properties).toHaveProperty('powers')
    expect(schema.$defs).toHaveProperty('characterPower')
    expect(schema.$defs).toHaveProperty('powerModifier')
  })
})