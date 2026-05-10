Here’s a full **SWADE Character Creation Specification Document** — written in **Markdown**, structured as if it were a **business requirements document** for implementing a “Character Creation Module” in a digital system.
It uses **strong language** (MUST / SHALL / REQUIRED) and includes **recursive definitions** of key terms (so each step is self-contained and self-explanatory).

---

# 🧩 SWADE CHARACTER CREATION SPECIFICATION

## 1. PURPOSE

This document defines the **mandatory sequence of operations**, **data entities**, and **validation requirements** for creating a **Savage Worlds Adventure Edition (SWADE)** player character within a digital system.

The purpose is to ensure every generated character instance complies with SWADE core rules, providing reproducibility, auditability, and internal consistency.

---

## 2. DEFINITIONS

* **Character** — a structured entity representing a player-controlled persona in the game system, composed of Attributes, Skills, Derived Statistics, Edges, Hindrances, Equipment, and Meta Data.
* **Trait** — any measurable property of a character that uses a die type (d4, d6, d8, d10, d12).
* **Attribute** — a *core trait* (Agility, Smarts, Spirit, Strength, Vigor) forming the basis for Skills and Derived Statistics.
* **Skill** — a learned ability linked to one Attribute, representing specific expertise (e.g. Shooting, Stealth).
* **Edge** — a positive advantage that grants bonuses or special rules.
* **Hindrance** — a disadvantage that imposes a penalty or behavioral constraint; grants points that can be traded for benefits.
* **Rank** — character’s progression tier (Novice, Seasoned, Veteran, Heroic, Legendary).
* **Finance Unit** — an in-game currency unit, expressed in dollars ($).
* **Die Type** — an integer-based polyhedral dice level (4–12), used to represent proficiency.

---

## 3. SYSTEM OVERVIEW

The **Character Creation Module** SHALL implement a **five-phase workflow**:

1. **Concept Definition**
2. **Heritage Selection**
3. **Hindrance Allocation**
4. **Trait & Skill Configuration**
5. **Derived Value Computation and Finalization**

Each phase SHALL be atomic, validated, and logged.

---

## 4. PHASE DEFINITIONS

### 4.1. Concept Definition

**Purpose:** establish the player’s intended narrative and functional archetype.

**Rules:**

* The player MUST define a **Concept** describing the role, background, or fantasy of the character.
* The system MAY optionally provide *inspiration prompts* from reference material or templates (e.g., “wandering knight,” “arcane scholar”).
* Concept does not affect mechanics but is REQUIRED for record completeness.

---

### 4.2. Heritage (Race/Nation) Selection

**Purpose:** determine racial modifiers and unique features.

**Rules:**

* The player MUST select one Heritage from the available list.
* Each Heritage entry MUST define:

  * Modifiers to Attributes (e.g., +1 Vigor)
  * Unique Traits (e.g., Darkvision)
  * Movement rate adjustments (Pace)
  * Restrictions (e.g., maximum die types or forbidden Edges)
* All Heritage-defined modifiers SHALL apply immediately to the Attribute baseline.

---

### 4.3. Hindrance Allocation

**Purpose:** allow trade-offs between flaws and advantages.

**Rules:**

* The player MUST select Hindrances totaling **4 points**, composed of:

  * One or two **Major Hindrances** (worth 2 points each)
  * Zero or more **Minor Hindrances** (worth 1 point each)
* The system MUST prevent exceeding 4 total points.
* For every **2 Hindrance Points**, the player MAY:

  * Increase one Attribute by one die type, **OR**
  * Acquire one Edge.
* For every **1 Hindrance Point**, the player MAY:

  * Gain +1 Skill Point, **OR**
  * Receive additional $500 starting funds.
* Hindrance selections SHALL be recorded with type, cost, and description.

---

### 4.4. Trait Configuration

**Purpose:** establish the core dice-based foundation of the character.

#### 4.4.1 Attributes

* Each Attribute starts at **d4**.
* The player receives **5 Attribute Points** to allocate.
* Each increase of one die type (e.g., d4 → d6) costs 1 Attribute Point.
* No Attribute MAY exceed **d12**, unless explicitly allowed by Heritage or Edge.
* Attribute totals SHALL be validated post-allocation.

#### 4.4.2 Skills

* The player receives **12 Skill Points** for allocation.
* Each Skill starts at **untrained (d4−2 penalty)** unless purchased.
* Each Skill increase costs:

  * **1 Point** if the new Skill die is **≤ its linked Attribute**
  * **2 Points** if the new Skill die **exceeds its linked Attribute**
