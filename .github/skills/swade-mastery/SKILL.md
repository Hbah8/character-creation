````instructions
# SWADE Mastery — Game System Knowledge

> Comprehensive Savage Worlds Adventure Edition rules reference for AI-assisted development.
> Source of truth: `docs/SWADE_RULES/` files. This skill distills all rules into structured concepts for code generation and validation.
> Detailed tables, examples, and situational rules live in `reference/` — see links below.

---

## Reference Files

| File | Contains |
|------|----------|
| [`reference/combat-system.md`](reference/combat-system.md) | Initiative, actions, melee/ranged attacks, damage, RoF, area effects, shotguns, improvised weapons, mounted combat, hold, prone, two weapons, random targets, object toughness |
| [`reference/conditions-and-states.md`](reference/conditions-and-states.md) | Shaken, Wounds, Incapacitated, Bleeding Out, Soak Rolls, Stunned, Distracted, Vulnerable, Bound/Entangled, Fatigue |
| [`reference/special-actions.md`](reference/special-actions.md) | Defense, Aim, Called Shots, Wild Attack, Desperate Attack, Grapple, Push, Trick, Support, Disarm, Suppressive Fire |
| [`reference/modifiers-and-environment.md`](reference/modifiers-and-environment.md) | Lighting penalties, Cover, Barrier armor, Unstable Platform, Speed penalties, Size & Silhouette system (categories, combat effects, called shots vs sized targets) |
| [`reference/bennies.md`](reference/bennies.md) | Earning Bennies, spending options (reroll, soak, recover, draw card, influence story), GM Bennies |
| [`reference/terminology.md`](reference/terminology.md) | Full Russian ↔ English mapping of all SWADE game terms |

---

## 1. Core Concepts

### Wild Cards vs Extras
- **Wild Cards**: PCs, major NPCs, bosses. Roll a **Wild Die** (d6) alongside trait die; pick the better. Can take **3 Wounds** before Incapacitation.
- **Extras** (Статисты): Minor characters. Single trait die only. **1 Wound** = out of action.

### Trait Dice (Die Types)
The die ladder: **d4 → d6 → d8 → d10 → d12**. Each step = +1 die type.
Die index mapping: d4=0, d6=1, d8=2, d10=3, d12=4. d4 is minimum; d12 is default maximum (Edges/racial abilities can exceed).

### Target Number (TN)
Default difficulty: **4**. Modifiers adjust the roll, not the TN. Every **4 points above TN** = one **Raise** (подъём) with enhanced effects.

### Exploding Dice
Maximum roll on any die → roll again and **add**. Chains indefinitely. Applies to trait rolls **and** damage. Modifiers applied **after** all explosions.

### Wild Die
Wild Cards roll extra **d6** on every trait check, keep the **better**. Only **one** Wild Die per action (even multi-die rolls). Can replace one trait die result but cannot create extra attacks.

### Critical Failure (Критический провал)
Wild Card: **1 on both** trait die and Wild Die = Critical Failure. Cannot be rerolled. For Extras: roll 1, then d6 — another 1 makes it critical. Multi-die: critical only if >50% are 1s **and** Wild Die is 1.

### Unskilled Attempts (Неумелые попытки)
No skill → roll **d4−2**. Wild Cards also subtract 2 from Wild Die. GM may disallow specialized tasks.

### Opposed Rolls (Встречные проверки)
Both sides roll. Attacker first (must meet TN 4). Defender must equal or beat attacker. Raises measured against loser's result.

### Rerolls (Переброс)
Bennies/Edges allow rerolling **all** dice. Keep better — unless reroll is a Critical Failure (must accept). Multiple rerolls allowed (separate cost each).

---

## 2. Character Creation Rules

### Creation Workflow (5 phases)
1. **Concept** — narrative archetype (required, no mechanical effect)
2. **Heritage (Race)** — attribute bonuses, unique traits, movement, restrictions
3. **Hindrances** — up to 4 points of flaws traded for benefits
4. **Attributes & Skills** — point-buy allocation
5. **Derived Stats & Finalization** — computed from traits

### Point Budgets

| Resource | Budget | Notes |
|----------|--------|-------|
| Attribute Points | **5** | Each starts at d4; +1 die step = 1 point |
| Skill Points | **12** | Variable cost (see §4) |
| Hindrance Points | **max 4** | Major=2, Minor=1 |
| Starting Funds | **$500** | Modified by hindrance spending |

