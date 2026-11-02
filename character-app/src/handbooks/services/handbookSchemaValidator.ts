import Ajv, { type ErrorObject } from 'ajv'

const modifierSchema = {
  $id: '/character-creation/schemas/modifier.schema.json',
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'stat', 'amount'],
      properties: {
        type: { const: 'combat' },
        stat: { enum: ['pace', 'parry', 'toughness', 'armor', 'runningDieSteps', 'bennies', 'maxWounds', 'maxFatigue', 'powerPoints'] },
        amount: { type: 'number' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'attribute', 'amount'],
      properties: {
        type: { const: 'attribute-die-step' },
        attribute: { enum: ['agility', 'strength', 'smarts', 'spirit', 'vigor'] },
        amount: { type: 'integer' },
      },
    },
  ],
} as const

const edgeSchema = {
  $id: '/character-creation/schemas/edge.schema.json',
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'id', 'handbookCategory', 'name', 'description', 'type'],
      properties: {
        mode: { const: 'custom' },
        id: { type: 'string', minLength: 1 },
        handbookCategory: { const: 'edge' },
        name: { type: 'string' },
        description: { type: 'string' },
        type: { enum: ['Background', 'Combat', 'Leadership', 'Power', 'Professional', 'Social', 'Weird', 'WildCard'] },
        wildCardOnly: { type: 'boolean' },
        modifiers: { type: 'array', items: { $ref: '/character-creation/schemas/modifier.schema.json' } },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'id', 'handbookCategory'],
      properties: {
        mode: { const: 'override' },
        id: { type: 'string', minLength: 1 },
        handbookCategory: { const: 'edge' },
        name: { type: 'string' },
        description: { type: 'string' },
        type: { enum: ['Background', 'Combat', 'Leadership', 'Power', 'Professional', 'Social', 'Weird', 'WildCard'] },
        wildCardOnly: { type: 'boolean' },
        modifiers: { type: 'array', items: { $ref: '/character-creation/schemas/modifier.schema.json' } },
      },
    },
  ],
} as const

const weaponRangeSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'short', 'medium', 'long'],
      properties: {
        type: { const: 'bands' },
        short: { type: 'number', exclusiveMinimum: 0 },
        medium: { type: 'number', exclusiveMinimum: 0 },
        long: { type: 'number', exclusiveMinimum: 0 },
        extreme: { type: 'boolean' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['type'],
      properties: {
        type: { const: 'melee' },
        reach: { type: 'number', exclusiveMinimum: 0 },
      },
    },
  ],
} as const

const weaponSchema = {
  $id: '/character-creation/schemas/weapon.schema.json',
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'id', 'handbookCategory', 'name', 'description', 'category', 'damage'],
      properties: {
        mode: { const: 'custom' },
        id: { type: 'string', minLength: 1 },
        handbookCategory: { const: 'weapon' },
        name: { type: 'string' },
        description: { type: 'string' },
        category: { enum: ['Melee', 'Ranged', 'Thrown', 'Unarmed'] },
        damage: { type: 'string' },
        range: weaponRangeSchema,
        areaTemplate: { enum: ['cone', 'small', 'medium', 'large'] },
        ap: { type: 'number' },
        rof: { type: 'number' },
        weight: { type: 'number' },
        cost: { type: 'number' },
      },
      allOf: [{
        if: { properties: { category: { const: 'Thrown' } }, required: ['category'] },
        then: {
          properties: {
            range: {
              not: {
                properties: {
                  type: { const: 'bands' },
                  extreme: { const: true },
                },
                required: ['type', 'extreme'],
              },
            },
          },
        },
      }],
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'id', 'handbookCategory'],
      properties: {
        mode: { const: 'override' },
        id: { type: 'string', minLength: 1 },
        handbookCategory: { const: 'weapon' },
        name: { type: 'string' },
        description: { type: 'string' },
        category: { enum: ['Melee', 'Ranged', 'Thrown', 'Unarmed'] },
        damage: { type: 'string' },
        range: weaponRangeSchema,
        areaTemplate: { enum: ['cone', 'small', 'medium', 'large'] },
        ap: { type: 'number' },
        rof: { type: 'number' },
        weight: { type: 'number' },
        cost: { type: 'number' },
      },
      allOf: [{
        if: { properties: { category: { const: 'Thrown' } }, required: ['category'] },
        then: {
          properties: {
            range: {
              not: {
                properties: {
                  type: { const: 'bands' },
                  extreme: { const: true },
                },
                required: ['type', 'extreme'],
              },
            },
          },
        },
      }],
    },
  ],
} as const

const skillSchema = {
  $id: '/character-creation/schemas/skill.schema.json',
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'id', 'handbookCategory', 'name', 'description', 'linkedAttribute', 'isCore'],
      properties: {
        mode: { const: 'custom' },
        id: { type: 'string', minLength: 1 },
        handbookCategory: { const: 'skill' },
        name: { type: 'string' },
        description: { type: 'string' },
        linkedAttribute: { enum: ['agility', 'smarts', 'spirit', 'strength', 'vigor'] },
        isCore: { type: 'boolean' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'id', 'handbookCategory'],
      properties: {
        mode: { const: 'override' },
        id: { type: 'string', minLength: 1 },
        handbookCategory: { const: 'skill' },
        name: { type: 'string' },
        description: { type: 'string' },
        linkedAttribute: { enum: ['agility', 'smarts', 'spirit', 'strength', 'vigor'] },
        isCore: { type: 'boolean' },
      },
    },
  ],
} as const

const ajv = new Ajv({ allErrors: true, strict: false })
ajv.addSchema(modifierSchema)
const validateEdge = ajv.compile(edgeSchema)
const validateWeapon = ajv.compile(weaponSchema)
const validateSkill = ajv.compile(skillSchema)

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map(error => `${error.instancePath} ${error.message ?? 'invalid'}`.trim())
}

export function validateHandbookEntrySchema(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ['value must be an object']
  const handbookCategory = (raw as { handbookCategory?: unknown }).handbookCategory
  const validate = handbookCategory === 'weapon'
    ? validateWeapon
    : handbookCategory === 'skill'
      ? validateSkill
      : validateEdge
  return validate(raw) ? [] : formatErrors(validate.errors)
}