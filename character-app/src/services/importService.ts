import type { Character } from '@/types/character'
import { validateCharacterImport } from '@/services/validateImport'

export async function importFromJson(file: File): Promise<Character> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== 'string') {
          reject(new Error('validation.import.fileReadFailed'))
          return
        }
        const raw: unknown = JSON.parse(text)
        const character = validateCharacterImport(raw)
        resolve(character)
      } catch (err) {
        if (err instanceof SyntaxError) {
          reject(new Error('validation.import.invalidJson'))
        } else {
          reject(err)
        }
      }
    }
    reader.onerror = () => reject(new Error('validation.import.fileReadError'))
    reader.readAsText(file)
  })
}
