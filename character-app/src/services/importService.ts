import type { Character } from '@/types/character'
import { validateCharacterImport } from '@/services/validateImport'

export async function importFromJson(file: File): Promise<Character> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== 'string') {
          reject(new Error('Не удалось прочитать файл.'))
          return
        }
        const raw: unknown = JSON.parse(text)
        const character = validateCharacterImport(raw)
        resolve(character)
      } catch (err) {
        if (err instanceof SyntaxError) {
          reject(new Error('Файл не является допустимым JSON.'))
        } else {
          reject(err)
        }
      }
    }
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'))
    reader.readAsText(file)
  })
}
