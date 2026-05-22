import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { SWADE_DEFAULTS, type SettingRules } from '@/world/types'

export function useSettingRules(worldId?: string): SettingRules {
  const { entries } = useWorldLibrary()
  if (!worldId) return SWADE_DEFAULTS
  const entry = entries.find(e => e.id === worldId)
  return entry ? entry.world.settingRules : SWADE_DEFAULTS
}
