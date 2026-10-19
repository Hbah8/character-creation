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

  it('requires strict skill catalog references without legacy display mechanics', () => {
    const schema = JSON.parse(schemaText) as {
      $defs: Record<string, { required: string[], properties: Record<string, unknown> }>
    }
    const skill = schema.$defs.skill

    expect(skill.required).toEqual(['id', 'skillKey', 'die'])
    expect(skill.properties).not.toHaveProperty('name')
    expect(skill.properties).not.toHaveProperty('linkedAttribute')
    expect(skill.properties).not.toHaveProperty('isStarter')
  })

  it('requires strict edge catalog references and character eligibility fields', () => {
    const schema = JSON.parse(schemaText) as {
      required: string[]
      properties: Record<string, unknown>
      $defs: Record<string, { required: string[], properties: Record<string, unknown> }>
    }
    const edge = schema.$defs.edge

    expect(schema.required).toContain('isWildCard')
    expect(schema.properties).toHaveProperty('arcaneBackground')
    expect(edge.required).toEqual(['id', 'edgeId'])
    expect(edge.properties).not.toHaveProperty('name')
    expect(edge.properties).not.toHaveProperty('effect')
  })

  it('restricts character rank to canonical SWADE rank keys', () => {
    const schema = JSON.parse(schemaText) as {
      properties: Record<string, { enum?: string[] }>
    }

    expect(schema.properties.rank.enum).toEqual(['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary'])
  })
})