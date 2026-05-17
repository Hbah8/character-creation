import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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

interface DraftEntry {
  libraryId: string
  name: string
  type: CombatantType
  isPlayer: boolean
  pace: number
  parry: number
  toughness: number
  maxWounds: number
  powerPoints: number
  maxPowerPoints: number
}

function parseIntOr(val: string | undefined, fallback: number): number {
  if (val === undefined) return fallback
  const n = parseInt(val, 10)
  return isNaN(n) ? fallback : n
}

function DraftEntryRow({
  draft,
  onChange,
}: {
  draft: DraftEntry
  onChange: (patch: Partial<DraftEntry>) => void
}) {
  return (
    <div className="flex items-center gap-1.5 py-1 border-b last:border-b-0">
      {/* Name */}
      <Input
        value={draft.name}
        onChange={e => onChange({ name: e.target.value })}
        className="h-7 text-xs min-w-0 flex-[2]"
        placeholder="Имя"
      />

      {/* Type */}
      <Select
        value={draft.type}
        onValueChange={v => {
          const t = v as CombatantType
          onChange({
            type: t,
            isPlayer: t !== 'wildcard' ? false : draft.isPlayer,
            maxWounds: t === 'wildcard' ? 3 : 1,
          })
        }}
      >
        <SelectTrigger className="h-7 text-xs flex-[1.5] min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="wildcard">Дик. Карта</SelectItem>
          <SelectItem value="extra">Статист</SelectItem>
          <SelectItem value="group">Группа</SelectItem>
        </SelectContent>
      </Select>

      {/* PC */}
      <div className="flex justify-center w-6 shrink-0">
        <Checkbox
          checked={draft.isPlayer && draft.type === 'wildcard'}
          disabled={draft.type !== 'wildcard'}
          onCheckedChange={checked => onChange({ isPlayer: !!checked })}
        />
      </div>

      {/* Numeric stats */}
      {([
        ['pace', 1, (v: number) => onChange({ pace: v || 6 })],
        ['parry', 0, (v: number) => onChange({ parry: v || 4 })],
        ['toughness', 0, (v: number) => onChange({ toughness: v || 5 })],
        ['maxWounds', 1, (v: number) => onChange({ maxWounds: Math.max(1, v || 3) })],
        ['maxPowerPoints', 0, (v: number) => onChange({ maxPowerPoints: v || 0 })],
      ] as const).map(([field, min, handler]) => (
        <Input
          key={field}
          type="number"
          min={min}
          value={draft[field as keyof DraftEntry] as number}
          onChange={e => handler(parseInt(e.target.value, 10))}
          className="h-7 text-xs w-12 shrink-0 px-1.5 text-center"
        />
      ))}
    </div>
  )
}

