# Data Layer Conventions (`src/data/`)

Each file exports a `*_DEFINITIONS` array + a factory function:
- `SKILL_DEFINITIONS` / `createSkillFromDefinition()` / `getInitialCoreSkills()`
- `EDGE_DEFINITIONS` / `createEdge(name)`
- `HINDRANCE_DEFINITIONS` / `createHindrance(name, severity)`
- `RACE_DEFINITIONS` (used directly, no factory)
- `RULES_DATA` (RuleSection[] with markdown `content`, `tags`, `relatedRules`)

**To add game content**: append to the definitions array. The UI picks it up automatically via `.filter()` / `.map()`.
