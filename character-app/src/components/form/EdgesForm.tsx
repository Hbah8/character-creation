import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { LockKeyhole, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resolveCharacterEdges, resolveEdgeDefinitions } from '@/handbooks/services/resolveCharacterEdges'
import { ARCANE_BACKGROUND_LABEL_KEYS, EDGE_TYPE_LABEL_KEYS, RANK_LABEL_KEYS } from '@/handbooks/utils/handbookTranslationKeys'
import { filterEdgeSelectionOptions, getEdgeSelectionOptions, type UnmetEdgeRequirement } from '@/services/edgeSelectionService'
import type { Character, ColumnSide } from '@/types/character'
import type { ArcaneBackground, ArcaneBackgroundRequirement, Edge, EdgeRequirement, EdgeRequirementCondition, EdgeType, StoredHandbookEntry } from '@/types/handbook'

const EDGE_TYPES: EdgeType[] = ['Background', 'Combat', 'Leadership', 'Power', 'Professional', 'Social', 'Weird', 'WildCard']
const ARCANE_BACKGROUNDS: ArcaneBackground[] = ['Magic', 'Miracles', 'Psionics', 'SuperPowers', 'WeirdScience']
const ARCANE_REQUIREMENT_BACKGROUND: Record<Exclude<ArcaneBackgroundRequirement, 'any'>, ArcaneBackground> = {
  magic: 'Magic',
  miracles: 'Miracles',
  psionics: 'Psionics',
  gifted: 'SuperPowers',
  weirdScience: 'WeirdScience',
}

interface Props {
  character: Character
  worldHandbook: readonly StoredHandbookEntry[]
  onAdd: (edgeId: string) => void
  onRemove: (id: string) => void
  onArcaneBackgroundChange: (arcaneBackground: ArcaneBackground | undefined) => void
  column: ColumnSide
  onColumnChange: (col: ColumnSide) => void
}

interface EdgeRequirementsListProps {
  requirements: Edge['requirements']
  definitions: readonly Edge[]
  unmetRequirements?: readonly UnmetEdgeRequirement[]
}

function formatCondition(condition: EdgeRequirementCondition, definitions: readonly Edge[], formT: TFunction<'form'>, handbookT: TFunction<'handbooks'>): string {
  switch (condition.type) {
    case 'rank':
      return formT('edges.requirements.rank', { rank: handbookT(RANK_LABEL_KEYS[condition.minimum]) })
    case 'attribute':
      return formT('edges.requirements.attribute', { attribute: formT(`attributes.${condition.attribute}`), die: condition.minimum })
    case 'skill':
      return formT('edges.requirements.skill', { skill: condition.skill, die: condition.minimum })
    case 'edge': {
      const edgeName = definitions.find(definition => definition.id === condition.edgeId)?.name ?? condition.edgeId
      const background = condition.arcaneBackground && condition.arcaneBackground !== 'any'
        ? ` (${handbookT(ARCANE_BACKGROUND_LABEL_KEYS[ARCANE_REQUIREMENT_BACKGROUND[condition.arcaneBackground]])})`
        : ''
      return formT('edges.requirements.edge', { edge: `${edgeName}${background}` })
    }
    case 'hindrance': return formT('edges.requirements.hindrance', { hindrance: condition.hindranceId })
    case 'race': return formT('edges.requirements.race', { race: condition.raceId })
    case 'wildCard': return formT('edges.requirements.wildCard')
    case 'text': return condition.text
  }
}

function formatRequirement(requirement: EdgeRequirement, definitions: readonly Edge[], formT: TFunction<'form'>, handbookT: TFunction<'handbooks'>): string {
  if ('anyOf' in requirement) {
    return formT('edges.requirements.anyOf', {
      conditions: requirement.anyOf.map(condition => formatCondition(condition, definitions, formT, handbookT)).join(` ${formT('edges.requirements.or')} `),
    })
  }
  return formatCondition(requirement, definitions, formT, handbookT)
}

function formatUnmetRequirement(requirement: UnmetEdgeRequirement, definitions: readonly Edge[], formT: TFunction<'form'>, handbookT: TFunction<'handbooks'>): string {
  if (requirement.type === 'anyOf') {
    return formT('edges.requirements.anyOf', {
      conditions: requirement.conditions.map(condition => formatUnmetRequirement(condition, definitions, formT, handbookT)).join(` ${formT('edges.requirements.or')} `),
    })
  }
  if (requirement.type === 'arcaneBackground') {
    return formT('edges.requirements.arcaneBackground', {
      background: handbookT(ARCANE_BACKGROUND_LABEL_KEYS[ARCANE_REQUIREMENT_BACKGROUND[requirement.minimum]]),
    })
  }
  return formatCondition(requirement, definitions, formT, handbookT)
}

function EdgeRequirementsList({ requirements, definitions, unmetRequirements = [] }: EdgeRequirementsListProps) {
  const { t: formT } = useTranslation('form')
  const { t: handbookT } = useTranslation('handbooks')
  if (!requirements || requirements.allOf.length === 0) return null

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{formT('edges.requirements.title')}</span>
      <div className="flex flex-wrap gap-1">
        {requirements.allOf.map((requirement, index) => (
          <Badge key={`${index}-${JSON.stringify(requirement)}`} variant="outline" className="h-auto max-w-full whitespace-normal break-words">
            {formatRequirement(requirement, definitions, formT, handbookT)}
          </Badge>
        ))}
      </div>
      {unmetRequirements.length > 0 && (
        <p className="break-words text-xs text-destructive">
          {formT('edges.requirements.unmet', {
            requirements: unmetRequirements.map(requirement => formatUnmetRequirement(requirement, definitions, formT, handbookT)).join(', '),
          })}
        </p>
      )}
    </div>
  )
}

