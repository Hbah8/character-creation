import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  return (
    <SidebarProvider className="h-full w-full print:block print:h-auto print:min-h-0">
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0 flex-1 print:ml-0">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