export function AddCombatantDialog({ open, onOpenChange, onAdd }: AddCombatantDialogProps) {
  // Single-entry form state
  const [name, setName] = useState('')
  const [type, setType] = useState<CombatantType>('wildcard')
  const [isPlayer, setIsPlayer] = useState(false)
  const [count, setCount] = useState(1)
  const [pace, setPace] = useState(6)
  const [parry, setParry] = useState(4)
  const [toughness, setToughness] = useState(5)
  const [maxWounds, setMaxWounds] = useState(3)
  const [powerPoints, setPowerPoints] = useState(0)
  const [maxPowerPoints, setMaxPowerPoints] = useState(0)

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [drafts, setDrafts] = useState<DraftEntry[]>([])

  const libraryEntries = loadLibrary()
  const isMultiMode = selectedIds.length > 1

  function makeDraft(id: string): DraftEntry | null {
    const entry = libraryEntries.find(e => e.id === id)
    if (!entry) return null
    const char = entry.character
    return {
      libraryId: id,
      name: char.callsign || char.name || 'Без имени',
      type: 'wildcard',
      isPlayer: true,
      pace: parseIntOr(char.pace, 6),
      parry: parseIntOr(char.parry, 4),
      toughness: parseIntOr(char.toughness, 5),
      maxWounds: 3,
      powerPoints: 0,
      maxPowerPoints: 0,
    }
  }

  function handleLibraryToggle(id: string) {
    if (selectedIds.includes(id)) {
      const remaining = selectedIds.filter(x => x !== id)
      const remainingDrafts = drafts.filter(d => d.libraryId !== id)
      setSelectedIds(remaining)
      setDrafts(remainingDrafts)

      // If dropping back to 1, sync single form from remaining draft
      if (remaining.length === 1) {
        const draft = remainingDrafts[0]
        if (draft) {
          setName(draft.name)
          setType(draft.type)
          setIsPlayer(draft.isPlayer)
          setPace(draft.pace)
          setParry(draft.parry)
          setToughness(draft.toughness)
          setMaxWounds(draft.maxWounds)
          setPowerPoints(draft.powerPoints)
          setMaxPowerPoints(draft.maxPowerPoints)
        }
      }
    } else {
      const draft = makeDraft(id)
      if (!draft) return

      setSelectedIds(prev => [...prev, id])
      setDrafts(prev => [...prev, draft])

      // If first selection, pre-fill single form
      if (selectedIds.length === 0) {
        setName(draft.name)
        setType(draft.type)
        setIsPlayer(draft.isPlayer)
        setPace(draft.pace)
        setParry(draft.parry)
        setToughness(draft.toughness)
        setMaxWounds(draft.maxWounds)
        setPowerPoints(draft.powerPoints)
        setMaxPowerPoints(draft.maxPowerPoints)
      }
    }
  }

  function updateDraft(libraryId: string, patch: Partial<DraftEntry>) {
    setDrafts(prev => prev.map(d => (d.libraryId === libraryId ? { ...d, ...patch } : d)))
  }

  function resetForm() {
    setName('')
    setType('wildcard')
    setIsPlayer(false)
    setCount(1)
    setSelectedIds([])
    setDrafts([])
    setPace(6)
    setParry(4)
    setToughness(5)
    setMaxWounds(3)
    setPowerPoints(0)
    setMaxPowerPoints(0)
  }

  function handleSubmit() {
    if (isMultiMode) {
      drafts.forEach(d => {
        onAdd({
          name: d.name.trim() || 'Без имени',
          type: d.type,
          isPlayer: d.isPlayer,
          count: 1,
          pace: d.pace,
          parry: d.parry,
          toughness: d.toughness,
          maxWounds: d.maxWounds,
          powerPoints: d.powerPoints,
          maxPowerPoints: d.maxPowerPoints,
        })
      })
    } else {
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
    }
    resetForm()
    onOpenChange(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !isMultiMode) handleSubmit()
  }

  const submitLabel = isMultiMode ? `Добавить ${drafts.length}` : 'Добавить'
  const submitDisabled = isMultiMode ? false : !name.trim()

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className={isMultiMode ? 'sm:max-w-xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle>
            {isMultiMode ? `Добавить участников (${drafts.length})` : 'Добавить участника'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Library multi-select */}
          {libraryEntries.length > 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Импорт из библиотеки</Label>
                <ScrollArea className="max-h-36 border rounded-md">
                  <div className="flex flex-col p-1.5 gap-0.5">
                    {libraryEntries.map(entry => {
                      const label = entry.character.callsign || entry.character.name || 'Без имени'
                      const checked = selectedIds.includes(entry.id)
                      return (
                        <label
                          key={entry.id}
                          className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-accent select-none"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleLibraryToggle(entry.id)}
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
              <Separator />
            </>
          )}

          {/* Multi-mode: editable draft list */}
          {isMultiMode ? (
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-1.5 pb-1 border-b">
                <span className="text-xs text-muted-foreground flex-[2] min-w-0">Имя</span>
                <span className="text-xs text-muted-foreground flex-[1.5] min-w-0">Тип</span>
                <span className="text-xs text-muted-foreground w-6 shrink-0 text-center">PC</span>
                <span className="text-xs text-muted-foreground w-12 shrink-0 text-center">Шаг</span>
                <span className="text-xs text-muted-foreground w-12 shrink-0 text-center">Защита</span>
                <span className="text-xs text-muted-foreground w-12 shrink-0 text-center">Стойк.</span>
                <span className="text-xs text-muted-foreground w-12 shrink-0 text-center">Ран</span>
                <span className="text-xs text-muted-foreground w-12 shrink-0 text-center">МаксОС</span>
              </div>
              <ScrollArea className="max-h-[320px]">
                <div className="flex flex-col">
                  {drafts.map(draft => (
                    <DraftEntryRow
                      key={draft.libraryId}
                      draft={draft}
                      onChange={patch => updateDraft(draft.libraryId, patch)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            /* Single-entry form */
            <div className="flex flex-col gap-4">
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
                  <Checkbox
                    id="is-player"
                    checked={isPlayer}
                    onCheckedChange={checked => setIsPlayer(!!checked)}
                  />
                  <Label htmlFor="is-player" className="cursor-pointer select-none">
                    Персонаж игрока (PC)
                  </Label>
                </div>
              )}

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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
