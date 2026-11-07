import { createContext, useContext } from 'react'
import type { Account } from '@/accounts/accountApi'

export const SessionAccountContext = createContext<Account | null>(null)

export function useSessionAccount(): Account {
  const account = useContext(SessionAccountContext)
  if (!account) throw new Error('Account pages must be rendered inside an authenticated session')
  return account
}
