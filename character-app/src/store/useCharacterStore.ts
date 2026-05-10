import { useState, useCallback } from 'react'
import type { Character, Skill, Edge, Hindrance, Weapon, SpecialRule } from '@/types/character'
import { defaultCharacter } from '@/data/defaultCharacter'

export function useCharacterStore() {
  const [character, setCharacter] = useState<Character>(defaultCharacter)

  const updateField = useCallback(<K extends keyof Character>(key: K, value: Character[K]) => {
    setCharacter(prev => ({ ...prev, [key]: value }))
  }, [])

  // Skills
  const addSkill = useCallback(() => {
    setCharacter(prev => ({
      ...prev,
      skills: [
        ...prev.skills,
        { id: crypto.randomUUID(), name: 'Новый навык', die: 'd4', linkedAttribute: 'Ловкость' } satisfies Skill,
      ],
    }))
  }, [])

  const updateSkill = useCallback((id: string, patch: Partial<Skill>) => {
    setCharacter(prev => ({
      ...prev,
      skills: prev.skills.map(s => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }, [])

  const removeSkill = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }))
  }, [])

  // Edges
  const addEdge = useCallback(() => {
    setCharacter(prev => ({
      ...prev,
      edges: [...prev.edges, { id: crypto.randomUUID(), name: '', effect: '' } satisfies Edge],
    }))
  }, [])

  const updateEdge = useCallback((id: string, patch: Partial<Edge>) => {
    setCharacter(prev => ({
      ...prev,
      edges: prev.edges.map(e => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }, [])

  const removeEdge = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== id) }))
  }, [])

  // Hindrances
  const addHindrance = useCallback(() => {
    setCharacter(prev => ({
      ...prev,
      hindrances: [
        ...prev.hindrances,
        { id: crypto.randomUUID(), name: '', severity: 'М' as const, description: '' } satisfies Hindrance,
      ],
    }))
  }, [])

  const updateHindrance = useCallback((id: string, patch: Partial<Hindrance>) => {
    setCharacter(prev => ({
      ...prev,
      hindrances: prev.hindrances.map(h => (h.id === id ? { ...h, ...patch } : h)),
    }))
  }, [])

  const removeHindrance = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, hindrances: prev.hindrances.filter(h => h.id !== id) }))
  }, [])

  // Weapons
  const addWeapon = useCallback(() => {
    setCharacter(prev => ({
      ...prev,
      weapons: [
        ...prev.weapons,
        { id: crypto.randomUUID(), name: '', range: '', damage: '', ap: '', rof: '', magazine: '' } satisfies Weapon,
      ],
    }))
  }, [])

  const updateWeapon = useCallback((id: string, patch: Partial<Weapon>) => {
    setCharacter(prev => ({
      ...prev,
      weapons: prev.weapons.map(w => (w.id === id ? { ...w, ...patch } : w)),
    }))
  }, [])

  const removeWeapon = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, weapons: prev.weapons.filter(w => w.id !== id) }))
  }, [])

  // Gear
  const addGearItem = useCallback(() => {
    setCharacter(prev => ({ ...prev, gear: [...prev.gear, ''] }))
  }, [])

  const updateGearItem = useCallback((index: number, value: string) => {
    setCharacter(prev => {
      const gear = [...prev.gear]
      gear[index] = value
      return { ...prev, gear }
    })
  }, [])

  const removeGearItem = useCallback((index: number) => {
    setCharacter(prev => ({ ...prev, gear: prev.gear.filter((_, i) => i !== index) }))
  }, [])

  // Special Rules
  const addSpecialRule = useCallback(() => {
    setCharacter(prev => ({
      ...prev,
      specialRules: [
        ...prev.specialRules,
        { id: crypto.randomUUID(), name: '', description: '' } satisfies SpecialRule,
      ],
    }))
  }, [])

  const updateSpecialRule = useCallback((id: string, patch: Partial<SpecialRule>) => {
    setCharacter(prev => ({
      ...prev,
      specialRules: prev.specialRules.map(r => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }, [])

  const removeSpecialRule = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, specialRules: prev.specialRules.filter(r => r.id !== id) }))
  }, [])

  // Replace entire character (for JSON import)
  const replaceCharacter = useCallback((char: Character) => {
    setCharacter(char)
  }, [])

  return {
    character,
    updateField,
    addSkill, updateSkill, removeSkill,
    addEdge, updateEdge, removeEdge,
    addHindrance, updateHindrance, removeHindrance,
    addWeapon, updateWeapon, removeWeapon,
    addGearItem, updateGearItem, removeGearItem,
    addSpecialRule, updateSpecialRule, removeSpecialRule,
    replaceCharacter,
  }
}
