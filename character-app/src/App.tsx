import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RouteErrorBoundary } from '@/routing/RouteErrorBoundary'
import { entityEditorKey } from '@/routing/routeKeys'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const CharacterCreatorPage = lazy(() => import('@/pages/CharacterCreatorPage').then(module => ({ default: module.CharacterCreatorPage })))
const CombatTrackerPage = lazy(() => import('@/combat/pages/CombatTrackerPage').then(module => ({ default: module.CombatTrackerPage })))
const WorldLibraryPage = lazy(() => import('@/world/pages/WorldLibraryPage').then(module => ({ default: module.WorldLibraryPage })))
const WorldBuilderPage = lazy(() => import('@/world/pages/WorldBuilderPage').then(module => ({ default: module.WorldBuilderPage })))
const HandbooksPage = lazy(() => import('@/handbooks/pages/HandbooksPage').then(module => ({ default: module.HandbooksPage })))
const RaceBuilderPage = lazy(() => import('@/racebuilder/pages/RaceBuilderPage').then(module => ({ default: module.RaceBuilderPage })))
const RaceLibraryPage = lazy(() => import('@/racebuilder/pages/RaceLibraryPage').then(module => ({ default: module.RaceLibraryPage })))
const AudioSoundboardPage = lazy(() => import('@/audio/pages/AudioSoundboardPage').then(module => ({ default: module.AudioSoundboardPage })))
const MapsPage = lazy(() => import('@/maps/pages/MapsPage').then(module => ({ default: module.MapsPage })))

function CharacterCreatorRoute() {
  const { id } = useParams<{ id?: string }>()
  return <CharacterCreatorPage key={entityEditorKey(id)} />
}

function WorldBuilderRoute() {
  const { id } = useParams<{ id?: string }>()
  return <WorldBuilderPage key={entityEditorKey(id)} />
}

function RaceBuilderRoute() {
  const { raceId } = useParams<{ raceId?: string }>()
  return <RaceBuilderPage key={entityEditorKey(raceId)} />
}

function AppRoutes() {
  const { t } = useTranslation('navigation')
  const location = useLocation()

  return (
    <RouteErrorBoundary key={location.pathname}>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground" role="status">{t('loadingPage')}</div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="combat" element={<CombatTrackerPage />} />
            <Route path="worlds" element={<WorldLibraryPage />} />
            <Route path="handbooks" element={<HandbooksPage />} />
            <Route path="races" element={<RaceLibraryPage />} />
            <Route path="races/new" element={<RaceBuilderRoute />} />
            <Route path="races/:raceId" element={<RaceBuilderRoute />} />
            <Route path="audio" element={<AudioSoundboardPage />} />
            <Route path="maps" element={<MapsPage />} />
          </Route>
          <Route path="creator" element={<CharacterCreatorRoute />} />
          <Route path="creator/:id" element={<CharacterCreatorRoute />} />
          <Route path="worlds/new" element={<WorldBuilderRoute />} />
          <Route path="worlds/:id" element={<WorldBuilderRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <TooltipProvider>
        <AppRoutes />
      </TooltipProvider>
    </BrowserRouter>
  )
}
export default App
