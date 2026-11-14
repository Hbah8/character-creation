import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useSessionAccount } from '@/accounts/useSessionAccount'
import { adminApi, AdminApiError } from '@/admin/adminApi'
import type { AccountStatus, AdminAccount, AuditEntry, Page } from '@/admin/adminApi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const pageSize = 25
const auditActionKey = {
  approved: 'actionApproved',
  blocked: 'actionBlocked',
  unblocked: 'actionUnblocked',
  deleted: 'actionDeleted',
} as const

function initialPage<T>(): Page<T> {
  return { items: [], total: 0, page: 0, size: pageSize }
}

export function AdminPage() {
  const { t, i18n } = useTranslation('admin')
  const current = useSessionAccount()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AccountStatus | 'all'>('all')
  const [page, setPage] = useState(0)
  const [accounts, setAccounts] = useState<Page<AdminAccount>>(initialPage)
  const [audit, setAudit] = useState<Page<AuditEntry>>(initialPage)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<AdminAccount | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextAccounts, nextAudit] = await Promise.all([
        adminApi.accounts({ query, status, page, size: pageSize }),
        adminApi.audit(0, pageSize),
      ])
      setAccounts(nextAccounts)
      setAudit(nextAudit)
    } catch (failure) {
      setError(failure instanceof AdminApiError ? failure : new AdminApiError('unavailable'))
    } finally {
      setLoading(false)
    }
  }, [page, query, status])

  useEffect(() => {
    const request = window.setTimeout(() => { void load() })
    return () => window.clearTimeout(request)
  }, [load])

  async function act(action: () => Promise<void>) {
    try {
      await action()
      await load()
    } catch (failure) {
      setError(failure instanceof AdminApiError ? failure : new AdminApiError('unavailable'))
    }
  }

  if (error?.code === 'forbidden' || error?.code === 'notFound') return <NotFoundPage />
  const totalPages = Math.max(1, Math.ceil(accounts.total / pageSize))
  const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value))

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>
      {error && <Alert variant="destructive"><AlertDescription>{t('unavailable')}</AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle>{t('accounts')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup className="md:flex-row">
            <Field>
              <FieldLabel htmlFor="admin-account-search">{t('search')}</FieldLabel>
              <Input id="admin-account-search" value={query} onChange={event => {
                setQuery(event.target.value)
                setPage(0)
              }} />
            </Field>
            <Field>
              <FieldLabel>{t('status')}</FieldLabel>
              <Select value={status} onValueChange={(value: AccountStatus | 'all') => {
                setStatus(value)
                setPage(0)
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="approved">{t('approved')}</SelectItem>
                    <SelectItem value="blocked">{t('blocked')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          {loading ? <p role="status">{t('loading')}</p> : accounts.items.length === 0 ? <p>{t('noAccounts')}</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t('email')}</TableHead><TableHead>{t('createdAt')}</TableHead>
                <TableHead>{t('emailVerified')}</TableHead><TableHead>{t('status')}</TableHead>
                <TableHead>{t('worlds')}</TableHead><TableHead>{t('characters')}</TableHead><TableHead>{t('actions')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{accounts.items.map(account => {
                const self = account.id === current.id
                return <TableRow key={account.id}>
                  <TableCell>{account.email}</TableCell><TableCell>{formatDate(account.createdAt)}</TableCell>
                  <TableCell>{account.emailVerified ? t('yes') : t('no')}</TableCell>
                  <TableCell><Badge variant={account.status === 'blocked' ? 'destructive' : 'secondary'}>{t(account.status)}</Badge></TableCell>
                  <TableCell>{account.worldCount}</TableCell><TableCell>{account.characterCount}</TableCell>
                  <TableCell><div className="flex gap-2">
                    {account.status === 'pending' && <Button size="sm" disabled={self} onClick={() => void act(() => adminApi.approve(account.id))}>{t('approve')}</Button>}
                    {account.status === 'blocked'
                      ? <Button size="sm" variant="outline" disabled={self} onClick={() => void act(() => adminApi.unblock(account.id))}>{t('unblock')}</Button>
                      : <Button size="sm" variant="outline" disabled={self} onClick={() => void act(() => adminApi.block(account.id))}>{t('block')}</Button>}
                    <Button size="sm" variant="destructive" disabled={self} onClick={() => setTarget(account)}>{t('delete')}</Button>
                  </div></TableCell>
                </TableRow>
              })}</TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" disabled={page === 0 || loading} onClick={() => setPage(currentPage => currentPage - 1)}>{t('previous')}</Button>
            <span className="text-sm text-muted-foreground">{t('page', { page: page + 1, pages: totalPages })}</span>
            <Button variant="outline" disabled={page + 1 >= totalPages || loading} onClick={() => setPage(currentPage => currentPage + 1)}>{t('next')}</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('audit')}</CardTitle><CardDescription>{t('description')}</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t('createdAt')}</TableHead><TableHead>{t('actor')}</TableHead>
              <TableHead>{t('actions')}</TableHead><TableHead>{t('target')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>{audit.items.map(entry => <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.createdAt)}</TableCell><TableCell>{entry.actorAccountId}</TableCell>
              <TableCell>{t(auditActionKey[entry.action])}</TableCell>
              <TableCell>{entry.targetEmail}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog open={target !== null} onOpenChange={open => { if (!open) setTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{target && t('deleteDescription', { email: target.email })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              if (target) {
                void act(() => adminApi.delete(target.id))
                setTarget(null)
              }
            }}>{t('confirmDelete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
