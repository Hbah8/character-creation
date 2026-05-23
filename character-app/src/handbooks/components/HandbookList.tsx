import { useTranslation } from 'react-i18next'
import { HandbookEntry } from '@/handbooks/components/HandbookEntry'
import type { AnyHandbookEntry } from '@/handbooks/types'
import type { ResolvedEntry } from '@/types/handbook'

interface Props {
  entries: AnyHandbookEntry[]
  hasActiveFilters: boolean
  activeWorldName?: string
  onOverride?: (entry: AnyHandbookEntry) => void
  onEditOverride?: (entry: AnyHandbookEntry) => void
  onDeleteOverride?: (entry: AnyHandbookEntry) => void
}

export function HandbookList({ entries, hasActiveFilters, activeWorldName, onOverride, onEditOverride, onDeleteOverride }: Props) {
  const { t } = useTranslation('handbooks')

  return (
    <div className="flex flex-col gap-2">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {hasActiveFilters ? t('filter.noResults') : t('search.noResults', { query: '' })}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(entry => (
            <HandbookEntry
              key={entry.id}
              entry={entry}
              source={(entry as ResolvedEntry<AnyHandbookEntry>).source}
              activeWorldName={activeWorldName}
              onOverride={() => onOverride?.(entry)}
              onEditOverride={() => onEditOverride?.(entry)}
              onDeleteOverride={() => onDeleteOverride?.(entry)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
