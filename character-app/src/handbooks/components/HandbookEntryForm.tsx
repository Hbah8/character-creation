import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { computeOverrideDiff } from '@/handbooks/utils/computeOverrideDiff'
import {
  ARCANE_BACKGROUND_LABEL_KEYS,
  EDGE_TYPE_LABEL_KEYS,
  GEAR_CATEGORY_LABEL_KEYS,
  HINDRANCE_TYPE_LABEL_KEYS,
  MOUNT_CATEGORY_LABEL_KEYS,
  RACIAL_ABILITY_TYPE_LABEL_KEYS,
  RANK_LABEL_KEYS,
  WEAPON_CATEGORY_LABEL_KEYS,
} from '@/handbooks/utils/handbookTranslationKeys'
import type { AnyHandbookEntry } from '@/handbooks/types'
import type {
  ArcaneBackground,
  EdgeType,
  GearCategory,
  HandbookCategory,
  HandbookOverride,
  HindranceType,
  MountCategory,
  Rank,
  RacialAbilityType,
  WeaponCategory,
} from '@/types/handbook'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HandbookEntryFormProps {
  open: boolean
  category: HandbookCategory
  baseEntry?: AnyHandbookEntry
  existingOverride?: HandbookOverride
  worldName: string
  onClose: () => void
  onSave: (override: HandbookOverride) => void
  onDelete?: () => void
}

type FormValues = Record<string, unknown>

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
  getLabel,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  getLabel?: (v: string) => string
}) {
  return (
    <FieldRow label={label}>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o} value={o}>{getLabel ? getLabel(o) : o}</option>
        ))}
      </select>
    </FieldRow>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | ''
  onChange: (v: number | undefined) => void
}) {
  return (
    <FieldRow label={label}>
      <Input
        type="number"
        value={value}
        onChange={e => {
          const n = e.target.value === '' ? undefined : Number(e.target.value)
          onChange(n)
        }}
      />
    </FieldRow>
  )
}

// ---------------------------------------------------------------------------
// Category-specific field sections
// ---------------------------------------------------------------------------

const EDGE_TYPES: EdgeType[] = [
  'Background', 'Combat', 'Leadership', 'Power', 'Professional', 'Social', 'Weird', 'WildCard',
]
const HINDRANCE_TYPES: HindranceType[] = ['Major', 'Minor']
const WEAPON_CATEGORIES: WeaponCategory[] = ['Melee', 'Ranged', 'Thrown', 'Unarmed']
const GEAR_CATEGORIES: GearCategory[] = ['Adventuring', 'Clothing', 'Food', 'Tools', 'Other']
const MOUNT_CATEGORIES: MountCategory[] = ['animal', 'vehicle']
const RACIAL_ABILITY_TYPES: RacialAbilityType[] = ['positive', 'negative']
const ARCANE_BACKGROUNDS: ArcaneBackground[] = [
  'Magic', 'Miracles', 'Psionics', 'SuperPowers', 'WeirdScience',
]
const RANKS: Rank[] = ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary']

function EdgeFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <>
      <SelectField
        label={t('fields.type')}
        value={(values.type as string) ?? EDGE_TYPES[0]}
        options={EDGE_TYPES}
        getLabel={v => t(EDGE_TYPE_LABEL_KEYS[v as EdgeType])}
        onChange={v => set('type', v)}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="wildCardOnly"
          checked={!!(values.wildCardOnly)}
          onChange={e => set('wildCardOnly', e.target.checked || undefined)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="wildCardOnly" className="text-xs cursor-pointer">
          {t('fields.wildCardOnly')}
        </Label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">{t('entry.requirements')}</Label>
        <div className="border rounded-md p-3 flex flex-col gap-2">
          <SelectField
            label={t('entry.rank')}
            value={(values['requirements.rank'] as string) ?? ''}
            options={['', ...RANKS]}
            getLabel={v => v ? t(RANK_LABEL_KEYS[v as Rank]) : '—'}
            onChange={v => set('requirements.rank', v || undefined)}
          />
        </div>
      </div>
    </>
  )
}

function HindranceFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <div className="flex gap-2">
      {HINDRANCE_TYPES.map(type => (
        <Button
          key={type}
          type="button"
          size="sm"
          variant={values.type === type ? 'default' : 'outline'}
          onClick={() => set('type', type)}
        >
          {t(HINDRANCE_TYPE_LABEL_KEYS[type])}
        </Button>
      ))}
      <span className="text-xs text-muted-foreground self-center">{t('fields.type')}</span>
    </div>
  )
}

function WeaponFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <>
      <SelectField
        label={t('fields.category')}
        value={(values.category as string) ?? WEAPON_CATEGORIES[0]}
        options={WEAPON_CATEGORIES}
        getLabel={v => t(WEAPON_CATEGORY_LABEL_KEYS[v as WeaponCategory])}
        onChange={v => set('category', v)}
      />
      <FieldRow label={t('fields.damage')}>
        <Input value={(values.damage as string) ?? ''} onChange={e => set('damage', e.target.value)} />
      </FieldRow>
      <FieldRow label={t('fields.range')}>
        <Input value={(values.range as string) ?? ''} onChange={e => set('range', e.target.value || undefined)} />
      </FieldRow>
      <NumberField label={t('fields.ap')} value={(values.ap as number | '')} onChange={v => set('ap', v)} />
      <NumberField label={t('fields.rof')} value={(values.rof as number | '')} onChange={v => set('rof', v)} />
      <NumberField label={t('fields.weight')} value={(values.weight as number | '')} onChange={v => set('weight', v)} />
      <NumberField label={t('fields.cost')} value={(values.cost as number | '')} onChange={v => set('cost', v)} />
    </>
  )
}

function GearFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <>
      <SelectField
        label={t('fields.category')}
        value={(values.category as string) ?? GEAR_CATEGORIES[0]}
        options={GEAR_CATEGORIES}
        getLabel={v => t(GEAR_CATEGORY_LABEL_KEYS[v as GearCategory])}
        onChange={v => set('category', v)}
      />
      <NumberField label={t('fields.weight')} value={(values.weight as number | '')} onChange={v => set('weight', v)} />
      <NumberField label={t('fields.cost')} value={(values.cost as number | '')} onChange={v => set('cost', v)} />
    </>
  )
}

function PowerFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  const selected = (values.arcaneBackground as ArcaneBackground[]) ?? []

  function toggle(ab: ArcaneBackground) {
    if (selected.includes(ab)) {
      set('arcaneBackground', selected.filter(x => x !== ab))
    } else {
      set('arcaneBackground', [...selected, ab])
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">{t('fields.arcaneBackground')}</Label>
        <div className="flex flex-wrap gap-1.5">
          {ARCANE_BACKGROUNDS.map(ab => (
            <Button
              key={ab}
              type="button"
              size="sm"
              variant={selected.includes(ab) ? 'default' : 'outline'}
              onClick={() => toggle(ab)}
            >
              {t(ARCANE_BACKGROUND_LABEL_KEYS[ab])}
            </Button>
          ))}
        </div>
      </div>
      <FieldRow label={t('fields.ppCost')}>
        <Input value={(values.ppCost as string) ?? ''} onChange={e => set('ppCost', e.target.value)} />
      </FieldRow>
      <FieldRow label={t('fields.range')}>
        <Input value={(values.range as string) ?? ''} onChange={e => set('range', e.target.value)} />
      </FieldRow>
      <FieldRow label={t('fields.duration')}>
        <Input value={(values.duration as string) ?? ''} onChange={e => set('duration', e.target.value)} />
      </FieldRow>
    </>
  )
}

function MountFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <>
      <SelectField
        label={t('fields.category')}
        value={(values.category as string) ?? MOUNT_CATEGORIES[0]}
        options={MOUNT_CATEGORIES}
        getLabel={v => t(MOUNT_CATEGORY_LABEL_KEYS[v as MountCategory])}
        onChange={v => set('category', v)}
      />
      <NumberField label={t('fields.toughness')} value={(values.toughness as number | '')} onChange={v => set('toughness', v)} />
      <NumberField label={t('fields.pace')} value={(values.pace as number | '')} onChange={v => set('pace', v)} />
      <NumberField label={t('fields.handling')} value={(values.handling as number | '')} onChange={v => set('handling', v)} />
      <NumberField label={t('fields.cost')} value={(values.cost as number | '')} onChange={v => set('cost', v)} />
    </>
  )
}

