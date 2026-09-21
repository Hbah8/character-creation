import type { ResolvedModifierBreakdown } from '@/services/resolveEffectiveCharacter'

interface Props {
  label: string
  baseValue: string | number
  total: string | number
  modifiers: ResolvedModifierBreakdown[]
}

function formatAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : String(amount)
}

export function SheetModifierOverlay({ label, baseValue, total, modifiers }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium">{label}</div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Base</span>
        <span>{baseValue}</span>
      </div>
      {modifiers.map(modifier => (
        <div key={`${modifier.source}-${modifier.id}-${modifier.stat}`} className="flex items-center justify-between gap-4">
          <span>{modifier.name}</span>
          <span>{formatAmount(modifier.amount)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 border-t pt-2 font-medium">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}