import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Weapon, ColumnSide } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  weapons: Weapon[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Weapon>) => void
  onRemove: (id: string) => void
  column: ColumnSide
  onColumnChange: (col: ColumnSide) => void
}

type FormTKey = Parameters<ReturnType<typeof useTranslation<'form'>>['t']>[0]

type WeaponCol = { key: keyof Weapon; labelKey: FormTKey; placeholderKey: FormTKey }

export function WeaponsForm({ weapons, onAdd, onUpdate, onRemove, column, onColumnChange }: Props) {
  const { t } = useTranslation('form')

  const COLUMNS: WeaponCol[] = [
    { key: 'name',     labelKey: 'weapons.columnName',     placeholderKey: 'weapons.weaponNamePlaceholder' },
    { key: 'range',    labelKey: 'weapons.columnRange',    placeholderKey: 'weapons.rangePlaceholder' },
    { key: 'damage',   labelKey: 'weapons.columnDamage',   placeholderKey: 'weapons.damagePlaceholder' },
    { key: 'ap',       labelKey: 'weapons.columnAp',       placeholderKey: 'weapons.apPlaceholder' },
    { key: 'rof',      labelKey: 'weapons.columnRof',      placeholderKey: 'weapons.rofPlaceholder' },
    { key: 'magazine', labelKey: 'weapons.columnMag',      placeholderKey: 'weapons.magPlaceholder' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.weapons')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button size="sm" variant={column === 'left' ? 'default' : 'ghost'} className="rounded-none h-7 px-2 text-xs" onClick={() => onColumnChange('left')}>←</Button>
            <Button size="sm" variant={column === 'right' ? 'default' : 'ghost'} className="rounded-none h-7 px-2 text-xs" onClick={() => onColumnChange('right')}>→</Button>
          </div>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus data-icon="inline-start" /> {t('weapons.addWeapon')}
          </Button>
        </div>
      </div>

      {/* Mobile: card-per-weapon layout */}
      <div className="md:hidden flex flex-col gap-3">
        {weapons.map(w => (
          <div key={w.id} className="rounded-md border p-3 flex flex-col gap-2">
            {/* Name — full width */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t('weapons.columnName')}</Label>
              <Input
                value={w.name}
                onChange={e => onUpdate(w.id, { name: e.target.value })}
                placeholder={t('weapons.weaponNamePlaceholder')}
              />
            </div>
            {/* Range / Damage */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('weapons.columnRange')}</Label>
                <Input value={w.range} onChange={e => onUpdate(w.id, { range: e.target.value })} placeholder={t('weapons.rangePlaceholder')} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('weapons.columnDamage')}</Label>
                <Input value={w.damage} onChange={e => onUpdate(w.id, { damage: e.target.value })} placeholder={t('weapons.damagePlaceholder')} />
              </div>
            </div>
            {/* AP / RoF / Mag */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('weapons.columnAp')}</Label>
                <Input value={w.ap} onChange={e => onUpdate(w.id, { ap: e.target.value })} placeholder={t('weapons.apPlaceholder')} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('weapons.columnRof')}</Label>
                <Input value={w.rof} onChange={e => onUpdate(w.id, { rof: e.target.value })} placeholder={t('weapons.rofPlaceholder')} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t('weapons.columnMag')}</Label>
                <Input value={w.magazine} onChange={e => onUpdate(w.id, { magazine: e.target.value })} placeholder={t('weapons.magPlaceholder')} />
              </div>
            </div>
            {/* Delete */}
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => onRemove(w.id)} className="text-destructive hover:text-destructive">
                <Trash2 data-icon="inline-start" /> {t('weapons.removeWeapon')}
              </Button>
            </div>
          </div>
        ))}
        {weapons.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t('weapons.noWeapons')}</p>
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:flex flex-col gap-2">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_0.6fr_0.6fr_0.7fr_36px] gap-1.5">
          {COLUMNS.map(c => (
            <Label key={c.key} className="text-xs">{t(c.labelKey as never)}</Label>
          ))}
          <span />
        </div>

        {weapons.map(w => (
          <div key={w.id} className="grid grid-cols-[2fr_1.2fr_1.2fr_0.6fr_0.6fr_0.7fr_36px] gap-1.5 items-center">
            {COLUMNS.map(c => (
              <Input
                key={c.key}
                value={w[c.key]}
                onChange={e => onUpdate(w.id, { [c.key]: e.target.value })}
                placeholder={t(c.placeholderKey as never)}
              />
            ))}
            <Button size="icon" variant="ghost" onClick={() => onRemove(w.id)} className="text-destructive hover:text-destructive" aria-label={t('weapons.removeWeapon')}>
              <Trash2 />
            </Button>
          </div>
        ))}

        {weapons.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t('weapons.noWeapons')}</p>
        )}
      </div>
    </div>
  )
}
