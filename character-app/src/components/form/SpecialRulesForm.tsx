import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import type { SpecialRule } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  specialRules: SpecialRule[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<SpecialRule>) => void
  onRemove: (id: string) => void
}

export function SpecialRulesForm({ specialRules, onAdd, onUpdate, onRemove }: Props) {
  const { t } = useTranslation('form')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.specialRules')}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" /> {t('specialRules.addRule')}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {specialRules.map(rule => (
          <div key={rule.id} className="flex flex-col gap-1.5 p-2 border rounded-md">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="text-xs">{t('specialRules.fieldName')}</Label>
                <Input
                  value={rule.name}
                  onChange={e => onUpdate(rule.id, { name: e.target.value })}
                  placeholder={t('specialRules.ruleNamePlaceholder')}
                />
              </div>
              <Button size="icon" variant="ghost" onClick={() => onRemove(rule.id)} className="mt-5 text-destructive hover:text-destructive" aria-label={t('specialRules.removeRule')}>
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t('specialRules.fieldDescription')}</Label>
              <MarkdownEditor
                value={rule.description}
                onChange={v => onUpdate(rule.id, { description: v })}
                placeholder={t('specialRules.ruleDescPlaceholder')}
                rows={2}
              />
            </div>
          </div>
        ))}

        {specialRules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t('specialRules.noRules')}</p>
        )}
      </div>
    </div>
  )
}