export function EdgesForm({ character, worldHandbook, onAdd, onRemove, onArcaneBackgroundChange, column, onColumnChange }: Props) {
  const { t: formT } = useTranslation('form')
  const { t: handbookT } = useTranslation('handbooks')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<EdgeType | undefined>()
  const [showUnavailable, setShowUnavailable] = useState(false)
  const definitions = resolveEdgeDefinitions(worldHandbook)
  const selectedEdges = resolveCharacterEdges(character.edges, worldHandbook)
  const selectedEdgeIds = new Set(character.edges.map(edge => edge.edgeId))
  const pickerOptions = filterEdgeSelectionOptions(
    getEdgeSelectionOptions(definitions, character).filter(option => !selectedEdgeIds.has(option.edge.id)),
    { query, type, showUnavailable },
  )
  const hasMysticGift = selectedEdgeIds.has('misticheskiy-dar')

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{formT('sections.edges')}</h2>
        <div className="flex items-center overflow-hidden rounded-md border">
          <Button size="sm" variant={column === 'left' ? 'default' : 'ghost'} className="h-7 rounded-none px-2 text-xs" onClick={() => onColumnChange('left')}>←</Button>
          <Button size="sm" variant={column === 'right' ? 'default' : 'ghost'} className="h-7 rounded-none px-2 text-xs" onClick={() => onColumnChange('right')}>→</Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="flex flex-col gap-1">
          <Label htmlFor="edge-search">{formT('edges.search')}</Label>
          <Input id="edge-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={formT('edges.searchPlaceholder')} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="edge-type">{formT('edges.type')}</Label>
          <Select value={type ?? '__all__'} onValueChange={value => setType(value === '__all__' ? undefined : value as EdgeType)}>
            <SelectTrigger id="edge-type"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="__all__">{formT('edges.allTypes')}</SelectItem>
              {EDGE_TYPES.map(edgeType => <SelectItem key={edgeType} value={edgeType}>{handbookT(EDGE_TYPE_LABEL_KEYS[edgeType])}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="show-unavailable-edges" checked={showUnavailable} onCheckedChange={checked => setShowUnavailable(checked === true)} />
        <Label htmlFor="show-unavailable-edges" className="cursor-pointer text-sm">{formT('edges.showUnavailable')}</Label>
      </div>

      <div className="flex min-w-0 max-h-64 flex-col gap-2 overflow-y-auto pr-1">
        {pickerOptions.map(option => option.isAvailable ? (
          <Button key={option.edge.id} type="button" variant="outline" className="h-auto min-h-10 justify-start px-3 py-2 text-left whitespace-normal" onClick={() => onAdd(option.edge.id)}>
            <Plus data-icon="inline-start" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium">{option.edge.name}</span>
              <span className="text-xs text-muted-foreground">{handbookT(EDGE_TYPE_LABEL_KEYS[option.edge.type])}</span>
            </span>
          </Button>
        ) : (
          <div key={option.edge.id} className="flex min-w-0 flex-col gap-1 rounded-md border border-dashed px-3 py-2 text-muted-foreground" aria-disabled="true">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <LockKeyhole aria-hidden="true" />
              <span className="min-w-0 break-words font-medium">{option.edge.name}</span>
              <Badge variant="outline">{handbookT(EDGE_TYPE_LABEL_KEYS[option.edge.type])}</Badge>
            </div>
            <EdgeRequirementsList requirements={option.edge.requirements} definitions={definitions} unmetRequirements={option.unmetRequirements} />
          </div>
        ))}
        {pickerOptions.length === 0 && <p className="py-2 text-center text-sm text-muted-foreground">{formT('edges.noAvailableEdges')}</p>}
      </div>

      {hasMysticGift && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="arcane-background">{formT('edges.arcaneBackground')}</Label>
          <Select value={character.arcaneBackground ?? '__none__'} onValueChange={value => onArcaneBackgroundChange(value === '__none__' ? undefined : value as ArcaneBackground)}>
            <SelectTrigger id="arcane-background"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="__none__">{formT('edges.noArcaneBackground')}</SelectItem>
              {ARCANE_BACKGROUNDS.map(background => <SelectItem key={background} value={background}>{handbookT(ARCANE_BACKGROUND_LABEL_KEYS[background])}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-2">
        {selectedEdges.map(edge => (
          <section key={edge.id} className="flex min-w-0 flex-col gap-2 rounded-md border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{edge.name}</strong>
                  <Badge variant="secondary">{handbookT(EDGE_TYPE_LABEL_KEYS[edge.type])}</Badge>
                </div>
                <p className="text-sm break-words text-muted-foreground">{edge.description}</p>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => onRemove(edge.id)} className="shrink-0 text-destructive hover:text-destructive" aria-label={formT('edges.removeEdge')}>
                <Trash2 />
              </Button>
            </div>
            <EdgeRequirementsList requirements={edge.requirements} definitions={definitions} />
          </section>
        ))}
        {selectedEdges.length === 0 && <p className="py-2 text-center text-sm text-muted-foreground">{formT('edges.noEdges')}</p>}
      </div>
    </div>
  )
}