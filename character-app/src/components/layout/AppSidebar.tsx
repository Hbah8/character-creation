import { useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Swords, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { label: 'Обзор', href: '/', icon: LayoutDashboard },
  { label: 'Персонажи', href: '/creator', icon: Users },
  { label: 'Бой', href: '/combat', icon: Swords },
]

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar className="print:hidden">
      <SidebarHeader className="px-4 py-3 border-b">
        <span className="text-sm font-semibold tracking-tight">SWADE</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={href}>
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
