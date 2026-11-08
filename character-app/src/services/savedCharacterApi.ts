import { notifySessionEnded } from '@/accounts/accountApi'
import type { Character } from '@/types/character'

export interface SavedCharacterRecord {
  id: string
  version: number
  createdAt: string
  updatedAt: string
  character: Character
}

export type SavedCharacterErrorCode =
  | 'conflict'
  | 'notFound'
  | 'unsupportedData'
  | 'invalidCharacter'
  | 'invalidReference'
  | 'referencedResource'
  | 'requestTooLarge'
  | 'preconditionRequired'
  | 'invalidVersion'
  | 'unauthenticated'
  | 'forbidden'
  | 'unavailable'
  | 'invalidResponse'

const errorCodes: SavedCharacterErrorCode[] = [
  'conflict', 'notFound', 'unsupportedData', 'invalidCharacter', 'invalidReference',
  'referencedResource', 'requestTooLarge',
  'preconditionRequired', 'invalidVersion', 'unauthenticated', 'forbidden',
  'unavailable', 'invalidResponse',
]

export class SavedCharacterApiError extends Error {
  constructor(public readonly code: SavedCharacterErrorCode) {
    super(code)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isCharacter(value: unknown): value is Character {
  return isObject(value)
    && typeof value.sheetTitle === 'string'
    && typeof value.callsign === 'string'
    && typeof value.name === 'string'
    && typeof value.rank === 'string'
    && typeof value.role === 'string'
    && typeof value.fileNo === 'string'
    && typeof value.portraitUrl === 'string'
    && typeof value.isWildCard === 'boolean'
    && ['agility', 'strength', 'smarts', 'spirit', 'vigor'].every(key => typeof value[key] === 'string')
    && ['skills', 'edges', 'hindrances', 'weapons', 'gear', 'specialRules', 'powers'].every(
      key => Array.isArray(value[key]),
    )
    && typeof value.notes === 'string'
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown
  } catch {
    throw new SavedCharacterApiError('invalidResponse')
  }
}

async function responseError(response: Response): Promise<SavedCharacterApiError> {
  if (response.status === 401) {
    notifySessionEnded()
    return new SavedCharacterApiError('unauthenticated')
  }
  if (response.status >= 500) return new SavedCharacterApiError('unavailable')
  try {
    const body = await response.json() as unknown
    const code = isObject(body) && typeof body.code === 'string'
      ? errorCodes.find(candidate => candidate === body.code)
      : undefined
    return new SavedCharacterApiError(code ?? 'invalidResponse')
  } catch {
    return new SavedCharacterApiError('invalidResponse')
  }
}

async function request(path: string, method = 'GET', body?: object, version?: number): Promise<Response> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    let csrfResponse: Response
    try {
      csrfResponse = await fetch('/api/auth/csrf', {
        credentials: 'same-origin',
        cache: 'no-store',
      })
    } catch {
      throw new SavedCharacterApiError('unavailable')
    }
    if (!csrfResponse.ok) throw await responseError(csrfResponse)
    const csrf = await readJson(csrfResponse)
    if (!isObject(csrf) || typeof csrf.token !== 'string' || csrf.token.length === 0) {
      throw new SavedCharacterApiError('invalidResponse')
    }
    headers['X-CSRF-TOKEN'] = csrf.token
    headers['Content-Type'] = 'application/json'
  }
  if (version !== undefined) headers['If-Match'] = `"${version}"`

  let response: Response
  try {
    response = await fetch(`/api/characters${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new SavedCharacterApiError('unavailable')
  }
  if (!response.ok) throw await responseError(response)
  return response
}

function readRecord(value: unknown, response?: Response): SavedCharacterRecord {
  if (!isObject(value)
    || typeof value.id !== 'string'
    || typeof value.version !== 'number'
    || !Number.isSafeInteger(value.version)
    || value.version < 1
    || typeof value.createdAt !== 'string'
    || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.updatedAt !== 'string'
    || !Number.isFinite(Date.parse(value.updatedAt))
    || !isCharacter(value.character)) {
    throw new SavedCharacterApiError('invalidResponse')
  }
  if (response) {
    const etag = response.headers.get('ETag')
    if (etag !== `"${value.version}"`) throw new SavedCharacterApiError('invalidResponse')
  }
  return {
    id: value.id,
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    character: value.character,
  }
}

export const savedCharacterApi = {
  async list(): Promise<SavedCharacterRecord[]> {
    const response = await request('')
    const value = await readJson(response)
    if (!Array.isArray(value)) throw new SavedCharacterApiError('invalidResponse')
    return value.map(record => readRecord(record))
  },

  async get(id: string): Promise<SavedCharacterRecord> {
    const response = await request(`/${encodeURIComponent(id)}`)
    return readRecord(await readJson(response), response)
  },

  async create(character: Character): Promise<SavedCharacterRecord> {
    const response = await request('', 'POST', { character })
    return readRecord(await readJson(response), response)
  },

  async update(id: string, version: number, character: Character): Promise<SavedCharacterRecord> {
    const response = await request(`/${encodeURIComponent(id)}`, 'PUT', { character }, version)
    return readRecord(await readJson(response), response)
  },

  async delete(id: string, version: number): Promise<void> {
    await request(`/${encodeURIComponent(id)}`, 'DELETE', undefined, version)
  },
}
