export type AccountStatus = 'pending' | 'approved' | 'blocked'

export interface AdminAccount {
  id: string
  email: string
  createdAt: string
  emailVerified: boolean
  status: AccountStatus
  worldCount: number
  characterCount: number
}

export interface AuditEntry {
  id: string
  actorAccountId: string
  action: 'approved' | 'blocked' | 'unblocked' | 'deleted'
  targetAccountId: string
  targetEmail: string
  createdAt: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export class AdminApiError extends Error {
  constructor(public readonly code: 'forbidden' | 'unauthenticated' | 'notFound' | 'selfActionForbidden' | 'unavailable' | 'invalidResponse') {
    super(code)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

async function json(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new AdminApiError('invalidResponse')
  }
}

async function request(path: string, method = 'GET'): Promise<Response> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    const csrf = await json(await fetch('/api/auth/csrf', { credentials: 'same-origin', cache: 'no-store' }))
    if (!isObject(csrf) || typeof csrf.token !== 'string' || !csrf.token) {
      throw new AdminApiError('invalidResponse')
    }
    headers['X-CSRF-TOKEN'] = csrf.token
  }
  let response: Response
  try {
    response = await fetch(`/api/admin${path}`, { method, headers, credentials: 'same-origin', cache: 'no-store' })
  } catch {
    throw new AdminApiError('unavailable')
  }
  if (response.ok) return response
  if (response.status >= 500) throw new AdminApiError('unavailable')
  const body = await json(response)
  const code = isObject(body) && typeof body.code === 'string' ? body.code : 'unavailable'
  if (code === 'forbidden' || code === 'unauthenticated' || code === 'notFound' || code === 'selfActionForbidden') {
    throw new AdminApiError(code)
  }
  throw new AdminApiError('unavailable')
}

function account(value: unknown): AdminAccount {
  const status = isObject(value) ? value.status : undefined
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.email !== 'string' || !isDate(value.createdAt)
    || typeof value.emailVerified !== 'boolean' || (status !== 'pending' && status !== 'approved' && status !== 'blocked')
    || !isInteger(value.worldCount) || !isInteger(value.characterCount)) {
    throw new AdminApiError('invalidResponse')
  }
  return {
    id: value.id,
    email: value.email,
    createdAt: value.createdAt,
    emailVerified: value.emailVerified,
    status,
    worldCount: value.worldCount,
    characterCount: value.characterCount,
  }
}

function audit(value: unknown): AuditEntry {
  const action = isObject(value) ? value.action : undefined
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.actorAccountId !== 'string'
    || typeof value.targetAccountId !== 'string' || typeof value.targetEmail !== 'string' || !isDate(value.createdAt)
    || (action !== 'approved' && action !== 'blocked' && action !== 'unblocked' && action !== 'deleted')) {
    throw new AdminApiError('invalidResponse')
  }
  return {
    id: value.id,
    actorAccountId: value.actorAccountId,
    action,
    targetAccountId: value.targetAccountId,
    targetEmail: value.targetEmail,
    createdAt: value.createdAt,
  }
}

function page<T>(value: unknown, item: (entry: unknown) => T): Page<T> {
  if (!isObject(value) || !Array.isArray(value.items) || !isInteger(value.total)
    || !isInteger(value.page) || !isInteger(value.size)) {
    throw new AdminApiError('invalidResponse')
  }
  return { items: value.items.map(item), total: value.total, page: value.page, size: value.size }
}

export const adminApi = {
  async accounts({ query = '', status = 'all', page: pageNumber = 0, size = 25 }: {
    query?: string
    status?: AccountStatus | 'all'
    page?: number
    size?: number
  }): Promise<Page<AdminAccount>> {
    const parameters = new URLSearchParams({ query, status, page: String(pageNumber), size: String(size) })
    return page(await json(await request(`/accounts?${parameters.toString()}`)), account)
  },
  async audit(pageNumber = 0, size = 25): Promise<Page<AuditEntry>> {
    return page(await json(await request(`/audit?page=${pageNumber}&size=${size}`)), audit)
  },
  async approve(id: string): Promise<void> {
    await request(`/accounts/${encodeURIComponent(id)}/approve`, 'POST')
  },
  async block(id: string): Promise<void> {
    await request(`/accounts/${encodeURIComponent(id)}/block`, 'POST')
  },
  async unblock(id: string): Promise<void> {
    await request(`/accounts/${encodeURIComponent(id)}/unblock`, 'POST')
  },
  async delete(id: string): Promise<void> {
    await request(`/accounts/${encodeURIComponent(id)}`, 'DELETE')
  },
}