### Hindrance Point Spending

| Cost | Benefit |
|------|---------|
| **2 points** | +1 die type to one Attribute **OR** one Edge |
| **1 point** | +1 Skill Point **OR** +$500 starting funds |

### Hindrance Limits
- Max **1 Major** (2 pts), max **2 Minor** (1 pt each), total cap **4**

---

## 3. Attributes

Five core attributes, each starting at **d4**:

| Attribute | Russian | Governs |
|-----------|---------|---------|
| **Agility** | Ловкость | Physical finesse, reflexes, balance |
| **Smarts** | Смекалка | Mental acuity, knowledge, perception |
| **Spirit** | Характер | Willpower, courage, social force |
| **Strength** | Сила | Raw physical power, melee damage |
| **Vigor** | Выносливость | Endurance, resistance, health |

Each die step above d4 costs **1 Attribute Point**. Range: d4–d12 (unless Heritage/Edge overrides).

---

## 4. Skills

### Core Skills (5 total — start at d4 free)
- **Athletics** (Атлетика) → Agility
- **Common Knowledge** (Осведомлённость) → Smarts
- **Notice** (Внимание) → Smarts
- **Persuasion** (Убеждение) → Spirit
- **Stealth** (Скрытность) → Agility

### Skill Point Costs
- **Non-core skill**: d4 costs 1 point (from untrained)
- Each die step **at or below** linked attribute: **1 point**
- Each die step **above** linked attribute: **2 points**

### Full Skill List

| Skill | Linked Attribute |
|-------|-----------------|
| Athletics | Agility |
| Common Knowledge | Smarts |
| Fighting | Agility |
| Focus | Spirit |
| Healing | Smarts |
| Intimidation | Spirit |
| Notice | Smarts |
| Occult | Smarts |
| Performance | Spirit |
| Persuasion | Spirit |
| Piloting | Agility |
| Repair | Smarts |
| Research | Smarts |
| Riding | Agility |
| Science | Smarts |
| Shooting | Agility |
| Stealth | Agility |
| Survival | Smarts |
| Taunt | Smarts |
| Thievery | Agility |

> The `data/skills.ts` file is the authoritative list for this app.

### Touch Attack
Touch an opponent (e.g. magical effect) → **+2** to Fighting checks.

---

## 5. Derived Statistics

| Stat | Formula | Default |
|------|---------|---------|
| **Pace** | 6" (base human) | Modified by Edges, Hindrances, Heritage |
| **Parry** | 2 + floor(Fighting die / 2) | 2 if no Fighting skill |
| **Toughness** | 2 + floor(Vigor die / 2) + Armor | Armor from equipment |
| **Size** | Defined by Heritage | Adds directly to Toughness |

- **Pace**: Movement in inches/round. 1" = 2 yards. Running adds d6.
- **Parry**: TN for melee attacks against character. Uses **die value** (not index).
- **Toughness**: Damage threshold. ≥ Toughness = Shaken. Each Raise = 1 Wound.

---

## 6. Edges & Hindrances System

### Edges
Positive advantages with **prerequisites**: Rank, Attribute minimums, Skill minimums, sometimes other Edges. System must validate all before allowing selection. Costs **2 Hindrance Points** at creation; also gained via Rank advancement.

### Hindrances
- **Major** (2 points): Significant disadvantage
- **Minor** (1 point): Lesser disadvantage

### Ranks

| Rank | XP Required |
|------|-------------|
| Novice | 0 |
| Seasoned | 20 |
| Veteran | 40 |
| Heroic | 60 |
| Legendary | 80 |

---

## 7. Combat System — Summary

Combat uses Action Cards (poker deck) for initiative, supports melee (Fighting vs Parry) and ranged (Shooting/Athletics vs TN 4 at short range), with multi-action penalties, damage resolution against Toughness, and area effects.

**Key standards**:
- Default TN is **4** for ranged; **Parry** for melee
- Raise on attack → **+d6** bonus damage
- Damage ≥ Toughness → Shaken; each Raise → 1 Wound
- Multi-Action: −2 per extra action to ALL actions
- Recoil: −2 when RoF > 1
- Joker: +2 all checks/damage, act any time, allies get Benny
- Gang Up: +1 per adjacent enemy (max +4)

