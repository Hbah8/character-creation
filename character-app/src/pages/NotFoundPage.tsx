import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation('navigation')
  const navigate = useNavigate()

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">{t('notFound.title')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t('notFound.description')}
      </p>
      <Button onClick={() => navigate('/')}>{t('notFound.backHome')}</Button>
    </main>
  )
}
