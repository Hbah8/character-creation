import LZString from 'lz-string'
import { validateCharacterImport } from '@/services/validateImport'
import type { Character } from '@/types/character'

function isBase64Portrait(url: string): boolean {
  return url.startsWith('data:')
}

export interface EncodeResult {
  hash: string
  portraitStripped: boolean
}

export function encodeCharacterToHash(character: Character): EncodeResult {
  const portraitStripped = isBase64Portrait(character.portraitUrl)
  const payload: Character = portraitStripped
    ? { ...character, portraitUrl: '' }
    : character
  const hash = LZString.compressToEncodedURIComponent(JSON.stringify(payload))
  return { hash, portraitStripped }
}

export interface DecodeResult {
  character: Character
  portraitStripped: boolean
}

export function decodeCharacterFromHash(rawHash: string): DecodeResult {
  const encoded = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
  const json = LZString.decompressFromEncodedURIComponent(encoded)
  if (!json) {
    throw new Error('share.decodeError')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('share.decodeError')
  }
  const character = validateCharacterImport(parsed)
  const portraitStripped = character.portraitUrl === ''
  return { character, portraitStripped }
}

export function buildShareUrl(hash: string): string {
  return (
    window.location.origin +
    window.location.pathname +
    '#' +
    hash
  )
}
