/**
 * Parsed toughness representation.
 * `base` = total toughness (including armor contribution to the total).
 * `armor` = the armor portion shown in parentheses.
 *
 * Example: "8 (2)" → { base: 8, armor: 2 }
 */
export interface ParsedToughness {
  base: number
  armor: number
}

/** Matches "8 (2)" or "8(2)" with optional surrounding whitespace. */
const WITH_ARMOR_RE = /^\s*(\d+)\s*\(\s*(\d+)\s*\)\s*$/

/** Matches a plain integer like "6". */
const PLAIN_RE = /^\s*(\d+)\s*$/

/**
 * Parses a SWADE toughness string into its base and armor components.
 * Returns `null` for strings that cannot be parsed — callers must leave the
 * original string unchanged in that case.
 */
export function parseToughness(s: string): ParsedToughness | null {
  const m1 = WITH_ARMOR_RE.exec(s)
  if (m1) return { base: parseInt(m1[1], 10), armor: parseInt(m1[2], 10) }

  const m2 = PLAIN_RE.exec(s)
  if (m2) return { base: parseInt(m2[1], 10), armor: 0 }

  return null
}

/**
 * Serializes a toughness back to SWADE display format.
 * - armor > 0: "10 (4)"
 * - armor = 0: "10"
 */
export function formatToughness(base: number, armor: number): string {
  return armor > 0 ? `${base} (${armor})` : String(base)
}