function RacialAbilityFields({ values, set }: { values: FormValues; set: (k: string, v: unknown) => void }) {
  const { t } = useTranslation('handbooks')
  return (
    <>
      <div className="flex gap-2">
        {RACIAL_ABILITY_TYPES.map(type => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={values.type === type ? 'default' : 'outline'}
            onClick={() => set('type', type)}
          >
            {t(RACIAL_ABILITY_TYPE_LABEL_KEYS[type])}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground self-center">{t('fields.type')}</span>
      </div>
      <NumberField label={t('fields.points')} value={(values.points as number | '')} onChange={v => set('points', v)} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Build initial form values from resolved base + existing override
// ---------------------------------------------------------------------------

function buildInitialValues(
  category: HandbookCategory,
  baseEntry?: AnyHandbookEntry,
  existingOverride?: HandbookOverride,
): FormValues {
  const merged = { ...baseEntry, ...existingOverride } as FormValues

  // Flatten nested requirements.rank for edges
  if (category === 'edge') {
    const req = merged.requirements as { rank?: string } | undefined
    merged['requirements.rank'] = req?.rank ?? ''
    delete merged.requirements
  }

  return merged
}

// ---------------------------------------------------------------------------
// Assemble override from form values
// ---------------------------------------------------------------------------

function buildOverride(
  category: HandbookCategory,
  id: string,
  diff: Record<string, unknown>,
): HandbookOverride {
  // Re-nest requirements for edges
  if (category === 'edge') {
    const rankVal = diff['requirements.rank']
    delete diff['requirements.rank']
    if (rankVal !== undefined) {
      diff.requirements = { rank: rankVal || undefined }
    }
  }

  return { id, category, ...diff } as HandbookOverride
}

// ---------------------------------------------------------------------------
// HandbookEntryForm
// ---------------------------------------------------------------------------

export function HandbookEntryForm({
  open,
  category,
  baseEntry,
  existingOverride,
  worldName,
  onClose,
  onSave,
  onDelete,
}: HandbookEntryFormProps) {
  const { t } = useTranslation('handbooks')
  const isCustom = !baseEntry
  const isEditing = !!existingOverride

  const [values, setValues] = useState<FormValues>(() =>
    buildInitialValues(category, baseEntry, existingOverride),
  )

  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(category, baseEntry, existingOverride))
    }
  }, [open, category, baseEntry, existingOverride])

  function set(key: string, value: unknown) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const id = baseEntry?.id ?? existingOverride?.id ?? crypto.randomUUID()
    const diff = computeOverrideDiff(baseEntry, values)

    // If diff is empty for an override (not a custom entry), call onDelete instead
    if (!isCustom && Object.keys(diff).length === 0 && onDelete) {
      onDelete()
      return
    }

    const override = buildOverride(category, id, { ...diff })
    onSave(override)
  }

  const title = isCustom
    ? t('form.titleNew')
    : isEditing
      ? t('form.titleEdit')
      : t('form.titleOverride', { worldName })

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {!isCustom && (
              <Badge variant="secondary" className="text-xs">{worldName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Common fields */}
          <FieldRow label={t('entry.name')}>
            <Input
              value={(values.name as string) ?? ''}
              onChange={e => set('name', e.target.value)}
            />
          </FieldRow>
          <FieldRow label={t('fields.description')}>
            <Textarea
              value={(values.description as string) ?? ''}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </FieldRow>

          <Separator />

          {/* Category-specific fields */}
          {category === 'edge' && <EdgeFields values={values} set={set} />}
          {category === 'hindrance' && <HindranceFields values={values} set={set} />}
          {category === 'weapon' && <WeaponFields values={values} set={set} />}
          {category === 'gear' && <GearFields values={values} set={set} />}
          {category === 'power' && <PowerFields values={values} set={set} />}
          {category === 'mount' && <MountFields values={values} set={set} />}
          {category === 'racialAbility' && <RacialAbilityFields values={values} set={set} />}

          {!isCustom && (
            <p className="text-xs text-muted-foreground">{t('form.inheritedNote')}</p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="sm:mr-auto"
            >
              {t('actions.deleteOverride')}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('form.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            {t('form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
