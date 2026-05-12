import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, FileJson, FileText, Link, Upload } from 'lucide-react'

interface Props {
  onExportPdf: () => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onCopyLink: () => void
  copyLinkStatus: 'idle' | 'copied'
}

export function ExportDropdown({ onExportPdf, onExportJson, onImportJson, onCopyLink, copyLinkStatus }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation('header')
  const { t: tShare } = useTranslation('share')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onImportJson(file)
      // reset so the same file can be re-imported
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {t('exportImportButton')} <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onExportPdf}>
              <FileText data-icon="inline-start" /> {t('exportPdf')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportJson}>
              <FileJson data-icon="inline-start" /> {t('exportJson')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopyLink}>
              <Link data-icon="inline-start" />
              {copyLinkStatus === 'copied' ? tShare('copied') : tShare('copyLink')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload data-icon="inline-start" /> {t('importJson')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
