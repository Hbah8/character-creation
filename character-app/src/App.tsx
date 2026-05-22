import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { CharacterCreatorPage } from '@/pages/CharacterCreatorPage'
import { CombatTrackerPage } from '@/combat/pages/CombatTrackerPage'
import { WorldLibraryPage } from '@/world/pages/WorldLibraryPage'
import { WorldBuilderPage } from '@/world/pages/WorldBuilderPage'
import { HandbooksPage } from '@/handbooks/pages/HandbooksPage'
function App() {
  return (
    <BrowserRouter basename="/character-creation">
      <TooltipProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="combat" element={<CombatTrackerPage />} />
            <Route path="worlds" element={<WorldLibraryPage />} />
            <Route path="handbooks" element={<HandbooksPage />} />
          </Route>
          <Route path="creator" element={<CharacterCreatorPage key="new" />} />
          <Route path="creator/:id" element={<CharacterCreatorPage key="edit" />} />
          <Route path="worlds/new" element={<WorldBuilderPage />} />
          <Route path="worlds/:id" element={<WorldBuilderPage />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}
export default App
