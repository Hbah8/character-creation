import type { ComponentType } from 'react'
import type { CharacterLayout, SheetTemplateId } from '@/types/character'
import type { ResolvedCharacter } from '@/services/resolveEffectiveCharacter'
import type { World } from '@/world/types'

export interface SheetTemplateShellProps {
  resolvedCharacter: ResolvedCharacter
  layout: CharacterLayout
  world: World | null
  mobile?: boolean
}

export interface SheetTemplate {
  id: SheetTemplateId
  name: string
  Shell: ComponentType<SheetTemplateShellProps>
  defaultLayout: CharacterLayout
}
