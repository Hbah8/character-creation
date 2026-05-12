import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  id?: string
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 4, id }: Props) {
  const { t } = useTranslation('form')

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
        <Textarea
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="resize-y"
        />
      </TabsContent>

      <TabsContent value="preview">
        <div
          className="markdown-preview min-h-[var(--preview-min-h)] rounded-md border border-input bg-transparent px-3 py-2 text-sm overflow-auto"
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
