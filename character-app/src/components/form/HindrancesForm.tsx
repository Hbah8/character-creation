import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resolveCharacterHindrances, resolveHindranceDefinitions, toCharacterHindrance } from '@/handbooks/services/resolveCharacterHindrances'
import { HINDRANCE_TYPE_LABEL_KEYS } from '@/handbooks/utils/handbookTranslationKeys'
import type { Hindrance, ColumnSide } from '@/types/character'
import type { HindranceType, StoredHandbookEntry } from '@/types/handbook'

const HINDRANCE_TYPES: HindranceType[] = ['Minor', 'Major']

interface Props {
  hindrances: Hindrance[]
  worldHandbook: readonly StoredHandbookEntry[]
  onAdd: (hindrance: Omit<Hindrance, 'id'>) => void
  onRemove: (id: string) => void
  column: ColumnSide
  onColumnChange: (col: ColumnSide) => void
}

export function HindrancesForm({ hindrances, worldHandbook, onAdd, onRemove, column, onColumnChange }: Props) {
  const { t: formT } = useTranslation('form')
  const { t: handbookT } = useTranslation('handbooks')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<HindranceType | undefined>()
  const definitions = resolveHindranceDefinitions(worldHandbook)
  const selectedHindrances = resolveCharacterHindrances(hindrances, worldHandbook)
  const selectedIds = new Set(hindrances.flatMap(hindrance => hindrance.hindranceId ? [hindrance.hindranceId] : []))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const pickerOptions = definitions.filter(definition =>
    !selectedIds.has(definition.id)
    && (!type || definition.type === type)
    && (!normalizedQuery || definition.name.toLocaleLowerCase().includes(normalizedQuery)),
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{formT('sections.hindrances')}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button size="sm" variant={column === 'left' ? 'default' : 'ghost'} className="rounded-none h-7 px-2 text-xs" onClick={() => onColumnChange('left')}>←</Button>
            <Button size="sm" variant={column === 'right' ? 'default' : 'ghost'} className="rounded-none h-7 px-2 text-xs" onClick={() => onColumnChange('right')}>→</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="flex flex-col gap-1">
          <Label htmlFor="hindrance-search">{formT('hindrances.search')}</Label>
          <Input
            id="hindrance-search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={formT('hindrances.searchPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="hindrance-type">{formT('hindrances.type')}</Label>
          <Select
            value={type ?? '__all__'}
            onValueChange={value => setType(value === '__all__' ? undefined : HINDRANCE_TYPES.find(item => item === value))}
          >
            <SelectTrigger id="hindrance-type"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="__all__">{formT('hindrances.allTypes')}</SelectItem>
              {HINDRANCE_TYPES.map(hindranceType => (
                <SelectItem key={hindranceType} value={hindranceType}>
                  {handbookT(HINDRANCE_TYPE_LABEL_KEYS[hindranceType])}
                </SelectItem>
              ))}
            </SelectGroup></SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
        {pickerOptions.map(definition => (
          <Button
            key={definition.id}
            type="button"
            variant="outline"
            className="h-auto min-h-10 justify-start px-3 py-2 text-left whitespace-normal"
            onClick={() => onAdd(toCharacterHindrance(definition))}
          >
            <Plus data-icon="inline-start" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{definition.name}</span>
                <Badge variant="secondary">{handbookT(HINDRANCE_TYPE_LABEL_KEYS[definition.type])}</Badge>
              </span>
              <span className="text-xs text-muted-foreground">{definition.description}</span>
            </span>
          </Button>
        ))}
        {pickerOptions.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">{formT('hindrances.noAvailableHindrances')}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {selectedHindrances.map(hindrance => (
          <section key={hindrance.id} className="flex min-w-0 items-start justify-between gap-2 rounded-md border p-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm">{hindrance.name}</strong>
                <Badge variant="secondary">
                  {hindrance.severity === 'major' ? formT('hindrances.severityMajor') : formT('hindrances.severityMinor')}
                </Badge>
              </div>
              {hindrance.description && <p className="break-words text-sm text-muted-foreground">{hindrance.description}</p>}
            </div>
            <Button size="icon-sm" variant="ghost" onClick={() => onRemove(hindrance.id)} className="shrink-0 text-destructive hover:text-destructive" aria-label={formT('hindrances.removeHindrance')}>
                <Trash2 />
            </Button>
          </section>
        ))}

        {selectedHindrances.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{formT('hindrances.noHindrances')}</p>
        )}
      </div>
    </div>
  )
}
