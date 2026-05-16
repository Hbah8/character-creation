import type { Card } from '../types'

const SUITS: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣']

function valueToLabel(value: number): string {
  if (value === 14) return 'A'
  if (value === 13) return 'K'
  if (value === 12) return 'Q'
  if (value === 11) return 'J'
  return String(value)
}

export function generateDeck(): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (let value = 2; value <= 14; value++) {
      cards.push({ suit, value, label: valueToLabel(value) })
    }
  }
  cards.push({ suit: 'joker', value: 15, label: 'Joker' })
  cards.push({ suit: 'joker', value: 15, label: 'Joker' })
  return cards
}

export function shuffle(cards: Card[]): Card[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Higher number = higher initiative (goes first)
const SUIT_ORDER: Record<string, number> = {
  joker: 5,
  '♠': 4,
  '♥': 3,
  '♦': 2,
  '♣': 1,
}

export function cardSortValue(card: Card): number {
  return card.value * 10 + (SUIT_ORDER[card.suit] ?? 0)
}
