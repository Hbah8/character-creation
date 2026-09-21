import { describe, it, expect } from 'vitest'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_EDGE_REQUIREMENTS } from '@/data/handbooks/edgeRequirements'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import { SWADE_SKILLS } from '@/data/handbooks/skills'
import { SWADE_WEAPONS } from '@/data/handbooks/weapons'
import { SWADE_GEAR } from '@/data/handbooks/gear'
import { SWADE_POWERS } from '@/data/handbooks/powers'
import { SWADE_MOUNTS } from '@/data/handbooks/mounts'
import { SWADE_RACIAL_ABILITIES } from '@/data/handbooks/racialAbilities'
import type {
  Edge,
  Hindrance,
  Weapon,
  Gear,
  Power,
  Mount,
  RacialAbility,
  EdgeType,
  MountCategory,
  ArcaneBackground,
  AttributeKey,
  SkillDefinition,
} from '@/types/handbook'

// --- helpers ---

function hasRequiredFields(entry: { id: string; name: string; description: string }) {
  expect(entry.id, 'id must be defined').toBeDefined()
  expect(entry.id, 'id must be non-empty string').not.toBe('')
  expect(entry.name, 'name must be defined').toBeDefined()
  expect(entry.name, 'name must be non-empty string').not.toBe('')
  expect(entry.description, 'description must be defined').toBeDefined()
}

function hasUniqueIds(arr: readonly { id: string }[], label: string) {
  const ids = arr.map(e => e.id)
  const unique = new Set(ids)
  expect(unique.size, `${label} IDs must be unique`).toBe(ids.length)
}

function collectSkillRequirementIds(requirements: typeof SWADE_EDGE_REQUIREMENTS): Set<string> {
  const skillIds = new Set<string>()
  for (const edgeRequirements of Object.values(requirements)) {
    for (const requirement of edgeRequirements.allOf) {
      const conditions = 'anyOf' in requirement ? requirement.anyOf : [requirement]
      for (const condition of conditions) {
        if (condition.type === 'skill') skillIds.add(condition.skill)
      }
    }
  }
  return skillIds
}

// --- SKILLS ---

describe('SWADE_SKILLS', () => {
  it('contains the five core skills and every skill ID used by Edge requirements', () => {
    const skillIds = new Set(SWADE_SKILLS.map(skill => skill.id))

    expect(SWADE_SKILLS.filter(skill => skill.isCore).map(skill => skill.id).sort()).toEqual([
      'athletics', 'common-knowledge', 'notice', 'persuasion', 'stealth',
    ])
    expect([...collectSkillRequirementIds(SWADE_EDGE_REQUIREMENTS)].every(id => skillIds.has(id))).toBe(true)
  })

  it('uses a valid linked attribute and unique stable ID for every skill', () => {
    const attributes: AttributeKey[] = ['agility', 'smarts', 'spirit', 'strength', 'vigor']

    SWADE_SKILLS.forEach(hasRequiredFields)
    hasUniqueIds(SWADE_SKILLS, 'SWADE_SKILLS')
    SWADE_SKILLS.forEach((skill: SkillDefinition) => {
      expect(attributes).toContain(skill.linkedAttribute)
    })
  })
})

// --- EDGES ---