→ **Full details**: [`reference/combat-system.md`](reference/combat-system.md)

---

## 8. Conditions & States — Summary

Characters can be **Shaken** (free actions only, Spirit to recover), **Wounded** (−1 per wound, max −3), **Incapacitated** (Vigor check or die), **Stunned** (prone + distracted + vulnerable), **Distracted** (−2 all checks), **Vulnerable** (+2 against you), **Entangled/Bound** (movement restricted), or suffer **Fatigue** (−1/−2 per level).

**Key standards**:
- Shaken + Shaken again = **1 Wound**
- Wild Cards take 3 Wounds max (modified by Size)
- Soak Roll: Benny → Vigor check → reduce wounds
- Fatigue: Fatigued → Exhausted → Incapacitated

→ **Full details**: [`reference/conditions-and-states.md`](reference/conditions-and-states.md)

---

## 9. Special Actions — Summary

Available maneuvers: **Defense** (+4 Parry), **Aim** (ignore 4 pts penalties or +2), **Called Shots** (−2/−4 for body parts), **Wild Attack** (+2 Fighting/damage, become Vulnerable), **Grapple** (opposed Athletics), **Push** (opposed Strength), **Trick** (opposed skill → Distracted/Vulnerable), **Support** (+1/+2 to ally), **Disarm**, **Suppressive Fire** (area denial).

**Key standards**:
- Defense uses entire turn, no Multi-Action
- Aim requires standing still for full turn
- Wild Attack and Desperate Attack cannot combine
- Support max bonus: +4 (Strength unlimited)
- Trick repeated → escalating penalties

→ **Full details**: [`reference/special-actions.md`](reference/special-actions.md)

---

## 10. Modifiers & Environment — Summary

**Lighting**: Dim −2, Dark −4, Pitch Black −6.
**Cover**: Light −2, Medium −4, Heavy −6, Near Total −8.
**Barriers** act as armor (+2 to +10) when shooting through.
**Unstable Platform**: −2 ranged.
**Speed**: −1 to −10 based on relative km/h.

**Size/Silhouette**: Size adds to Toughness. Smaller attacker adds silhouette difference to attack; larger subtracts. Large creatures get bonus wounds (+1/+2/+3) and melee reach.

→ **Full details**: [`reference/modifiers-and-environment.md`](reference/modifiers-and-environment.md)

---

## 11. Bennies — Summary

**3 per session**, expire at end. Spend 1 to: reroll trait check, recover from Shaken instantly, soak wounds (Vigor check), draw new Action Card, reroll damage, recover 5 Power Points, or influence story. Joker drawn → all allies get a Benny. GM gets 1 per player + 2 per Wild Card NPC.

→ **Full details**: [`reference/bennies.md`](reference/bennies.md)

---

## 12. Terminology

Full Russian ↔ English mapping for all game terms (Wild Card, Extra, Raise, Shaken, Wound, Edge, Hindrance, all skills and conditions).

→ **Full table**: [`reference/terminology.md`](reference/terminology.md)

---

## Source Files

All rules sourced from `docs/SWADE_RULES/`:

| File | Content |
|------|---------|
| `01_BASICS.md` | Dice mechanics, Wild Die, Exploding, Raises, Critical Failures, Opposed Rolls |
| `02_BATTLE.md` | Initiative, Actions, Melee/Ranged attacks, Damage, Area Effects, Mounted combat |
| `03_SPECIAL_ACTIONS.md` | Grapple, Tricks, Push, Disarm, Defense, Aimed Fire, Suppressive Fire, Called Shots |
| `04_STATES.md` | Shaken, Wounds, Incapacitated, Stunned, Distracted, Vulnerable, Fatigue, Bound/Entangled |
| `05_ADDITIONAL_MECHANICS.md` | Bennies, Lighting, Recoil, Cover/Barriers, Support, Object destruction |
| `CharacterCreationBlockGuide.md` | Full character creation spec with validation constraints C1-C8 |
| `RULES_QUICK_REFERENCE.md` | Navigation index + summary tables + important reminders |
| `SWADE_SIZE_SYSTEM.md` | Size/Silhouette system with combat effects and implementation examples |
````