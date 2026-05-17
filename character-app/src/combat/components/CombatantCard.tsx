import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Swords, MoreHorizontal, Plus, X, Check, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Combatant, CombatantStatus } from '../types'
import { ALL_STATUSES } from './StatusBadge'
import { previewDamage, buildDamagePatch } from '../services/damageService'

const TYPE_LABELS: Record<string, string> = {
  wildcard: 'Дикая Карта',
  extra: 'Статист',
  group: 'Группа',
}

const STATUS_LABELS: Record<CombatantStatus, string> = {
  shaken: 'Шок',
  distracted: 'Отвлечён',
  vulnerable: 'Уязвим',
  stunned: 'Оглушён',
  incapacitated: 'При смерти',
  dying: 'Умирает',
  grabbed: 'Схвачен',
  restrained: 'Обездвижен',
  prone: 'Лежачий',
}

const STATUS_CLASSES: Record<CombatantStatus, string> = {
  shaken: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40',
  distracted: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40',
  vulnerable: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40',
  stunned: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40',
  incapacitated: 'bg-red-900/30 text-red-700 dark:text-red-300 border-red-900/50',
  dying: 'bg-red-900/50 text-red-800 dark:text-red-200 border-red-900/70 font-bold',
  grabbed: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40',
  restrained: 'bg-blue-700/20 text-blue-800 dark:text-blue-300 border-blue-700/40',
  prone: 'bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/40',
}

const MANEUVERS: { label: string; status: CombatantStatus }[] = [
  { label: 'Захватить', status: 'grabbed' },
  { label: 'Обездвижить', status: 'restrained' },
  { label: 'Сбить', status: 'prone' },
  { label: 'Отвлечь', status: 'distracted' },
  { label: 'Уязвить', status: 'vulnerable' },
  { label: 'Оглушить', status: 'stunned' },
]

const FATIGUE_MAX = 3

/** Colored square pip track for wounds / fatigue */
function PipTrack({
  filled,
  total,
  variant,
  onSetCount,
}: {
  filled: number
  total: number
  variant: 'wound' | 'fatigue'
  onSetCount: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled
        return (
          <button
            key={i}
            type="button"
            className={cn(
              'size-5 border-2 rounded transition-colors',
              isFilled && variant === 'wound' && 'bg-destructive border-destructive',
              isFilled && variant === 'fatigue' && 'bg-purple-500 border-purple-500',
              !isFilled && 'border-muted-foreground/30 bg-transparent hover:border-muted-foreground/60',
            )}
            onClick={() => onSetCount(isFilled ? i : i + 1)}
          />
        )
      })}
      {filled > total && (
        <span className="text-xs text-destructive font-bold ml-1">+{filled - total}</span>
      )}
    </div>
  )
}

/** Stat block — displays as bold read-only number; click to edit inline */
function StatBlock({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
}) {
  const [editing, setEditing] = useState(false)
  return (
    <div
      className={cn('flex flex-col items-center gap-0.5', !editing && 'cursor-pointer group')}
      onClick={() => { if (!editing) setEditing(true) }}
    >
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium select-none whitespace-nowrap">
        {label}
      </span>
      {editing ? (
        <Input
          type="number"
          min={min}
          value={value}
          autoFocus
          onChange={e => onChange(Math.max(min, parseInt(e.target.value, 10) || 0))}
          onBlur={() => setEditing(false)}
          onKeyDown={e => e.key === 'Enter' && setEditing(false)}
          onClick={e => e.stopPropagation()}
          className="h-8 w-12 text-center text-xl font-bold p-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      ) : (
        <span className="text-2xl font-bold tabular-nums leading-tight group-hover:text-primary transition-colors">
          {value}
        </span>
      )}
    </div>
  )
}

interface CombatantCardProps {
  combatant: Combatant
  onUpdate: (patch: Partial<Combatant>) => void
  onToggleStatus: (status: CombatantStatus) => void
  allCombatants: Combatant[]
  onUpdateCombatant: (id: string, patch: Partial<Combatant>) => void
  isActive?: boolean
  onEndTurn?: () => void
  onTakeHold?: () => void
}

