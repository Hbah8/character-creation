import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Edge } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  edges: Edge[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Edge>) => void
  onRemove: (id: string) => void
}

export function EdgesForm({ edges, onAdd, onUpdate, onRemove }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.edges')}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" /> {t('edges.addEdge')}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {edges.map(edge => (
          <div key={edge.id} className="flex flex-col gap-1.5 p-2 border rounded-md">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="text-xs">{t('edges.fieldName')}</Label>
                <Input
                  value={edge.name}
                  onChange={e => onUpdate(edge.id, { name: e.target.value })}
                  placeholder={t('edges.edgeNamePlaceholder')}
                />
              </div>
              <Button size="icon" variant="ghost" onClick={() => onRemove(edge.id)} className="mt-5 text-destructive hover:text-destructive" aria-label={t('edges.removeEdge')}>
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t('edges.fieldEffect')}</Label>
              <Textarea
                value={edge.effect}
                onChange={e => onUpdate(edge.id, { effect: e.target.value })}
                placeholder={t('edges.edgeEffectPlaceholder')}
                rows={2}
              />
            </div>
          </div>
        ))}

        {edges.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t('edges.noEdges')}</p>
        )}
      </div>
    </div>
  )
}
