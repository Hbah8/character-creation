import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { CharacterCreatorPage } from '@/pages/CharacterCreatorPage'
function App() {
  return (
    <BrowserRouter basename="/character-creation">
      <TooltipProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
          </Route>
          <Route path="creator" element={<CharacterCreatorPage />} />
          <Route path="creator/:id" element={<CharacterCreatorPage />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}
export default App