export function CombatantCard({
  combatant,
  onUpdate,
  onToggleStatus,
  allCombatants,
  onUpdateCombatant,
  isActive,
  onEndTurn,
  onTakeHold,
}: CombatantCardProps) {
  const [damageOpen, setDamageOpen] = useState(false)
  const [hitInput, setHitInput] = useState('')
  const [dmgInput, setDmgInput] = useState('')
  const [targetId, setTargetId] = useState<string | null>(null)

  const { wounds, fatigue, maxWounds, statuses, pace, parry, toughness, powerPoints, maxPowerPoints, bennies } =
    combatant

  const penalty = -(Math.min(3, wounds) + Math.min(3, fatigue))
  const isWildCard = combatant.type === 'wildcard'
  const isGroup = combatant.type === 'group'
  const isDying = statuses.includes('dying')
  const isIncap = statuses.includes('incapacitated')
  const cardSuit = combatant.card?.suit
  const inactiveStatuses = ALL_STATUSES.filter(s => !statuses.includes(s))
  const bennieSlots = Math.max(bennies, 3)

  const targetCombatant = allCombatants.find(c => c.id === targetId) ?? null

  const previewResult = useMemo(() => {
    if (!targetCombatant) return null
    const hit = parseInt(hitInput, 10)
    const dmg = parseInt(dmgInput, 10)
    if (isNaN(hit) || isNaN(dmg)) return null
    return previewDamage(targetCombatant, hit, dmg)
  }, [hitInput, dmgInput, targetCombatant])

  function handleApplyDamage() {
    if (!previewResult || !targetCombatant) return
    const patch = buildDamagePatch(targetCombatant, previewResult)
    if (Object.keys(patch).length > 0) {
      onUpdateCombatant(targetCombatant.id, patch)
    }
    setHitInput('')
    setDmgInput('')
  }

  const resultColorClass =
    !previewResult || previewResult.type === 'miss' || previewResult.type === 'no_effect'
      ? 'bg-muted text-muted-foreground'
      : previewResult.type === 'shaken_only'
        ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
        : previewResult.willIncapacitate
          ? 'bg-destructive/15 text-destructive border border-destructive/30'
          : 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30'

  return (
    <div className="flex h-full">

      {/* ─────────── Main content ─────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">

        {/* ── Identity section ── */}
        <div className="p-4 flex gap-3 border-b shrink-0">
          {/* Avatar circle */}
          <div
            className={cn(
              'size-16 rounded-full shrink-0 flex items-center justify-center text-2xl font-bold select-none',
              isDying
                ? 'bg-destructive/20 text-destructive'
                : isIncap
                  ? 'bg-red-500/15 text-red-500'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {combatant.name.charAt(0).toUpperCase()}
          </div>

          {/* Name + type + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <h2
                  className={cn(
                    'text-2xl font-bold leading-tight truncate',
                    isDying && 'text-destructive',
                  )}
                >
                  {combatant.name}
                  {isGroup && combatant.count > 1 && (
                    <span className="text-muted-foreground font-normal text-lg"> ×{combatant.count}</span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {isWildCard ? (
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wide select-none">
                      ◆ {TYPE_LABELS.wildcard} ◆
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">
                      {TYPE_LABELS[combatant.type]}
                    </span>
                  )}
                  {combatant.isPlayer && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">PC</Badge>
                  )}
                  {combatant.onHold && (
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 text-[10px] h-4 px-1">
                      Наготове
                    </Badge>
                  )}
                </div>
              </div>

              {/* Overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-7 shrink-0 text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => onUpdate({ wounds: 0, fatigue: 0 })}>
                    Сбросить раны и усталость
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdate({ statuses: [], grabbedBy: undefined, restrainedBy: undefined })}
                    disabled={statuses.length === 0}
                  >
                    Снять все статусы
                  </DropdownMenuItem>
                  {isWildCard && <DropdownMenuSeparator />}
                  {isWildCard && (
                    <DropdownMenuItem onClick={() => onUpdate({ bennies: 3 })}>
                      Восстановить фишки (3)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      onUpdate(
                        maxPowerPoints === 0
                          ? { maxPowerPoints: 10, powerPoints: 10 }
                          : { maxPowerPoints: 0, powerPoints: 0 },
                      )
                    }
                  >
                    {maxPowerPoints === 0 ? '+ Очки силы' : '− Очки силы'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Core stats row */}
            <div className="flex gap-5 mt-3">
              <StatBlock label="Шаг" value={pace} min={1} onChange={v => onUpdate({ pace: v })} />
              <StatBlock label="Защита" value={parry} onChange={v => onUpdate({ parry: v })} />
              <StatBlock label="Стойкость" value={toughness} onChange={v => onUpdate({ toughness: v })} />
              <StatBlock label="Макс. ран" value={maxWounds} min={1} onChange={v => onUpdate({ maxWounds: v })} />
              {maxPowerPoints > 0 && (
                <StatBlock
                  label="ОС"
                  value={powerPoints}
                  onChange={v => onUpdate({ powerPoints: Math.min(v, maxPowerPoints) })}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Wounds / Fatigue (wildcards) ── */}
        {isWildCard && (
          <div className="px-4 py-3 border-b shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                  Раны
                </div>
                <PipTrack
                  filled={wounds}
                  total={maxWounds}
                  variant="wound"
                  onSetCount={v => onUpdate({ wounds: v })}
                />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                  Усталость
                </div>
                <PipTrack
                  filled={fatigue}
                  total={FATIGUE_MAX}
                  variant="fatigue"
                  onSetCount={v => onUpdate({ fatigue: v })}
                />
              </div>
            </div>
            {penalty !== 0 && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
                  Штраф
                </span>
                <span className="text-sm font-bold text-destructive font-mono tabular-nums">
                  {penalty}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Group counters ── */}
        {isGroup && (
          <div className="px-4 py-3 border-b shrink-0">
            <div className="flex justify-around">
              {[
                {
                  label: 'Живы',
                  value: combatant.count - (combatant.groupEliminated ?? 0),
                  onChange: (v: number) => onUpdate({ groupEliminated: combatant.count - v }),
                },
                {
                  label: 'Шок',
                  value: combatant.groupShocked ?? 0,
                  onChange: (v: number) => onUpdate({ groupShocked: v }),
                },
                {
                  label: 'Выбыли',
                  value: combatant.groupEliminated ?? 0,
                  onChange: (v: number) => onUpdate({ groupEliminated: v }),
                },
              ].map(({ label, value, onChange }) => (
                <StatBlock key={label} label={label} value={value} onChange={onChange} />
              ))}
            </div>
          </div>
        )}

        {/* ── Active statuses only ── */}
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
            {statuses.length === 0 && (
              <span className="text-xs text-muted-foreground/40 select-none">Нет активных статусов</span>
            )}
            {statuses.map(s => {
              const holderName =
                s === 'grabbed' && combatant.grabbedBy
                  ? (allCombatants.find(c => c.id === combatant.grabbedBy)?.name ?? null)
                  : s === 'restrained' && combatant.restrainedBy
                    ? (allCombatants.find(c => c.id === combatant.restrainedBy)?.name ?? null)
                    : null
              return (
                <span
                  key={s}
                  className={cn(
                    'inline-flex items-center gap-1 text-xs border rounded px-1.5 py-0.5 font-medium',
                    STATUS_CLASSES[s],
                  )}
                >
                  {STATUS_LABELS[s]}
                  {holderName && (
                    <span className="opacity-70 font-normal">← {holderName}</span>
                  )}
                  <button
                    type="button"
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => onToggleStatus(s)}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )
            })}
            {inactiveStatuses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="size-6 rounded-full shrink-0">
                    <Plus className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {inactiveStatuses.map(s => (
                    <DropdownMenuItem key={s} onClick={() => onToggleStatus(s)}>
                      {STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ── Footer: bennies + damage toggle ── */}
        <div className="px-4 py-2.5 flex items-center gap-3 border-b shrink-0">
          {isWildCard && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
                Фишки
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: bennieSlots }).map((_, i) => {
                  const filled = i < bennies
                  return (
                    <button
                      key={i}
                      type="button"
                      className={cn(
                        'size-4 rounded-full border-2 transition-colors',
                        filled
                          ? 'bg-primary border-primary'
                          : 'bg-transparent border-muted-foreground/30 hover:border-primary/60',
                      )}
                      onClick={() => onUpdate({ bennies: filled ? i : i + 1 })}
                    />
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex-1" />
          {isActive && onEndTurn && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={onEndTurn}
            >
              <Check className="size-3" />
              Закончить ход
            </Button>
          )}
          {isActive && onTakeHold && !combatant.onHold &&
            !statuses.includes('shaken') && !statuses.includes('stunned') && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={onTakeHold}
            >
              <Clock className="size-3" />
              Наготове
            </Button>
          )}
          <Button
            size="sm"
            variant={damageOpen ? 'secondary' : 'outline'}
            className="h-7 text-xs gap-1.5"
            onClick={() => setDamageOpen(v => !v)}
          >
            <Swords className="size-3" />
            Урон
            {damageOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>

        {/* ── Damage form (collapsible) ── */}
        {damageOpen && (
          <div className="px-4 py-3 flex flex-col gap-2.5 shrink-0">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Цель</Label>
              <Select value={targetId ?? ''} onValueChange={v => setTargetId(v || null)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Выберите цель…" />
                </SelectTrigger>
                <SelectContent>
                  {allCombatants.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="hit-input" className="text-xs text-muted-foreground">Атака</Label>
                <Input
                  id="hit-input"
                  type="number"
                  placeholder="Результат"
                  value={hitInput}
                  onChange={e => setHitInput(e.target.value)}
                  className="h-8 text-sm"
                  disabled={!targetCombatant}
                />
                <span className="text-[10px] text-muted-foreground">
                  vs Защ. <strong>{targetCombatant?.parry ?? '—'}</strong>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="dmg-input" className="text-xs text-muted-foreground">Урон</Label>
                <Input
                  id="dmg-input"
                  type="number"
                  placeholder="Результат"
                  value={dmgInput}
                  onChange={e => setDmgInput(e.target.value)}
                  className="h-8 text-sm"
                  disabled={!targetCombatant}
                />
                <span className="text-[10px] text-muted-foreground">
                  vs Стойк. <strong>{targetCombatant?.toughness ?? '—'}</strong>
                </span>
              </div>
            </div>

            {previewResult && (
              <div className={cn('rounded-md px-2.5 py-1.5 text-xs font-medium', resultColorClass)}>
                {previewResult.description}
              </div>
            )}

            <Button
              onClick={handleApplyDamage}
              disabled={
                !targetCombatant ||
                !previewResult ||
                previewResult.type === 'miss' ||
                previewResult.type === 'no_effect'
              }
              className="w-full h-8 text-sm"
            >
              Нанести урон
            </Button>

            {/* ── Maneuvers ── */}
            <div className="border-t pt-2.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                Манёвры
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MANEUVERS.map(({ label, status }) => {
                  const alreadyActive = targetCombatant?.statuses.includes(status)
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={alreadyActive ? 'secondary' : 'outline'}
                      className="h-7 text-xs"
                      disabled={!targetCombatant}
                      onClick={() => {
                        if (!targetCombatant) return
                        const current = targetCombatant.statuses
                        const next = alreadyActive
                          ? current.filter(s => s !== status)
                          : [...current, status]
                        const patch: Partial<Combatant> = { statuses: next }
                        if (status === 'grabbed') {
                          patch.grabbedBy = alreadyActive ? undefined : combatant.id
                        } else if (status === 'restrained') {
                          patch.restrainedBy = alreadyActive ? undefined : combatant.id
                        }
                        onUpdateCombatant(targetCombatant.id, patch)
                      }}
                    >
                      {alreadyActive && <X className="size-3 mr-1" />}
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────── Initiative strip (RIGHT) ─────────── */}
      <div className="w-16 shrink-0 border-l flex flex-col items-center py-3 gap-0.5 bg-muted/10">
        <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-medium select-none mb-1">
          Инит.
        </span>
        {combatant.card ? (
          <>
            <span
              className={cn(
                'text-3xl font-black tabular-nums leading-tight',
                (cardSuit === '♥' || cardSuit === '♦') && 'text-red-500',
                cardSuit === 'joker' && 'text-yellow-400',
              )}
            >
              {cardSuit === 'joker' ? '★' : combatant.card.label}
            </span>
            {cardSuit !== 'joker' && (
              <span
                className={cn(
                  'text-xl leading-none',
                  (cardSuit === '♥' || cardSuit === '♦') ? 'text-red-500' : 'text-foreground',
                )}
              >
                {cardSuit}
              </span>
            )}
          </>
        ) : (
          <span className="text-3xl font-black text-muted-foreground/20 leading-tight">—</span>
        )}
        <div className="flex-1" />
        {/* Decorative dots */}
        <div className="flex flex-col gap-1.5 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="size-1.5 rounded-full bg-muted-foreground/20" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CombatantCardEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
      <div className="text-4xl mb-3 opacity-30">⚔</div>
      <p className="text-sm">Выберите участника из списка</p>
      <p className="text-xs mt-1 opacity-70">Кликните по строке для просмотра деталей</p>
    </div>
  )
}
