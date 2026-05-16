import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CombatantStatus, Card } from '../types'

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CombatantStatus, { label: string; className: string }> = {
  shaken: {
    label: 'Шок',
    className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40',
  },
  distracted: {
    label: 'Отвлечён',
    className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40',
  },
  vulnerable: {
    label: 'Уязвим',
    className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40',
  },
  stunned: {
    label: 'Оглушён',
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40',
  },
  incapacitated: {
    label: 'При смерти',
    className: 'bg-red-900/30 text-red-700 dark:text-red-300 border-red-900/50',
  },
  dying: {
    label: 'Умирает',
    className: 'bg-red-900/50 text-red-800 dark:text-red-200 border-red-900/70 font-bold',
  },
}

export function StatusBadge({ status }: { status: CombatantStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn('text-xs px-1.5 py-0', className)}>
      {label}
    </Badge>
  )
}

// ── Status toggle button ─────────────────────────────────────────────────────

export function StatusToggleButton({
  status,
  active,
  onToggle,
}: {
  status: CombatantStatus
  active: boolean
  onToggle: () => void
}) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0 text-xs transition-opacity cursor-pointer',
        active ? className : 'border-border/40 text-muted-foreground opacity-50 hover:opacity-80',
      )}
    >
      {label}
    </button>
  )
}

export const ALL_STATUSES: CombatantStatus[] = [
  'shaken',
  'distracted',
  'vulnerable',
  'stunned',
  'incapacitated',
  'dying',
]

// ── Card badge ────────────────────────────────────────────────────────────────

const SUIT_COLOR: Record<string, string> = {
  '♥': 'text-red-500',
  '♦': 'text-red-500',
  '♠': '',
  '♣': '',
}

export function CardBadge({ card }: { card: Card }) {
  if (card.suit === 'joker') {
    return (
      <Badge className="bg-yellow-500 text-black font-bold border-yellow-400 px-1.5 py-0 text-xs">
        Joker
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn('font-mono text-xs px-1.5 py-0', SUIT_COLOR[card.suit])}
    >
      {card.suit}
      {card.label}
    </Badge>
  )
}
