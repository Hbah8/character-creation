# Combat System Reference

> Detailed combat rules. For core concepts (dice, raises, Wild Die) see SKILL.md §1.

---

## Initiative (Action Cards)

Uses a standard **poker deck with 2 Jokers**:
- Each Wild Card draws 1 card (+ extras from Edges/Hindrances)
- Extras typically share 1 card per group
- Turn order: **Ace → 2** (highest to lowest)
- Suit tiebreaker: Spades ♠ > Hearts ♥ > Diamonds ♦ > Clubs ♣
- **Joker**: Act anytime in the round, +2 to all trait checks and damage, all allies get a Benny
- Reshuffle deck at end of round if any Joker was drawn

---

## Actions Per Turn

- 1 free action (move + one action, no penalty)
- **Multi-Action Penalty**: Each additional action beyond the first applies **−2 per extra action** to ALL actions that turn
  - 2 actions: −2 to both
  - 3 actions: −4 to all three
- Free actions (drop item, say a phrase, fall prone) have no penalty
- Movement is not an action

---

## Melee Attacks

- Skill: **Fighting**
- TN = target's **Parry** (2 + half Fighting die)
- **Unarmed Defender**: Armed attacker gets +2 to Fighting if target has no weapon/shield
- **Gang Up**: Each adjacent enemy (not Stunned) gives +1 to Fighting (max +4). Each adjacent ally negates 1 point.

---

## Ranged Attacks

- Skill: **Shooting** (firearms), **Athletics** (thrown weapons)
- Base TN: **4** for Short Range

| Range | Modifier |
|-------|----------|
| Short | 0 |
| Medium | −2 |
| Long | −4 |
| Extreme (4× Long) | −8 (requires Aiming) |

---

## Rate of Fire (RoF)

- RoF = number of Shooting dice rolled per attack action
- Wild Card still gets only 1 Wild Die, can replace any one Shooting die result
- Max hits = RoF (Wild Die cannot create extra attacks)
- **Recoil**: RoF > 1 in a single action → **−2** penalty to Shooting check

---

## Damage Resolution

- **Ranged**: Fixed damage (e.g., 2d6 for pistols)
- **Melee**: Strength die + weapon damage die (e.g., d8 STR + d6 sword = d8+d6)
- No Wild Die on damage rolls (but dice **do** explode)
- **Raise on attack**: Add **+d6** to damage roll
- Damage vs Toughness:
  - Below Toughness → no significant effect
  - Equals/Exceeds → **Shaken**
  - Each Raise (every 4 above Toughness) → **1 Wound**

---

## Surprise (Внезапное нападение)

Attackers are on Hold. Victims must make a **Notice** check:
- Success: get Action Card normally
- Failure: no card, cannot act in first round

---

## Withdrawing from Melee

All adjacent non-Shaken, non-Stunned enemies get a **free attack** against the departing character.

---

## Area Effect Attacks

### Templates
- **Small / Medium / Large Blast** — circular areas
- **Cone** — placed with narrow end touching attacker
- **Line** — 12" long, 1" wide (alternative to cone)

### Rules
- Ignore individual target defenses (Dodge Edge, relative speed)
- Success = hits all in template; Raise = bonus damage to all
- Failure with blast: **Deviation** — d6" (thrown) or 2d6" (launched), ×2 at Medium range, ×3 at Long, ×4 at Extreme. Direction: d12 as clock face. Max deviation = half distance to target.
- Damage rolled **per target** individually
- Cover between blast center and target reduces damage by cover armor value

### Shotguns
- +2 to Shooting checks
- Damage by range: Short=3d6, Medium=2d6, Long=1d6 (no Extreme)
- Double barrel both at once: single Shooting check, +4 damage

### Improvised Weapons

| Weight | Range | Damage | Min Str |
|--------|-------|--------|---------|
| Light | 3/6/12 | Str+d4 | d4 |
| Medium | 2/4/8 | Str+d6 | d6 |
| Heavy | 1/2/4 | Str+d8 | d8 |

−2 to attack checks with all improvised weapons.

---

## Additional Combat Rules

### Mounted Combat
- Mount acts on rider's initiative, can attack targets in front
- Rider uses **lower** of Riding or Fighting for melee
- If Shaken/Stunned/Wounded while mounted: Riding check or fall (2d4 damage if running, 2d6 on Critical Failure)
- **Charge**: +4 damage if moved 6"+ in straight line toward target
- **Set Weapon**: opposed Athletics to interrupt charge; longer weapon gets +2; winner attacks first with +4 damage

### Prone Targets
- Ranged from 3"+: −4 penalty (doesn't stack with cover)
- Area damage reduced by 4
- Melee: Prone target gets −2 Fighting and −2 Parry
- Cost to stand: 2" of movement

### Hold (Наготове)
Delay action until later. Can interrupt other's action with opposed Athletics. Losing interruption = act immediately after opponent.

### Ranged in Melee
- Only one-handed ranged weapons or mystic powers
- TN = target's Parry (not standard 4)
- Shooting at non-adjacent target while in melee → immediately Vulnerable

### Nonlethal Damage
Incapacitated target is unconscious for d6 hours instead of Incapacitated/dying. Sharp weapon used flat: −1 to Fighting.

### Two Weapons
+1 Fighting if opponent has single weapon or is unarmed (no shield). Not effective vs natural weapons.

### Random Targets
On a missed Shooting/Athletics: each 1 on trait die = hit random adjacent target. Wild Cards need 1 on trait die **and** Wild Die (for RoF 1). RoF 2+ or shotgun: 1 or 2 on trait die = random hit.

### Object Toughness

| Toughness | Object |
|-----------|--------|
| 8 | Light door |
| 10 | Heavy door |
| 8 | Lock |
| 9 | Firearm |
| 12 | Handcuffs |
| 10 | Knife, sword |
| 10 | Medieval shield |
| 12 | Modern shield |
| 4 | Rope |

Attacks vs objects: no bonus damage from Raises, dice don't explode.
