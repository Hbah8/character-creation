import type { World } from '@/world/types'
import { validateWorldImport } from '@/world/services/validateWorldImport'

function safeFilename(value: string): string {
  const trimmed = value.trim()
  return (trimmed || 'world').replace(/[\\/:*?"<>|]+/g, '-')
}

export function exportWorldToJson(world: World): void {
  const json = JSON.stringify(world, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeFilename(world.name)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importWorldFromJson(file: File): Promise<World> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = e.target?.result
        if (typeof text !== 'string') {
          reject(new Error('validation.world.fileReadFailed'))
          return
        }
        resolve(validateWorldImport(JSON.parse(text)))
      } catch (err) {
        if (err instanceof SyntaxError) {
          reject(new Error('validation.world.invalidJson'))
        } else {
          reject(err)
        }
      }
    }
    reader.onerror = () => reject(new Error('validation.world.fileReadError'))
    reader.readAsText(file)
  })
}
