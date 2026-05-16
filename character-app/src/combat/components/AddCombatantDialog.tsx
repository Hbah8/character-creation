import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { loadLibrary } from '@/services/libraryService'
import type { CombatantType } from '../types'

interface AddCombatantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (params: {
    name: string
    type: CombatantType
    isPlayer: boolean
    count: number
    pace: number
    parry: number
    toughness: number
    maxWounds: number
    powerPoints: number
    maxPowerPoints: number
  }) => void
}

export function AddCombatantDialog({ open, onOpenChange, onAdd }: AddCombatantDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CombatantType>('wildcard')
  const [isPlayer, setIsPlayer] = useState(false)
  const [count, setCount] = useState(1)
  const [libraryId, setLibraryId] = useState<string>('')
  const [pace, setPace] = useState(6)
  const [parry, setParry] = useState(4)
  const [toughness, setToughness] = useState(5)
  const [maxWounds, setMaxWounds] = useState(3)
  const [powerPoints, setPowerPoints] = useState(0)
  const [maxPowerPoints, setMaxPowerPoints] = useState(0)

  const libraryEntries = loadLibrary()

  function handleLibrarySelect(id: string) {
    setLibraryId(id)
    const entry = libraryEntries.find(e => e.id === id)
    if (entry) {
      const char = entry.character
      setName(char.callsign || char.name || '')
      setType('wildcard')
      setIsPlayer(true)
      const p = parseInt(char.pace, 10)
      const pa = parseInt(char.parry, 10)
      const t = parseInt(char.toughness, 10)
      if (!isNaN(p)) setPace(p)
      if (!isNaN(pa)) setParry(pa)
      if (!isNaN(t)) setToughness(t)
    }
  }

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({
      name: trimmed,
      type,
      isPlayer,
      count: type === 'group' ? Math.max(1, count) : 1,
      pace,
      parry,
      toughness,
      maxWounds,
      powerPoints,
      maxPowerPoints,
    })
    // Reset form
    setName('')
    setType('wildcard')
    setIsPlayer(false)
    setCount(1)
    setLibraryId('')
    setPace(6)
    setParry(4)
    setToughness(5)
    setMaxWounds(3)
    setPowerPoints(0)
    setMaxPowerPoints(0)
    onOpenChange(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить участника</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Library import */}
          {libraryEntries.length > 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Импорт из библиотеки</Label>
                <Select value={libraryId} onValueChange={handleLibrarySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбрать персонажа…" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraryEntries.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.character.callsign || e.character.name || 'Без имени'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
            </>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="combatant-name">Имя *</Label>
            <Input
              id="combatant-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Название или позывной"
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label>Тип</Label>
            <Select
              value={type}
              onValueChange={v => {
                const t = v as CombatantType
                setType(t)
                if (t !== 'wildcard') setIsPlayer(false)
                setMaxWounds(t === 'wildcard' ? 3 : 1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wildcard">Дикая Карта</SelectItem>
                <SelectItem value="extra">Статист</SelectItem>
                <SelectItem value="group">Группа статистов</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Count (groups only) */}
          {type === 'group' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-count">Количество</Label>
              <Input
                id="group-count"
                type="number"
                min={1}
                value={count}
                onChange={e => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          )}

          {/* Player flag (wildcards only) */}
          {type === 'wildcard' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={isPlayer}
                onClick={() => setIsPlayer(v => !v)}
                className={`size-4 rounded border transition-colors ${
                  isPlayer
                    ? 'bg-primary border-primary'
                    : 'border-border bg-background'
                }`}
              >
                {isPlayer && (
                  <svg viewBox="0 0 12 12" className="size-3 text-primary-foreground m-auto">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
              <Label
                className="cursor-pointer select-none"
                onClick={() => setIsPlayer(v => !v)}
              >
                Персонаж игрока (PC)
              </Label>
            </div>
          )}
        </div>

          {/* Combat stats */}
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Боевые параметры</p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="stat-pace" className="text-xs">Шаг</Label>
                <Input
                  id="stat-pace"
                  type="number"
                  min={1}
                  value={pace}
                  onChange={e => setPace(parseInt(e.target.value, 10) || 6)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="stat-parry" className="text-xs">Защита</Label>
                <Input
                  id="stat-parry"
                  type="number"
                  min={0}
                  value={parry}
                  onChange={e => setParry(parseInt(e.target.value, 10) || 4)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="stat-toughness" className="text-xs">Стойкость</Label>
                <Input
                  id="stat-toughness"
                  type="number"
                  min={0}
                  value={toughness}
                  onChange={e => setToughness(parseInt(e.target.value, 10) || 5)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="stat-maxwounds" className="text-xs">Макс. ран</Label>
                <Input
                  id="stat-maxwounds"
                  type="number"
                  min={1}
                  value={maxWounds}
                  onChange={e => setMaxWounds(Math.max(1, parseInt(e.target.value, 10) || 3))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="stat-pp" className="text-xs">Очки силы</Label>
                <Input
                  id="stat-pp"
                  type="number"
                  min={0}
                  value={powerPoints}
                  onChange={e => setPowerPoints(parseInt(e.target.value, 10) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="stat-maxpp" className="text-xs">Макс. ОС</Label>
                <Input
                  id="stat-maxpp"
                  type="number"
                  min={0}
                  value={maxPowerPoints}
                  onChange={e => setMaxPowerPoints(parseInt(e.target.value, 10) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
