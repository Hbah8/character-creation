import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type {
  World,
  WorldEntity,
  WorldEntityType,
  WorldRelationship,
  WorldRelationshipType,
} from '@/world/types'
import {
  WORLD_ENTITY_TYPES,
  WORLD_RELATIONSHIP_TYPES,
} from '@/world/types'
import {
  WORLD_ENTITY_LABEL_KEYS,
  WORLD_RELATIONSHIP_LABEL_KEYS,
} from '@/world/i18nKeys'

interface Props {
  world: World
  entity: WorldEntity | null
  relationship: WorldRelationship | null
  onUpdateEntity: (id: string, patch: Partial<WorldEntity>) => void
  onRemoveEntity: (id: string) => void
  onUpdateRelationship: (id: string, patch: Partial<WorldRelationship>) => void
  onRemoveRelationship: (id: string) => void
  onSelectEntity: (id: string) => void
  onSelectRelationship: (id: string) => void
}

function tagsToInput(tags: string[]): string {
  return tags.join(', ')
}

function inputToTags(value: string): string[] {
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

function entityName(
  world: World,
  id: string,
  missingLabel: string,
  entityTypeLabel: (type: WorldEntityType) => string,
): string {
  const entity = world.entities.find(item => item.id === id)
  return entity?.title || (entity ? entityTypeLabel(entity.type) : missingLabel)
}

export function WorldInspector({
  world,
  entity,
  relationship,
  onUpdateEntity,
  onRemoveEntity,
  onUpdateRelationship,
  onRemoveRelationship,
  onSelectEntity,
  onSelectRelationship,
}: Props) {
  const { t } = useTranslation('form')
  const entityTypeLabel = (type: WorldEntityType) => t(WORLD_ENTITY_LABEL_KEYS[type])
  const relationshipTypeLabel = (type: WorldRelationshipType) =>
    t(WORLD_RELATIONSHIP_LABEL_KEYS[type])

  const connectedRelationships = entity
    ? world.relationships.filter(item => item.sourceId === entity.id || item.targetId === entity.id)
    : []

  return (
    <aside className="w-full h-full border-l bg-background min-h-0">
      <ScrollArea className="h-full">
        <div className="p-4 flex flex-col gap-4">
          {!entity && !relationship && (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {t('world.selectPrompt')}
            </div>
          )}

          {entity && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('world.entity')}</p>
                  <h2 className="font-semibold text-base leading-tight">
                    {entity.title || entityTypeLabel(entity.type)}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemoveEntity(entity.id)}
                  aria-label={t('world.deleteEntity')}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{t('world.type')}</Label>
                <Select
                  value={entity.type}
                  onValueChange={value =>
                    onUpdateEntity(entity.id, { type: value as WorldEntityType })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORLD_ENTITY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {entityTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="entity-title" className="text-xs">{t('world.title')}</Label>
                <Input
                  id="entity-title"
                  value={entity.title}
                  onChange={e => onUpdateEntity(entity.id, { title: e.target.value })}
                  placeholder={t('world.entityTitlePlaceholder')}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="entity-summary" className="text-xs">{t('world.summary')}</Label>
                <Textarea
                  id="entity-summary"
                  value={entity.summary}
                  onChange={e => onUpdateEntity(entity.id, { summary: e.target.value })}
                  rows={3}
                  placeholder={t('world.entitySummaryPlaceholder')}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="entity-tags" className="text-xs">{t('world.tags')}</Label>
                <Input
                  id="entity-tags"
                  value={tagsToInput(entity.tags)}
                  onChange={e => onUpdateEntity(entity.id, { tags: inputToTags(e.target.value) })}
                  placeholder={t('world.tagsPlaceholder')}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{t('world.markdownNotes')}</Label>
                <MarkdownEditor
                  value={entity.description}
                  onChange={value => onUpdateEntity(entity.id, { description: value })}
                  placeholder={t('world.entityMarkdownPlaceholder')}
                  rows={8}
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">{t('world.relationships')}</Label>
                  <Badge variant="outline">{connectedRelationships.length}</Badge>
                </div>
                {connectedRelationships.map(item => (
                  <button
                    key={item.id}
                    className="rounded-md border p-2 text-left text-xs hover:bg-muted"
                    onClick={() => onSelectRelationship(item.id)}
                  >
                    <span className="font-medium">
                      {item.label || relationshipTypeLabel(item.type)}
                    </span>
                    <span className="block text-muted-foreground mt-0.5">
                      {entityName(world, item.sourceId, t('world.missingEntity'), entityTypeLabel)} {'->'} {entityName(world, item.targetId, t('world.missingEntity'), entityTypeLabel)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {relationship && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('world.relationship')}</p>
                  <h2 className="font-semibold text-base leading-tight">
                    {relationship.label || relationshipTypeLabel(relationship.type)}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemoveRelationship(relationship.id)}
                  aria-label={t('world.deleteRelationship')}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="rounded-md border p-3 text-xs">
                <button
                  className="font-medium hover:underline"
                  onClick={() => onSelectEntity(relationship.sourceId)}
                >
                  {entityName(world, relationship.sourceId, t('world.missingEntity'), entityTypeLabel)}
                </button>
                <span className="mx-2 text-muted-foreground">-&gt;</span>
                <button
                  className="font-medium hover:underline"
                  onClick={() => onSelectEntity(relationship.targetId)}
                >
                  {entityName(world, relationship.targetId, t('world.missingEntity'), entityTypeLabel)}
                </button>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{t('world.type')}</Label>
                <Select
                  value={relationship.type}
                  onValueChange={value =>
                    onUpdateRelationship(relationship.id, { type: value as WorldRelationshipType })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORLD_RELATIONSHIP_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {relationshipTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="relationship-label" className="text-xs">{t('world.relationshipLabel')}</Label>
                <Input
                  id="relationship-label"
                  value={relationship.label}
                  onChange={e =>
                    onUpdateRelationship(relationship.id, { label: e.target.value })
                  }
                  placeholder={relationshipTypeLabel(relationship.type)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">{t('world.markdownNotes')}</Label>
                <MarkdownEditor
                  value={relationship.description}
                  onChange={value =>
                    onUpdateRelationship(relationship.id, { description: value })
                  }
                  placeholder={t('world.relationshipMarkdownPlaceholder')}
                  rows={7}
                />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
