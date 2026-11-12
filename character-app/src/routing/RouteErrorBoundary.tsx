import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  error: Error | null
}

function RouteRenderErrorPage() {
  const { t } = useTranslation('navigation')
  const navigate = useNavigate()

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="type-page-title tracking-tight">{t('routeError.title')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t('routeError.description')}
      </p>
      <Button onClick={() => navigate('/')}>{t('notFound.backHome')}</Button>
    </main>
  )
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error while rendering an application route', error, errorInfo)
  }

  render() {
    return this.state.error
      ? <RouteRenderErrorPage />
      : this.props.children
  }
}
