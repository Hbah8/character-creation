import type { Character } from '@/types/character'

export function exportToJson(character: Character): void {
  const json = JSON.stringify(character, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${character.callsign || 'character'}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportToPdf(): void {
  window.print()
}
