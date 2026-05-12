import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  gear: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export function GearForm({ gear, onAdd, onUpdate, onRemove }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.gear')}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" /> {t('gear.addItem')}
        </Button>
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
