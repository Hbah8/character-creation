import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { HandbookEntry } from '@/handbooks/components/HandbookEntry'
import type { AnyHandbookEntry } from '@/handbooks/types'
import { filterHandbookEntries } from '@/handbooks/utils/filterHandbookEntries'

interface Props {
  entries: AnyHandbookEntry[]
  search: string
  onSearchChange: (value: string) => void
}

export function HandbookList({ entries, search, onSearchChange }: Props) {
  const { t } = useTranslation('handbooks')
  const filtered = filterHandbookEntries(entries, search)

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder={t('search.placeholder')}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('search.noResults', { query: search.trim() })}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(entry => (
            <HandbookEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
