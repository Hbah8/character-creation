import type { Character } from '@/types/character'

export type CharacterExportPayload = Omit<
  Character,
  'pace' | 'parry' | 'toughness' | 'armor' | 'importWarnings'
>

export function createCharacterExportPayload(character: Character): CharacterExportPayload {
  const { pace: _pace, parry: _parry, toughness: _toughness, armor: _armor, importWarnings: _importWarnings, ...payload } = character
  return payload
}

export function exportToJson(character: Character): void {
  const json = JSON.stringify(createCharacterExportPayload(character), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${character.callsign || 'character'}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportToPdf(): void {
  const sheet = document.querySelector<HTMLElement>('.sheet-outer-wrapper')
  if (!sheet) return

  // Clone the sheet to a top-level element so nothing else in the DOM
  // (sidebar, header, form, dialogs) can bleed into the printed output.
  const printRoot = document.createElement('div')
  printRoot.id = '__pdf-print-root__'
  printRoot.appendChild(sheet.cloneNode(true))
  document.body.appendChild(printRoot)

  const style = document.createElement('style')
  style.textContent = `@media print { body > *:not(#__pdf-print-root__) { display: none !important; } }`
  document.head.appendChild(style)

  const cleanup = () => {
    printRoot.remove()
    style.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)

  window.print()
}
