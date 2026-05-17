import { useState, useCallback } from 'react'
import type { Combatant, CombatantType, CombatantStatus, Card } from '../types'
import { generateDeck, shuffle, cardSortValue } from '../services/deckService'

function sortByCard(list: Combatant[]): Combatant[] {
  return [...list].sort((a, b) => {
    if (!a.card && !b.card) return 0
    if (!a.card) return 1
    if (!b.card) return -1
    return cardSortValue(b.card) - cardSortValue(a.card)
  })
}

export function useCombatStore() {
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [deck, setDeck] = useState<Card[]>(() => shuffle(generateDeck()))
  const [discardPile, setDiscardPile] = useState<Card[]>([])
  const [round, setRound] = useState(1)
  const [jokerDrawnThisRound, setJokerDrawnThisRound] = useState(false)
  const [activeCombatantId, setActiveCombatantId] = useState<string | null>(null)
  const [focusedCombatantId, setFocusedCombatantId] = useState<string | null>(null)

  // Derived: combatants sorted by initiative card (desc), unsorted if no cards dealt
  const sortedCombatants = sortByCard(combatants)

  const cardsDealt = combatants.some(c => c.card !== undefined)

  // ── Combatant management ──────────────────────────────────────────────────

  const addCombatant = useCallback(
    (params: {
      name: string
      type: CombatantType
      isPlayer: boolean
      count: number
      pace?: number
      parry?: number
      toughness?: number
      maxWounds?: number
      powerPoints?: number
      maxPowerPoints?: number
    }) => {
      const defaultMaxWounds = params.type === 'wildcard' ? 3 : 1
      setCombatants(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          wounds: 0,
          fatigue: 0,
          bennies: params.type === 'wildcard' ? 3 : 0,
          eliminated: false,
          card: undefined,
          pendingCard: undefined,
          statuses: [],
          onHold: false,
          groupShocked: params.type === 'group' ? 0 : undefined,
          groupEliminated: params.type === 'group' ? 0 : undefined,
          pace: params.pace ?? 6,
          parry: params.parry ?? 4,
          toughness: params.toughness ?? 5,
          maxWounds: params.maxWounds ?? defaultMaxWounds,
          powerPoints: params.powerPoints ?? 0,
          maxPowerPoints: params.maxPowerPoints ?? 0,
          ...params,
        },
      ])
    },
    [],
  )

  const removeCombatant = useCallback((id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id))
    setFocusedCombatantId(prev => (prev === id ? null : prev))
  }, [])

  const clearCombatants = useCallback(() => {
    setCombatants([])
    setActiveCombatantId(null)
    setFocusedCombatantId(null)
  }, [])

  const updateCombatant = useCallback((id: string, patch: Partial<Combatant>) => {
    setCombatants(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const toggleStatus = useCallback((id: string, status: CombatantStatus) => {
    setCombatants(prev =>
      prev.map(c => {
        if (c.id !== id) return c
        const has = c.statuses.includes(status)
        const isApplying = !has
        const next: Partial<typeof c> = {
          statuses: has ? c.statuses.filter(s => s !== status) : [...c.statuses, status],
        }
        if (has && status === 'grabbed') next.grabbedBy = undefined
        if (has && status === 'restrained') next.restrainedBy = undefined
        // Per SWADE: applying shaken/stunned to an on-hold combatant removes on-hold
        if (isApplying && (status === 'shaken' || status === 'stunned') && c.onHold) {
          next.onHold = false
        }
        return { ...c, ...next }
      }),
    )
  }, [])

  // ── Deck / initiative management ──────────────────────────────────────────

  const dealCards = useCallback(
    (currentCombatants: Combatant[] = combatants) => {
      let workDeck = [...deck]
      let workDiscard = [...discardPile]

      // Return existing cards to discard
      for (const c of currentCombatants) {
        if (c.card) workDiscard.push(c.card)
        if (c.pendingCard) workDiscard.push(c.pendingCard)
      }

      // Ensure enough cards
      if (workDeck.length < currentCombatants.length) {
        workDeck = shuffle([...workDeck, ...workDiscard])
        workDiscard = []
      }

      const dealtCards = workDeck.splice(0, currentCombatants.length)

      let jokerFound = false
      let newCombatants = currentCombatants.map((c, i) => {
        const card = dealtCards[i]
        if (card && card.suit === 'joker') jokerFound = true
        return { ...c, card, pendingCard: undefined }
      })

      if (jokerFound) {
        // All player wild cards get +1 benny
        newCombatants = newCombatants.map(c =>
          c.isPlayer && c.type === 'wildcard' ? { ...c, bennies: c.bennies + 1 } : c,
        )
      }

      setCombatants(newCombatants)
      setDeck(workDeck)
      setDiscardPile(workDiscard)
      if (jokerFound) setJokerDrawnThisRound(true)
      const first = sortByCard(newCombatants).find(c => c.card)
      if (first) {
        setActiveCombatantId(first.id)
        setFocusedCombatantId(first.id)
      }
    },
    [combatants, deck, discardPile],
  )

  const redrawCard = useCallback(
    (id: string) => {
      const combatant = combatants.find(c => c.id === id)
      if (!combatant || combatant.bennies <= 0) return

      let workDeck = [...deck]
      let workDiscard = [...discardPile]

      if (workDeck.length === 0) {
        workDeck = shuffle(workDiscard)
        workDiscard = []
      }

      const [newCard, ...restDeck] = workDeck
      if (!newCard) return

      if (newCard.suit === 'joker') setJokerDrawnThisRound(true)

      setCombatants(prev =>
        prev.map(c =>
          c.id === id ? { ...c, bennies: c.bennies - 1, pendingCard: newCard } : c,
        ),
      )
      setDeck(restDeck)
      setDiscardPile(workDiscard)
    },
    [combatants, deck, discardPile],
  )

  const resolveRedraw = useCallback((id: string, keepNew: boolean) => {
    setCombatants(prev =>
      prev.map(c => {
        if (c.id !== id || !c.pendingCard) return c
        const kept = keepNew ? c.pendingCard : c.card
        return { ...c, card: kept, pendingCard: undefined }
      }),
    )
  }, [])

  // ── Round management ──────────────────────────────────────────────────────

  const nextRound = useCallback(() => {
    let workDeck = [...deck]
    let workDiscard = [...discardPile]

    // Return ALL current cards to discard (including on-hold combatants)
    for (const c of combatants) {
      if (c.card) workDiscard.push(c.card)
      if (c.pendingCard) workDiscard.push(c.pendingCard)
    }

    // Joker was drawn last round → reshuffle everything
    if (jokerDrawnThisRound) {
      workDeck = shuffle([...workDeck, ...workDiscard])
      workDiscard = []
    }

    // On-hold combatants do NOT receive a new card (SWADE rule)
    const heldIds = new Set(combatants.filter(c => c.onHold).map(c => c.id))
    const nonHeld = combatants.filter(c => !c.onHold)

    // Ensure enough cards
    if (workDeck.length < nonHeld.length) {
      workDeck = shuffle([...workDeck, ...workDiscard])
      workDiscard = []
    }

    const dealtCards = workDeck.splice(0, nonHeld.length)

    let jokerFound = false
    let cardIdx = 0
    let newCombatants = combatants.map(c => {
      if (heldIds.has(c.id)) {
        return { ...c, card: undefined, pendingCard: undefined }
      }
      const card = dealtCards[cardIdx++]
      if (card && card.suit === 'joker') jokerFound = true
      return { ...c, card, pendingCard: undefined }
    })

    if (jokerFound) {
      newCombatants = newCombatants.map(c =>
        c.isPlayer && c.type === 'wildcard' ? { ...c, bennies: c.bennies + 1 } : c,
      )
    }

    setCombatants(newCombatants)
    setDeck(workDeck)
    setDiscardPile(workDiscard)
    setRound(prev => prev + 1)
    setJokerDrawnThisRound(jokerFound)
    const first = sortByCard(newCombatants).find(c => c.card)
    if (first) {
      setActiveCombatantId(first.id)
      setFocusedCombatantId(first.id)
    }
  }, [combatants, deck, discardPile, jokerDrawnThisRound])

  const resetCombat = useCallback(() => {
    setCombatants(prev =>
      prev.map(c => ({ ...c, card: undefined, pendingCard: undefined, statuses: [], grabbedBy: undefined, restrainedBy: undefined, onHold: false })),
    )
    setDeck(shuffle(generateDeck()))
    setDiscardPile([])
    setRound(1)
    setJokerDrawnThisRound(false)
    setActiveCombatantId(null)
  }, [])

  const advanceTurn = useCallback(() => {
    const sorted = sortByCard(combatants)
    if (sorted.length === 0) return
    if (!activeCombatantId) {
      setActiveCombatantId(sorted[0].id)
      setFocusedCombatantId(sorted[0].id)
      return
    }
    const idx = sorted.findIndex(c => c.id === activeCombatantId)
    let nextIdx = (idx + 1) % sorted.length
    let iterations = 0
    while (sorted[nextIdx].onHold && iterations < sorted.length) {
      nextIdx = (nextIdx + 1) % sorted.length
      iterations++
    }
    const next = sorted[nextIdx]
    setActiveCombatantId(next.id)
    setFocusedCombatantId(next.id)
  }, [combatants, activeCombatantId])

  const takeHold = useCallback((id: string) => {
    const updatedCombatants = combatants.map(c =>
      c.id === id ? { ...c, onHold: true } : c,
    )
    setCombatants(updatedCombatants)
    const sorted = sortByCard(updatedCombatants)
    const idx = sorted.findIndex(c => c.id === id)
    if (idx === -1) return
    let nextIdx = (idx + 1) % sorted.length
    let iterations = 0
    while (sorted[nextIdx].onHold && iterations < sorted.length) {
      nextIdx = (nextIdx + 1) % sorted.length
      iterations++
    }
    const next = sorted[nextIdx]
    setActiveCombatantId(next.id)
    setFocusedCombatantId(next.id)
  }, [combatants])

  return {
    combatants,
    sortedCombatants,
    cardsDealt,
    deck,
    round,
    jokerDrawnThisRound,
    activeCombatantId,
    setActiveCombatantId,
    advanceTurn,
    takeHold,
    addCombatant,
    removeCombatant,
    clearCombatants,
    updateCombatant,
    toggleStatus,
    dealCards,
    redrawCard,
    resolveRedraw,
    nextRound,
    resetCombat,
    focusedCombatantId,
    setFocusedCombatantId,
  }
}
