import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Globe2, LayoutDashboard, ShieldIcon, Swords, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WorldPicker } from '@/components/layout/WorldPicker'
import { changeLocale } from '@/i18n'
import type { Locale } from '@/i18n/types'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'

const NAV_ITEMS = [
  { labelKey: 'overview', href: '/', icon: LayoutDashboard, requiresWorld: false },
  { labelKey: 'characters', href: '/creator', icon: Users, requiresWorld: false },
  { labelKey: 'worlds', href: '/worlds', icon: Globe2, requiresWorld: false },
  { labelKey: 'combat', href: '/combat', icon: Swords, requiresWorld: false },
  { labelKey: 'handbooks', href: '/handbooks', icon: BookOpen, requiresWorld: false },
  { labelKey: 'raceBuilder', href: '/races', icon: ShieldIcon, requiresWorld: true },
] as const

export function AppSidebar() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation('navigation')
  const { t: tRaceBuilder } = useTranslation('raceBuilder')
  const { activeWorldId } = useWorldLibrary()
  const currentLocale = i18n.language as Locale
  const nextLocale: Locale = currentLocale === 'ru' ? 'en' : 'ru'

  return (
    <Sidebar className="print:hidden">
      <SidebarHeader className="px-4 py-3 border-b flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-tight">SWADE</span>
        <WorldPicker />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          {NAV_ITEMS.map(({ labelKey, href, icon: Icon, requiresWorld }) => {
            const isDisabled = Boolean(requiresWorld && !activeWorldId)
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            const content = (
              <>
                <Icon className="size-4" />
                <span>{t(labelKey)}</span>
              </>
            )

            if (isDisabled) {
              return (
                <SidebarMenuItem key={href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block">
                        <SidebarMenuButton type="button" disabled>
                          {content}
                        </SidebarMenuButton>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {tRaceBuilder('chooseWorld')}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              )
            }

            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={href}>
                    {content}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 border-t">
        <button
          onClick={() => changeLocale(nextLocale)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Globe2 className="size-4 shrink-0" />
          <span className="font-medium uppercase">{currentLocale}</span>
          <span className="text-xs opacity-50">→ {nextLocale.toUpperCase()}</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