describe('SWADE_EDGES', () => {
  it('is non-empty', () => {
    expect(SWADE_EDGES.length).toBeGreaterThan(0)
  })

  it('every entry has required fields', () => {
    SWADE_EDGES.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_EDGES, 'SWADE_EDGES')
  })

  it('every entry has a valid type discriminator', () => {
    const validTypes: EdgeType[] = [
      'Background', 'Combat', 'Leadership', 'Power',
      'Professional', 'Social', 'Weird', 'WildCard',
    ]
    SWADE_EDGES.forEach(edge => {
      expect(validTypes, `Edge "${edge.id}" has unknown type "${edge.type}"`).toContain(edge.type)
    })
  })

  it('covers at least 7 of the 8 EdgeTypes', () => {
    const types = new Set(SWADE_EDGES.map((e: Edge) => e.type))
    expect(types.size).toBeGreaterThanOrEqual(7)
  })

  it('defines normalized requirements for compound baseline prerequisites', () => {
    const edgeById = new Map(SWADE_EDGES.map(edge => [edge.id, edge]))

    expect(edgeById.get('bogatstvo-plus')?.requirements).toEqual({
      allOf: [
        { type: 'rank', minimum: 'Novice' },
        { type: 'edge', edgeId: 'bogatstvo' },
      ],
    })
    expect(edgeById.get('metkiy-strelok')?.requirements).toEqual({
      allOf: [
        { type: 'rank', minimum: 'Seasoned' },
        {
          anyOf: [
            { type: 'skill', skill: 'athletics', minimum: 'd8' },
            { type: 'skill', skill: 'shooting', minimum: 'd8' },
          ],
        },
      ],
    })
    expect(edgeById.get('groznyy-vid')?.requirements).toEqual({
      allOf: [
        { type: 'rank', minimum: 'Novice' },
        {
          anyOf: [
            { type: 'hindrance', hindranceId: 'zhazhda-krovi' },
            { type: 'hindrance', hindranceId: 'durnoy-harakter' },
            { type: 'hindrance', hindranceId: 'zhestokost-minor' },
            { type: 'hindrance', hindranceId: 'zhestokost-major' },
            { type: 'hindrance', hindranceId: 'urodstvo-minor' },
            { type: 'hindrance', hindranceId: 'urodstvo-major' },
          ],
        },
      ],
    })
    expect(edgeById.get('artefaktor')?.requirements).toEqual({
      allOf: [
        { type: 'rank', minimum: 'Seasoned' },
        { type: 'edge', edgeId: 'misticheskiy-dar', arcaneBackground: 'any' },
      ],
    })
  })

  it('has one normalized requirement tree for every standard Edge', () => {
    expect(Object.keys(SWADE_EDGE_REQUIREMENTS).sort()).toEqual(
      SWADE_EDGES.map(edge => edge.id).sort(),
    )
    SWADE_EDGES.forEach(edge => {
      expect(edge.requirements?.allOf.length, `Edge "${edge.id}" must define requirements`).toBeGreaterThan(0)
    })
  })
})

// --- HINDRANCES ---

describe('SWADE_HINDRANCES', () => {
  it('is non-empty (min 5)', () => {
    expect(SWADE_HINDRANCES.length).toBeGreaterThanOrEqual(5)
  })

  it('every entry has required fields', () => {
    SWADE_HINDRANCES.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_HINDRANCES, 'SWADE_HINDRANCES')
  })

  it('includes both Major and Minor types', () => {
    const types = new Set(SWADE_HINDRANCES.map((h: Hindrance) => h.type))
    expect(types).toContain('Major')
    expect(types).toContain('Minor')
  })
})

// --- WEAPONS ---

describe('SWADE_WEAPONS', () => {
  it('is non-empty (min 6)', () => {
    expect(SWADE_WEAPONS.length).toBeGreaterThanOrEqual(6)
  })

  it('every entry has required fields', () => {
    SWADE_WEAPONS.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_WEAPONS, 'SWADE_WEAPONS')
  })

  it('covers all 4 WeaponCategories', () => {
    const categories = new Set(SWADE_WEAPONS.map((w: Weapon) => w.category))
    expect(categories).toContain('Melee')
    expect(categories).toContain('Ranged')
    expect(categories).toContain('Thrown')
    expect(categories).toContain('Unarmed')
  })

  it('every entry has a damage field', () => {
    SWADE_WEAPONS.forEach(w => {
      expect(w.damage, `Weapon "${w.id}" must have damage`).toBeDefined()
      expect(w.damage).not.toBe('')
    })
  })

  it('ranged and thrown weapons have a range field', () => {
    SWADE_WEAPONS
      .filter((w: Weapon) => w.category === 'Ranged' || w.category === 'Thrown')
      .forEach(w => {
        expect(w.range, `${w.category} weapon "${w.id}" must have range`).toBeDefined()
      })
  })
})

// --- GEAR ---

describe('SWADE_GEAR', () => {
  it('is non-empty (min 5)', () => {
    expect(SWADE_GEAR.length).toBeGreaterThanOrEqual(5)
  })

  it('every entry has required fields', () => {
    SWADE_GEAR.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_GEAR, 'SWADE_GEAR')
  })

  it('every entry has a category', () => {
    SWADE_GEAR.forEach((g: Gear) => {
      expect(g.category, `Gear "${g.id}" must have category`).toBeDefined()
    })
  })
})

// --- POWERS ---

