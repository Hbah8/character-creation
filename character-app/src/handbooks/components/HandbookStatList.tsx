import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HandbookEntryDetail } from '@/handbooks/components/HandbookEntryDetail'
import type { AnyHandbookEntry } from '@/handbooks/types'
import { isGear, isMount, isWeapon } from '@/handbooks/types'
import { filterHandbookEntries } from '@/handbooks/utils/filterHandbookEntries'

interface Props {
  entries: AnyHandbookEntry[]
  search: string
  onSearchChange: (value: string) => void
}

// ---------------------------------------------------------------------------
// Column headers (resolved from first entry type)
// ---------------------------------------------------------------------------

function useColumnHeaders(entries: AnyHandbookEntry[]) {
  const { t } = useTranslation('handbooks')
  if (!entries.length) return []
  const first = entries[0]
  if (isWeapon(first)) return [
    t('fields.category'),
    t('fields.damage'),
    t('fields.range'),
    t('fields.ap'),
    t('fields.cost'),
  ]
  if (isGear(first)) return [
    t('fields.category'),
    t('fields.weight'),
    t('fields.cost'),
  ]
  if (isMount(first)) return [
    t('fields.category'),
    t('fields.toughness'),
    t('fields.pace'),
    t('fields.cost'),
  ]
  return []
}

// ---------------------------------------------------------------------------
// Row stat cells (type-specific)
// ---------------------------------------------------------------------------

function StatCells({ entry }: { entry: AnyHandbookEntry }) {
  if (isWeapon(entry)) {
    return (
      <>
        <TableCell>
          <Badge variant="outline" className="text-xs">{entry.category}</Badge>
        </TableCell>
        <TableCell className="font-mono text-xs">{entry.damage}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{entry.range ?? '—'}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{entry.ap ?? '—'}</TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {entry.cost != null ? `$${entry.cost}` : '—'}
        </TableCell>
      </>
    )
  }

  if (isGear(entry)) {
    return (
      <>
        <TableCell>
          <Badge variant="outline" className="text-xs">{entry.category}</Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {entry.weight != null ? `${entry.weight} lb` : '—'}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {entry.cost != null ? `$${entry.cost}` : '—'}
        </TableCell>
      </>
    )
  }

  if (isMount(entry)) {
    return (
      <>
        <TableCell>
          <Badge variant="outline" className="text-xs">{entry.category}</Badge>
        </TableCell>
        <TableCell className="text-xs font-mono">{entry.toughness}</TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {entry.pace != null ? `${entry.pace}"` : '—'}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {entry.cost != null ? `$${entry.cost}` : '—'}
        </TableCell>
      </>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  entry: AnyHandbookEntry
  onClose: () => void
}

function DetailPanel({ entry, onClose }: DetailPanelProps) {
  const { t } = useTranslation('handbooks')

  return (
    <div className="w-72 shrink-0 border-l flex flex-col overflow-hidden">
      <div className="flex items-start gap-2 px-4 py-3 border-b">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm leading-snug">{entry.name}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {t('badge.swade')}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={t('entry.close')}
          className="shrink-0 mt-0.5"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
        <Separator />
        <HandbookEntryDetail entry={entry} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HandbookStatList
// ---------------------------------------------------------------------------

export function HandbookStatList({ entries, search, onSearchChange }: Props) {
  const { t } = useTranslation('handbooks')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = filterHandbookEntries(entries, search)
  const selectedEntry = selectedId != null
    ? entries.find(e => e.id === selectedId) ?? null
    : null

  const headers = useColumnHeaders(entries)

  function handleRowClick(id: string) {
    setSelectedId(prev => prev === id ? null : id)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: search + table */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="px-6 py-3 border-b">
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-6">
              {t('search.noResults', { query: search.trim() })}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('entry.name')}</TableHead>
                  {headers.map(h => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    data-state={selectedId === entry.id ? 'selected' : undefined}
                    onClick={() => handleRowClick(entry.id)}
                  >
                    <TableCell className="pl-6 font-medium text-sm">{entry.name}</TableCell>
                    <StatCells entry={entry} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Right: persistent detail panel */}
      {selectedEntry && (
        <DetailPanel entry={selectedEntry} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
