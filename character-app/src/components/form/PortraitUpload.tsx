import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { readFileAsBase64 } from '@/services/portraitService'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function PortraitUpload({ value, onChange }: Props) {
  const { t } = useTranslation('form')
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    inputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected after clearing
    e.target.value = ''
    try {
      const base64 = await readFileAsBase64(file)
      setError(null)
      onChange(base64)
    } catch (err) {
      if (err instanceof Error) {
        setError(t(err.message as Parameters<typeof t>[0]))
      }
    }
  }

  function handleClear() {
    setError(null)
    onChange('')
  }

  return (
    <div className="flex flex-col gap-1">
      <Label>{t('identity.portraitUrl')}</Label>
      <div className="flex gap-2 items-center">
        <Button type="button" variant="outline" size="sm" onClick={handleClick}>
          {t('identity.portraitUpload')}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            {t('identity.portraitClear')}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!error && (
        <p className="text-xs text-muted-foreground">{t('identity.portraitSizeNote')}</p>
      )}
    </div>
  )
}