* Each Skill MUST be linked to a defined Attribute.
* At minimum, the following Skills SHALL be available:
  `Athletics, Common Knowledge, Fighting, Focus, Healing, Intimidation, Notice, Occult, Performance, Persuasion, Piloting, Repair, Research, Riding, Science, Shooting, Stealth, Survival, Taunt, Thievery, Weird Science`.

---

### 4.5. Derived Statistics

**Purpose:** automatically compute dependent values from core Traits.

| Statistic     | Formula                     | Description                                                     |
| ------------- | --------------------------- | --------------------------------------------------------------- |
| **Pace**      | 6” (default human)          | Movement per round; modified by Edges, Hindrances, or Heritage. |
| **Parry**     | 2 + (½ × Fighting die)      | Defense against melee attacks.                                  |
| **Toughness** | 2 + (½ × Vigor die) + Armor | Resistance to damage.                                           |
| **Size**      | Defined by Heritage         | Affects Toughness and interactions.                             |
| **Armor**     | From equipment              | Adds to Toughness.                                              |

The system SHALL recalculate derived values dynamically upon changes in source Attributes or Skills.

---

### 4.6. Edges

**Purpose:** define beneficial traits or special abilities.

**Rules:**

* Each Edge costs **2 Hindrance Points**, unless obtained through Rank advancement.
* The player MUST meet all prerequisites (Rank, Attribute, Skill die types).
* The system SHALL validate these prerequisites before applying the Edge effect.
* Edge effects MAY modify Derived Stats, grant rerolls, or unlock new mechanics.

---

### 4.7. Equipment Allocation

**Purpose:** finalize material possessions.

**Rules:**

* The player starts with **$500 base funds**, modified by Hindrance-based bonuses or setting-specific rules.
* The system SHALL enforce equipment cost ≤ available funds.
* Equipment items MUST define:

  * Name
  * Category (Weapon, Armor, Gear, Mount, etc.)
  * Weight (for encumbrance)
  * Cost
  * Game Effects (if applicable)

---

## 5. VALIDATION AND CONSTRAINTS

The system SHALL enforce the following **non-negotiable constraints**:

| ID | Constraint             | Description                                                                              |
| -- | ---------------------- | ---------------------------------------------------------------------------------------- |
| C1 | Attribute Range        | d4 ≤ Attribute ≤ d12 (unless overridden).                                                |
| C2 | Total Attribute Points | MUST equal 5 at creation.                                                                |
| C3 | Total Skill Points     | MUST equal 12 at creation.                                                               |
| C4 | Hindrance Cap          | Total Hindrance Points ≤ 4.                                                              |
| C5 | Edge Acquisition       | Each Edge requires sufficient points and prerequisites.                                  |
| C6 | Derived Recalculation  | Derived stats MUST update after any change to source Traits.                             |
| C7 | Finance Validation     | Total equipment cost ≤ available funds.                                                  |
| C8 | Completeness           | Concept, Heritage, Hindrances, Attributes, and Skills MUST all be defined before saving. |

---

## 6. SUGGESTED DATA MODEL REQUIREMENTS

### 6.1. Character Object Structure

```yaml
Character:
  id: UUID
  name: String
  concept: String
  heritage:
    name: String
    bonuses: [AttributeModifier]
    traits: [SpecialTrait]
  hindrances: [Hindrance]
  attributes:
    agility: DieType
    smarts: DieType
    spirit: DieType
    strength: DieType
    vigor: DieType
  skills: [Skill]
  edges: [Edge]
  derived:
    pace: Number
    parry: Number
    toughness: Number
  finances:
    funds: Number
  equipment: [Item]
  metadata:
    createdBy: User
    createdAt: DateTime
    rank: Enum (Novice..Legendary)
```

---

## 7. COMPLETION CRITERIA

A character SHALL be considered **VALID and COMPLETE** when:

1. All mandatory fields (Concept, Heritage, Attributes, Skills) are defined.
2. All validation constraints (C1–C8) pass without exception.
3. Total Hindrance and Edge balance is correct.
4. Derived statistics are consistent with Attribute values.
5. Finances are non-negative.
6. The record passes internal schema validation and can be serialized to JSON.

---

## 8. FUTURE EXTENSIONS

The Character Creation Module MAY later support:

* Dynamic **Archetype Templates**
* **Automated Rank Progression** logic
* Integration with **Adventure Manager**, **Combat Tracker**, and **Equipment Database**
* Export to **printable character sheets** (PDF or Markdown)

---