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
  previewTemplate: SheetTemplateId
  printTemplate: SheetTemplateId
  onPreviewTemplateChange: (template: SheetTemplateId) => void
  onPrintTemplateChange: (template: SheetTemplateId) => void
}

export function SheetTemplateControls({
  previewTemplate,
  printTemplate,
  onPreviewTemplateChange,
  onPrintTemplateChange,
}: Props) {
  const { t } = useTranslation('header')
  const templateOptions: Array<{ id: SheetTemplateId; label: string }> = [
    { id: 'classic', label: t('classicTemplate') },
    { id: 'compact', label: t('compactTemplate') },
  ]

  function renderTemplateSelect(
    label: string,
    value: SheetTemplateId,
    onChange: (template: SheetTemplateId) => void,
  ) {
    return (
      <label className="flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground">
        <span className="truncate">{label}</span>
        <Select
          value={value}
          onValueChange={next => {
            if (next === 'classic' || next === 'compact') onChange(next)
          }}
        >
          <SelectTrigger aria-label={label} className="h-7 w-full min-w-0 text-xs">
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
      </label>
    )
  }

  return (
    <div className="grid min-w-0 grid-cols-2 gap-1.5">
      {renderTemplateSelect(t('previewTemplate'), previewTemplate, onPreviewTemplateChange)}
      {renderTemplateSelect(t('printTemplate'), printTemplate, onPrintTemplateChange)}
    </div>
  )
}
