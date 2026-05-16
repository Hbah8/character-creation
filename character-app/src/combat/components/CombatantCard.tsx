import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { StatusToggleButton } from './StatusBadge'
import { previewDamage, buildDamagePatch } from '../services/damageService'

const TYPE_LABELS: Record<string, string> = {
  wildcard: 'Дикая Карта',
  extra: 'Статист',
  group: 'Группа',
}

const FATIGUE_MAX = 3

function PipRow({
  label,
  filled,
  total,
  onSetCount,
}: {
  label: string
  filled: number
  total: number
  onSetCount: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < filled
          return (
            <button
              key={i}
              type="button"
              title={isFilled ? `Снять ранение ${i + 1}` : `Получить ранение ${i + 1}`}
              className={cn(
                'size-4 rounded-sm border transition-colors',
                isFilled
                  ? 'bg-destructive border-destructive'
                  : 'border-border bg-background hover:bg-muted',
              )}
              onClick={() => onSetCount(isFilled ? i : i + 1)}
            />
          )
        })}
      </div>
      {filled > total && (
        <span className="text-xs text-destructive font-bold">+{filled - total}</span>
      )}
      {filled > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">{filled}</span>
      )}
    </div>
  )
}

function StatInput({
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
  return (
    <div className="flex flex-col gap-1 items-center">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide select-none">
        {label}
      </span>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value, 10) || 0))}
        className="h-8 w-14 text-center text-sm font-medium"
      />
    </div>
  )
}

interface CombatantCardProps {
  combatant: Combatant
  onUpdate: (patch: Partial<Combatant>) => void
  onToggleStatus: (status: CombatantStatus) => void
  allCombatants: Combatant[]
  onUpdateCombatant: (id: string, patch: Partial<Combatant>) => void
}

