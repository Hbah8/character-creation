export interface Account {
  id: string
  email: string
  expiresAt: string
  approved: boolean
}

export interface AccountSession {
  id: string
  createdAt: string
  lastAccessAt: string
  expiresAt: string
  current: boolean
}

const errorCodes = [
  'invalidCredentials', 'emailUnverified', 'invalidToken', 'invalidInput', 'rateLimited',
  'unauthenticated', 'forbidden', 'sessionNotFound', 'unavailable', 'invalidResponse', 'incorrectPassword',
  'registrationClosed',
  'accountBlocked',
] as const
export type AccountErrorCode = typeof errorCodes[number]

export class AccountApiError extends Error {
  constructor(public readonly code: AccountErrorCode) {
    super(code)
  }
}

type SessionEndReason = 'passwordChanged' | undefined
const sessionEndedListeners = new Set<(reason: SessionEndReason) => void>()

export function onSessionEnded(listener: (reason: SessionEndReason) => void): () => void {
  sessionEndedListeners.add(listener)
  return () => { sessionEndedListeners.delete(listener) }
}

export function notifySessionEnded(reason?: SessionEndReason) {
  sessionEndedListeners.forEach(listener => listener(reason))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new AccountApiError('invalidResponse')
  }
}

async function request(path: string, method = 'GET', body?: object): Promise<Response> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    const csrf = await readJson(await request('/csrf'))
    if (!isObject(csrf) || typeof csrf.token !== 'string' || !csrf.token) {
      throw new AccountApiError('invalidResponse')
    }
    headers['X-CSRF-TOKEN'] = csrf.token
    headers['Content-Type'] = 'application/json'
  }
  let response: Response
  try {
    response = await fetch(`/api/auth${path}`, {
      method, headers, credentials: 'same-origin', cache: 'no-store',
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new AccountApiError('unavailable')
  }
  if (response.status === 401 && path !== '/login' && path !== '/me') {
    notifySessionEnded()
    throw new AccountApiError('unauthenticated')
  }
  if (!response.ok && !(path === '/me' && response.status === 401)) {
    if (response.status >= 500) throw new AccountApiError('unavailable')
    const error = await readJson(response)
    const code = isObject(error) && errorCodes.find(code => code === error.code)
    throw new AccountApiError(code || 'unavailable')
  }
  return response
}

function readAccount(value: unknown): Account {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.email !== 'string'
    || typeof value.expiresAt !== 'string' || !Number.isFinite(Date.parse(value.expiresAt))
    || typeof value.approved !== 'boolean') {
    throw new AccountApiError('invalidResponse')
  }
  return { id: value.id, email: value.email, expiresAt: value.expiresAt, approved: value.approved }
}

function readSession(value: unknown): AccountSession {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.current !== 'boolean'
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.lastAccessAt !== 'string' || !Number.isFinite(Date.parse(value.lastAccessAt))
    || typeof value.expiresAt !== 'string' || !Number.isFinite(Date.parse(value.expiresAt))) {
    throw new AccountApiError('invalidResponse')
  }
  return {
    id: value.id, current: value.current, createdAt: value.createdAt,
    lastAccessAt: value.lastAccessAt, expiresAt: value.expiresAt,
  }
}

export const accountApi = {
  async current(): Promise<Account | null> {
    const response = await request('/me')
    return response.status === 401 ? null : readAccount(await readJson(response))
  },
  async register(email: string, password: string): Promise<void> {
    await request('/register', 'POST', { email, password })
  },
  async resend(email: string): Promise<void> {
    await request('/resend', 'POST', { email })
  },
  async confirm(token: string): Promise<void> {
    await request('/confirm', 'POST', { token })
  },
  async requestPasswordReset(email: string): Promise<void> {
    await request('/password-reset/request', 'POST', { email })
  },
  async resetPassword(token: string, password: string): Promise<void> {
    await request('/password-reset/complete', 'POST', { token, password })
    notifySessionEnded()
  },
  async changePassword(currentPassword: string, password: string): Promise<void> {
    await request('/password-change', 'POST', { currentPassword, password })
    notifySessionEnded('passwordChanged')
  },
  async login(email: string, password: string): Promise<Account> {
    return readAccount(await readJson(await request('/login', 'POST', { email, password })))
  },
  async logout(): Promise<void> {
    await request('/logout', 'POST')
    notifySessionEnded()
  },
  async sessions(): Promise<AccountSession[]> {
    const value = await readJson(await request('/sessions'))
    if (!Array.isArray(value)) throw new AccountApiError('invalidResponse')
    return value.map(readSession)
  },
  async revoke(id: string): Promise<void> {
    await request(`/sessions/${encodeURIComponent(id)}`, 'DELETE')
  },
}
