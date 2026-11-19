import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  id?: string
  contentClassName?: string
  showPreview?: boolean
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 4, id, contentClassName, showPreview = true }: Props) {
  const { t } = useTranslation('form')

  const textarea = (
    <Textarea
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn("resize-y", contentClassName)}
    />
  )

  if (!showPreview) return textarea

  return (
    <Tabs defaultValue="edit">
      <TabsList className="h-7 mb-1">
        <TabsTrigger value="edit" className="text-xs px-2 py-0.5">
          {t('markdownEditor.tabEdit')}
        </TabsTrigger>
        <TabsTrigger value="preview" className="text-xs px-2 py-0.5">
          {t('markdownEditor.tabPreview')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="edit">
        {textarea}
      </TabsContent>

      <TabsContent value="preview">
        <div
          className={cn("markdown-preview min-h-[var(--preview-min-h)] rounded-md border border-input bg-transparent px-3 py-2 text-sm overflow-auto", contentClassName)}
          style={{ '--preview-min-h': `${rows * 1.5}rem` } as React.CSSProperties}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
