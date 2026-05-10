# Critical Game Rules in Code

> For full SWADE rules, terminology, combat, conditions, and size system see the **swade-mastery** skill at `.github/agents/swade-mastery/SKILL.md`.
> Detailed tables and examples live in `.github/agents/swade-mastery/reference/`.
> This file maps rules → code only.

### Skill Point Costs (`computeSkillPointsSpent`)
- Core skills (5 total) start at d4 free — see mastery §4 for full list
- Non-core skills must pay for d4 (start from index -1)
- Each die step at/below linked attribute: **1 point**
- Each die step **above** linked attribute: **2 points**

### Validation (`validateCharacter()`)
- 5 attribute points max (each die step above d4 costs 1)
- 12 skill points max (variable cost per mastery §4)
- Max 1 Major Hindrance, max 2 Minor Hindrances, max 4 hindrance points total
- Hindrance point spending options: see mastery §2

### Derived Stats (`computeDerived()`)
```
Parry = 2 + floor(Fighting die / 2)  // 2 if no Fighting skill
Toughness = 2 + floor(Vigor die / 2)
Pace = 6 (fixed)
```

### Edge Requirements (`services/characterValidator.ts`)
`canTakeEdge()` checks requirements array: rank, attribute minimums, skill minimums, prerequisite edges. `getUnmetRequirements()` returns human-readable strings for UI. Rank tiers defined in mastery §6.

### Rules Reference
For implementing new game mechanics, consult the mastery skill and its reference files:
- **Dice mechanics**: SKILL.md §1 (Exploding dice, Wild Die, Raises, Critical Failures)
- **Character creation budgets**: SKILL.md §2–§4 (attributes, skills, hindrances)
- **Combat & damage**: SKILL.md §7 + `reference/combat-system.md`
- **Conditions**: SKILL.md §8 + `reference/conditions-and-states.md`
- **Special actions**: SKILL.md §9 + `reference/special-actions.md`
- **Modifiers & Size**: SKILL.md §10 + `reference/modifiers-and-environment.md`
- **Bennies**: SKILL.md §11 + `reference/bennies.md`
- **Terminology (RU↔EN)**: SKILL.md §12 + `reference/terminology.md`
