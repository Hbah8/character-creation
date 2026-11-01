import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SheetTemplateId } from '@/types/character'

interface Props {
  templateId: SheetTemplateId
  onTemplateChange: (template: SheetTemplateId) => void
}

export function SheetTemplateControls({
  templateId,
  onTemplateChange,
}: Props) {
  const { t } = useTranslation('header')
  const templateOptions: Array<{ id: SheetTemplateId; label: string }> = [
    { id: 'classic', label: t('classicTemplate') },
    { id: 'compact', label: t('compactTemplate') },
  ]

  return (
    <div className="flex min-w-0 flex-col">
      <Select
        value={templateId}
        onValueChange={next => {
          if (next === 'classic' || next === 'compact') onTemplateChange(next)
        }}
      >
        <SelectTrigger aria-label={t('sheetTemplate')} className="h-7 w-full min-w-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {templateOptions.map(option => (
              <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