export function CombatantCard({ combatant, onUpdate, onToggleStatus, allCombatants, onUpdateCombatant }: CombatantCardProps) {
  const [hitInput, setHitInput] = useState('')
  const [dmgInput, setDmgInput] = useState('')
  const [targetId, setTargetId] = useState<string | null>(null)

  const { wounds, fatigue, maxWounds, statuses, pace, parry, toughness, powerPoints, maxPowerPoints } =
    combatant

  const penalty = -(Math.min(3, wounds) + Math.min(3, fatigue))

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
    previewResult?.type === 'miss'
      ? 'bg-muted text-muted-foreground'
      : previewResult?.type === 'no_effect'
        ? 'bg-muted text-muted-foreground'
        : previewResult?.type === 'shaken_only'
          ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
          : previewResult?.willIncapacitate
            ? 'bg-destructive/15 text-destructive border border-destructive/30'
            : 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap shrink-0">
        <span className="font-semibold text-base leading-tight flex-1 min-w-0 truncate">
          {combatant.name}
          {combatant.type === 'group' && combatant.count > 1 && (
            <span className="text-muted-foreground font-normal text-sm"> ×{combatant.count}</span>
          )}
        </span>
        <Badge variant="outline" className="text-xs shrink-0">
          {TYPE_LABELS[combatant.type]}
        </Badge>
        {combatant.isPlayer && (
          <Badge variant="secondary" className="text-xs shrink-0">
            PC
          </Badge>
        )}
      </div>

      {/* ── Combat stats (editable) ── */}
      <div className="px-4 py-3 border-b shrink-0">
        <div className="flex items-end gap-3 flex-wrap">
          <StatInput label="Шаг" value={pace} min={1} onChange={v => onUpdate({ pace: v })} />
          <StatInput label="Защита" value={parry} onChange={v => onUpdate({ parry: v })} />
          <StatInput
            label="Стойкость"
            value={toughness}
            onChange={v => onUpdate({ toughness: v })}
          />
          <StatInput
            label="Макс. ран"
            value={maxWounds}
            min={1}
            onChange={v => onUpdate({ maxWounds: v })}
          />
          {maxPowerPoints > 0 && (
            <>
              <StatInput
                label="Оч. силы"
                value={powerPoints}
                onChange={v => onUpdate({ powerPoints: Math.min(v, maxPowerPoints) })}
              />
              <StatInput
                label="Макс. ОС"
                value={maxPowerPoints}
                onChange={v => onUpdate({ maxPowerPoints: v })}
              />
            </>
          )}
          {maxPowerPoints === 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline self-end mb-1.5"
              onClick={() => onUpdate({ maxPowerPoints: 10, powerPoints: 10 })}
            >
              + Очки силы
            </button>
          )}
        </div>
      </div>

      {/* ── Wounds & Fatigue & Penalty ── */}
      {combatant.type === 'wildcard' && (
        <div className="px-4 py-3 border-b space-y-2 shrink-0">
          <PipRow
            label="Раны"
            filled={wounds}
            total={maxWounds}
            onSetCount={v => onUpdate({ wounds: v })}
          />
          <PipRow
            label="Усталость"
            filled={fatigue}
            total={FATIGUE_MAX}
            onSetCount={v => onUpdate({ fatigue: v })}
          />
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-muted-foreground w-20 shrink-0">Штраф</span>
            <span
              className={cn(
                'text-sm font-bold font-mono tabular-nums',
                penalty < 0 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {penalty === 0 ? '—' : penalty}
            </span>
            {wounds > 0 && fatigue > 0 && (
              <span className="text-xs text-muted-foreground">
                ({wounds} ран + {fatigue} уст.)
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Status effects ── */}
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-xs text-muted-foreground mb-2">Состояния</p>
        <div className="flex flex-wrap gap-1">
          {(['shaken', 'distracted', 'vulnerable', 'stunned', 'incapacitated', 'dying'] as CombatantStatus[]).map(
            s => (
              <StatusToggleButton
                key={s}
                status={s}
                active={statuses.includes(s)}
                onToggle={() => onToggleStatus(s)}
              />
            ),
          )}
        </div>
      </div>

      {/* ── Bennies (wildcards) ── */}
      {combatant.type === 'wildcard' && (
        <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">Фишки</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="size-6 text-sm"
              tabIndex={-1}
              onClick={() => onUpdate({ bennies: Math.max(0, combatant.bennies - 1) })}
            >
              −
            </Button>
            <span className="w-6 text-center text-sm font-medium tabular-nums">
              {combatant.bennies}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="size-6 text-sm"
              tabIndex={-1}
              onClick={() => onUpdate({ bennies: combatant.bennies + 1 })}
            >
              +
            </Button>
          </div>
        </div>
      )}

      {/* ── Damage form ── */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-sm font-medium">Нанести урон</p>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Цель</Label>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="hit-input" className="text-xs">
              Атака
            </Label>
            <Input
              id="hit-input"
              type="number"
              placeholder="Результат"
              value={hitInput}
              onChange={e => setHitInput(e.target.value)}
              className="h-8 text-sm"
              disabled={!targetCombatant}
            />
            <span className="text-xs text-muted-foreground">
              vs Защита{' '}
              <strong>{targetCombatant?.parry ?? '—'}</strong>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="dmg-input" className="text-xs">
              Урон
            </Label>
            <Input
              id="dmg-input"
              type="number"
              placeholder="Результат"
              value={dmgInput}
              onChange={e => setDmgInput(e.target.value)}
              className="h-8 text-sm"
              disabled={!targetCombatant}
            />
            <span className="text-xs text-muted-foreground">
              vs Стойкость{' '}
              <strong>{targetCombatant?.toughness ?? '—'}</strong>
            </span>
          </div>
        </div>

        {previewResult && (
          <div className={cn('rounded-md px-3 py-2 text-sm font-medium', resultColorClass)}>
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
          className="w-full"
        >
          Нанести урон
        </Button>
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
