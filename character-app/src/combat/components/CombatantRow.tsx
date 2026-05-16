import { Check, Flag, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Combatant, CombatantStatus } from '../types'
import { StatusToggleButton, CardBadge, ALL_STATUSES } from './StatusBadge'

const STATUS_LABELS: Record<string, string> = {
  shaken: 'Шок',
  distracted: 'Отвлечён',
  vulnerable: 'Уязвим',
  stunned: 'Оглушён',
  incapacitated: 'При смерти',
  dying: 'Умирает',
}

interface CombatantRowProps {
  combatant: Combatant
  isActive: boolean
  isSelected: boolean
  compact?: boolean
  onUpdate: (patch: Partial<Combatant>) => void
  onRemove: () => void
  onToggleStatus: (status: CombatantStatus) => void
  onRedrawCard: () => void
  onResolveRedraw: (keepNew: boolean) => void
  onSetActive: () => void
  onEndTurn: () => void
  onSelect: () => void
}

const TYPE_LABELS: Record<string, string> = {
  wildcard: 'Дикая Карта',
  extra: 'Статист',
  group: 'Группа',
}

function StatCounter({
  label,
  value,
  max,
  min = 0,
  onChange,
  danger,
}: {
  label: string
  value: number
  max?: number
  min?: number
  onChange: (v: number) => void
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <span className="text-xs text-muted-foreground mr-0.5 select-none">{label}</span>
      <Button
        size="icon"
        variant="ghost"
        className="size-5 text-sm leading-none rounded tabular-nums"
        tabIndex={-1}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <span
        className={cn(
          'w-5 text-center text-sm font-medium tabular-nums select-none',
          danger && 'text-destructive font-bold',
        )}
      >
        {value}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="size-5 text-sm leading-none rounded tabular-nums"
        tabIndex={-1}
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
      >
        +
      </Button>
    </div>
  )
}

export function CombatantRow({
  combatant,
  isActive,
  isSelected,
  compact = false,
  onUpdate,
  onRemove,
  onToggleStatus,
  onRedrawCard,
  onResolveRedraw,
  onSetActive,
  onEndTurn,
  onSelect,
}: CombatantRowProps) {
  const { type, isPlayer, card, pendingCard, statuses, eliminated } = combatant
  const isWildCard = type === 'wildcard'
  const isGroup = type === 'group'
  const isExtra = type === 'extra'
  const aliveCount = isGroup ? combatant.count - (combatant.groupEliminated ?? 0) : 0

  return (
    <Card
      className={cn(
        'border-l-2 transition-colors duration-150 cursor-pointer',
        isActive ? 'border-l-primary bg-primary/[0.03]' : 'border-l-border',
        isSelected && 'ring-1 ring-primary/60 bg-primary/[0.04]',
        eliminated && !isGroup && 'opacity-40',
        statuses.includes('incapacitated') && 'border-destructive/50',
        statuses.includes('dying') && 'border-destructive',
      )}
      onClick={onSelect}
    >
      <CardContent className="px-3 py-1.5">
        {/* ── Single main row ─────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Initiative card */}
          <div className="shrink-0 w-9 flex justify-center">
            {card ? (
              <CardBadge card={card} />
            ) : (
              <span className="text-xs text-muted-foreground/40 select-none">—</span>
            )}
          </div>

          {/* Active indicator */}
          {isActive && (
            <span className="text-primary shrink-0 -ml-0.5 text-sm font-bold leading-none select-none">
              ▶
            </span>
          )}

          {/* Name + active condition badges */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            <span className="font-medium text-sm truncate shrink min-w-[1.5rem]">
              {combatant.name}
              {isGroup && combatant.count > 1 && (
                <span className="text-muted-foreground font-normal"> ×{combatant.count}</span>
              )}
            </span>
            {!compact &&
              statuses.map(s => (
                <StatusToggleButton
                  key={s}
                  status={s}
                  active={true}
                  onToggle={() => onToggleStatus(s)}
                />
              ))}
          </div>

          {/* Type badge */}
          <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
            {TYPE_LABELS[type]}
          </Badge>

          {isPlayer && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
              PC
            </Badge>
          )}

          {card?.suit === 'joker' && (
            <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40 text-xs px-1.5 py-0 shrink-0">
              +2
            </Badge>
          )}

          {/* Wild Card stats */}
          {isWildCard && (
            <div className="flex items-center gap-2 ml-1 shrink-0">
              <StatCounter
                label="Раны"
                value={combatant.wounds}
                max={4}
                danger={combatant.wounds >= 3}
                onChange={v => onUpdate({ wounds: v })}
              />
              <StatCounter
                label="Уст."
                value={combatant.fatigue}
                max={3}
                danger={combatant.fatigue >= 2}
                onChange={v => onUpdate({ fatigue: v })}
              />
              <StatCounter
                label="Фишки"
                value={combatant.bennies}
                onChange={v => onUpdate({ bennies: v })}
              />
            </div>
          )}

          {/* Extra: alive toggle */}
          {isExtra && (
            <Button
              size="sm"
              variant={eliminated ? 'destructive' : 'outline'}
              className="h-6 text-xs ml-1 shrink-0"
              onClick={() => onUpdate({ eliminated: !eliminated })}
            >
              {eliminated ? 'Выбыл' : 'Жив'}
            </Button>
          )}

          {/* Group stats */}
          {isGroup && (
            <div className="flex items-center gap-2 ml-1 shrink-0">
              <StatCounter
                label="Живы"
                value={aliveCount}
                min={0}
                max={combatant.count}
                onChange={v => onUpdate({ groupEliminated: combatant.count - v })}
              />
              <StatCounter
                label="Шок"
                value={combatant.groupShocked ?? 0}
                min={0}
                max={aliveCount}
                onChange={v => onUpdate({ groupShocked: v })}
              />
              <StatCounter
                label="Вывед."
                value={combatant.groupEliminated ?? 0}
                min={0}
                max={combatant.count}
                onChange={v => onUpdate({ groupEliminated: v })}
              />
            </div>
          )}

          {/* End turn (active only) */}
          {isActive && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-primary gap-1 shrink-0"
              onClick={onEndTurn}
            >
              <Check className="size-3" />
              Ход
            </Button>
          )}

          {/* Condition picker (not in compact mode) */}
          {!compact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant={statuses.length > 0 ? 'secondary' : 'ghost'}
                  className="size-6 shrink-0"
                  title="Состояния"
                >
                  <Flag className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ALL_STATUSES.map(s => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onToggleStatus(s)}
                    className="gap-2"
                  >
                    {statuses.includes(s) ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <div className="size-3.5" />
                    )}
                    {STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-7 shrink-0">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isActive && (
                <DropdownMenuItem onClick={onSetActive}>▶ Отметить активным</DropdownMenuItem>
              )}
              {isWildCard && card && combatant.bennies > 0 && !pendingCard && (
                <DropdownMenuItem onClick={onRedrawCard}>
                  <RefreshCw className="size-3.5 mr-2" />
                  Перетянуть карту (−1 фишка)
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="size-3.5 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Pending redraw ────────────────────────────────────────── */}
        {pendingCard && (
          <div className="flex items-center gap-2 flex-wrap mt-1 ml-10 rounded bg-muted/50 px-2 py-1 text-xs">
            <span className="text-muted-foreground">Выберите карту:</span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1 text-xs"
              onClick={() => onResolveRedraw(false)}
            >
              Оставить <CardBadge card={card!} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1 text-xs"
              onClick={() => onResolveRedraw(true)}
            >
              Взять <CardBadge card={pendingCard} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
