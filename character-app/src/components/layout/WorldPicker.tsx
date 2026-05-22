import { useNavigate } from 'react-router-dom'
import { Globe, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'

export function WorldPicker() {
  const navigate = useNavigate()
  const { entries, activeWorldId, setActiveWorldId } = useWorldLibrary()

  if (entries.length === 0) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-xs h-8"
        onClick={() => navigate('/worlds/new')}
      >
        <Globe className="size-3.5 mr-1.5 shrink-0" />
        Создать мир
      </Button>
    )
  }

  const activeWorld = entries.find(e => e.id === activeWorldId)

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex-1 justify-start text-xs h-8 px-2 min-w-0">
            <Globe className="size-3.5 mr-1.5 shrink-0" />
            <span className="truncate">{activeWorld?.world.name ?? '—'}</span>
            <ChevronDown className="size-3 ml-auto shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-48">
          {entries.map(e => (
            <DropdownMenuItem
              key={e.id}
              onClick={() => setActiveWorldId(e.id)}
            >
              {e.world.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveWorldId(null)}>
            Без мира
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={() => navigate('/worlds/new')}
        title="Создать мир"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
