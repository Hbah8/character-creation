import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { cn } from '@/lib/utils'
import type { Character } from '@/types/character'

interface Props {
  notes: Character['notes']
  onChange: (value: string) => void
  showPreview: boolean
}

export function NotesForm({ notes, onChange, showPreview }: Props) {
  const { t } = useTranslation('form')
  const notesId = useId()
  return (
    <div className={cn("flex flex-col gap-3", !showPreview && "min-h-0 flex-1")}>
      <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('sections.notes')}</h2>
      <div className={cn("flex flex-col gap-1", !showPreview && "min-h-0 flex-1")}>
        <Label htmlFor={notesId} className="sr-only">{t('notes.label')}</Label>
        <MarkdownEditor
          id={notesId}
          showPreview={showPreview}
          value={notes}
          onChange={onChange}
          placeholder={t('notes.placeholder')}
          rows={4}
          contentClassName={showPreview
            ? "max-h-[min(20rem,45svh)] overflow-auto"
            : "min-h-0 flex-1 field-sizing-fixed resize-none overflow-y-auto scrollbar-thin [scrollbar-color:var(--muted-foreground)_transparent] [scrollbar-gutter:stable] focus-visible:ring-0"
          }
        />
      </div>
    </div>
  )
}