describe('SWADE_POWERS', () => {
  it('is non-empty (min 5)', () => {
    expect(SWADE_POWERS.length).toBeGreaterThanOrEqual(5)
  })

  it('every entry has required fields', () => {
    SWADE_POWERS.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_POWERS, 'SWADE_POWERS')
  })

  it('every power has a non-empty arcaneBackground array', () => {
    SWADE_POWERS.forEach((p: Power) => {
      expect(Array.isArray(p.arcaneBackground), `Power "${p.id}" arcaneBackground must be array`).toBe(true)
      expect(p.arcaneBackground.length, `Power "${p.id}" arcaneBackground must not be empty`).toBeGreaterThan(0)
    })
  })

  it('every power has ppCost, range, duration fields', () => {
    SWADE_POWERS.forEach((p: Power) => {
      expect(p.ppCost, `Power "${p.id}" must have ppCost`).toBeDefined()
      expect(p.range, `Power "${p.id}" must have range`).toBeDefined()
      expect(p.duration, `Power "${p.id}" must have duration`).toBeDefined()
    })
  })

  it('uses at least 3 distinct arcane backgrounds across all powers', () => {
    const allABs = new Set(SWADE_POWERS.flatMap((p: Power) => p.arcaneBackground))
    expect(allABs.size).toBeGreaterThanOrEqual(3)
  })

  it('arcaneBackground values are valid ArcaneBackground literals', () => {
    const valid: ArcaneBackground[] = ['Magic', 'Miracles', 'Psionics', 'SuperPowers', 'WeirdScience']
    SWADE_POWERS.forEach((p: Power) => {
      p.arcaneBackground.forEach(ab => {
        expect(valid, `Power "${p.id}" has unknown arcane background "${ab}"`).toContain(ab)
      })
    })
  })
})

// --- MOUNTS ---

describe('SWADE_MOUNTS', () => {
  it('is non-empty (min 4)', () => {
    expect(SWADE_MOUNTS.length).toBeGreaterThanOrEqual(4)
  })

  it('every entry has required fields', () => {
    SWADE_MOUNTS.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_MOUNTS, 'SWADE_MOUNTS')
  })

  it('every mount has a required category', () => {
    const valid: MountCategory[] = ['animal', 'vehicle']
    SWADE_MOUNTS.forEach((m: Mount) => {
      expect(valid, `Mount "${m.id}" has invalid category "${m.category}"`).toContain(m.category)
    })
  })

  it('includes both animal and vehicle categories', () => {
    const categories = new Set(SWADE_MOUNTS.map((m: Mount) => m.category))
    expect(categories).toContain('animal')
    expect(categories).toContain('vehicle')
  })

  it('every mount has a toughness value', () => {
    SWADE_MOUNTS.forEach((m: Mount) => {
      expect(typeof m.toughness, `Mount "${m.id}" must have numeric toughness`).toBe('number')
    })
  })
})

// --- RACIAL ABILITIES ---

describe('SWADE_RACIAL_ABILITIES', () => {
  it('contains the 46 canonical SWADE race designer features', () => {
    expect(SWADE_RACIAL_ABILITIES).toHaveLength(46)
  })

  it('every entry has required fields', () => {
    SWADE_RACIAL_ABILITIES.forEach(hasRequiredFields)
  })

  it('all IDs are unique', () => {
    hasUniqueIds(SWADE_RACIAL_ABILITIES, 'SWADE_RACIAL_ABILITIES')
  })

  it('includes both positive and negative types', () => {
    const types = new Set(SWADE_RACIAL_ABILITIES.map((r: RacialAbility) => r.type))
    expect(types).toContain('positive')
    expect(types).toContain('negative')
  })

  it('defines repeat and parameter metadata for every entry', () => {
    SWADE_RACIAL_ABILITIES.forEach((ability: RacialAbility) => {
      expect(ability.maxRepeat, `Racial ability "${ability.id}" must define maxRepeat`).toBeDefined()
      expect(Array.isArray(ability.parameterSchema), `Racial ability "${ability.id}" parameterSchema must be array`).toBe(true)
      expect(
        ability.points !== undefined || Array.isArray(ability.pointCostOptions),
        `Racial ability "${ability.id}" must define points or pointCostOptions`,
      ).toBe(true)
    })
  })

  it('does not include non-canonical keen-senses', () => {
    expect(SWADE_RACIAL_ABILITIES.map(ability => ability.id)).not.toContain('keen-senses')
  })
})
