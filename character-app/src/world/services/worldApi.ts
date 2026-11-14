import { notifySessionEnded } from '@/accounts/accountApi'
import { validateWorldImport } from '@/world/services/validateWorldImport'
import type { World } from '@/world/types'

export interface SavedWorldRecord {
  id: string
  version: number
  createdAt: string
  updatedAt: string
  world: World
}

export type WorldApiErrorCode =
  | 'conflict'
  | 'notFound'
  | 'invalidWorld'
  | 'invalidReference'
  | 'referencedResource'
  | 'requestTooLarge'
  | 'worldLimitReached'
  | 'worldEntitiesLimitReached'
  | 'worldRelationshipsLimitReached'
  | 'worldRacesLimitReached'
  | 'worldHandbookLimitReached'
  | 'preconditionRequired'
  | 'invalidVersion'
  | 'unauthenticated'
  | 'forbidden'
  | 'unavailable'
  | 'invalidResponse'

const errorCodes: WorldApiErrorCode[] = [
  'conflict', 'notFound', 'invalidWorld', 'invalidReference', 'referencedResource',
  'requestTooLarge', 'preconditionRequired', 'invalidVersion', 'unauthenticated',
  'forbidden', 'unavailable', 'invalidResponse',
  'worldLimitReached', 'worldEntitiesLimitReached', 'worldRelationshipsLimitReached',
  'worldRacesLimitReached', 'worldHandbookLimitReached',
]

export class WorldApiError extends Error {
  constructor(public readonly code: WorldApiErrorCode) {
    super(code)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown
  } catch {
    throw new WorldApiError('invalidResponse')
  }
}

async function responseError(response: Response): Promise<WorldApiError> {
  if (response.status === 401) {
    notifySessionEnded()
    return new WorldApiError('unauthenticated')
  }
  if (response.status >= 500) return new WorldApiError('unavailable')
  try {
    const body = await response.json() as unknown
    const code = isObject(body) && typeof body.code === 'string'
      ? errorCodes.find(candidate => candidate === body.code)
      : undefined
    return new WorldApiError(code ?? 'invalidResponse')
  } catch {
    return new WorldApiError('invalidResponse')
  }
}

async function request(path: string, method = 'GET', body?: object, version?: number): Promise<Response> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    let csrfResponse: Response
    try {
      csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' })
    } catch {
      throw new WorldApiError('unavailable')
    }
    if (!csrfResponse.ok) throw await responseError(csrfResponse)
    const csrf = await readJson(csrfResponse)
    if (!isObject(csrf) || typeof csrf.token !== 'string' || csrf.token.length === 0) {
      throw new WorldApiError('invalidResponse')
    }
    headers['X-CSRF-TOKEN'] = csrf.token
    headers['Content-Type'] = 'application/json'
  }
  if (version !== undefined) headers['If-Match'] = `"${version}"`

  let response: Response
  try {
    response = await fetch(`/api/worlds${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new WorldApiError('unavailable')
  }
  if (!response.ok) throw await responseError(response)
  return response
}

function readRecord(value: unknown, response?: Response): SavedWorldRecord {
  if (!isObject(value)
    || typeof value.id !== 'string'
    || typeof value.version !== 'number'
    || !Number.isSafeInteger(value.version)
    || value.version < 1
    || typeof value.createdAt !== 'string'
    || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.updatedAt !== 'string'
    || !Number.isFinite(Date.parse(value.updatedAt))) {
    throw new WorldApiError('invalidResponse')
  }
  let world: World
  try {
    world = validateWorldImport(value.world)
  } catch {
    throw new WorldApiError('invalidResponse')
  }
  if (response && response.headers.get('ETag') !== `"${value.version}"`) {
    throw new WorldApiError('invalidResponse')
  }
  return {
    id: value.id,
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    world,
  }
}

export const worldApi = {
  async list(): Promise<SavedWorldRecord[]> {
    const value = await readJson(await request(''))
    if (!Array.isArray(value)) throw new WorldApiError('invalidResponse')
    return value.map(record => readRecord(record))
  },

  async get(id: string): Promise<SavedWorldRecord> {
    const response = await request(`/${encodeURIComponent(id)}`)
    return readRecord(await readJson(response), response)
  },

  async create(world: World): Promise<SavedWorldRecord> {
    const response = await request('', 'POST', { world })
    return readRecord(await readJson(response), response)
  },

  async update(id: string, version: number, world: World): Promise<SavedWorldRecord> {
    const response = await request(`/${encodeURIComponent(id)}`, 'PUT', { world }, version)
    return readRecord(await readJson(response), response)
  },

  async delete(id: string, version: number): Promise<void> {
    await request(`/${encodeURIComponent(id)}`, 'DELETE', undefined, version)
  },
}
