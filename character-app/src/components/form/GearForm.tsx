import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ColumnSide } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  gear: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
  column: ColumnSide
  onColumnChange: (col: ColumnSide) => void
}

export function GearForm({ gear, onAdd, onUpdate, onRemove, column, onColumnChange }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.gear')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button size="sm" variant={column === 'left' ? 'default' : 'ghost'} className="rounded-none h-7 px-2 text-xs" onClick={() => onColumnChange('left')}>←</Button>
            <Button size="sm" variant={column === 'right' ? 'default' : 'ghost'} className="rounded-none h-7 px-2 text-xs" onClick={() => onColumnChange('right')}>→</Button>
          </div>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus data-icon="inline-start" /> {t('gear.addItem')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {gear.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={e => onUpdate(i, e.target.value)}
              placeholder={t('gear.itemPlaceholder')}
            />
            <Button size="icon" variant="ghost" onClick={() => onRemove(i)} className="text-destructive hover:text-destructive" aria-label={t('gear.removeItem')}>
              <Trash2 />
            </Button>
          </div>
        ))}

        {gear.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t('gear.noGear')}</p>
        )}
      </div>
    </div>
  )
}
