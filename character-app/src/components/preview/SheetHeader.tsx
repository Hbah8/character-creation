import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetHeader({ character }: Props) {
  const { t } = useTranslation('preview')
  return (
    <header className="header">
      <div className="titlebar">
          <div className="main-title">{character.sheetTitle || t('header.defaultSheetTitle')}</div>
        <div className="file-no">{t('header.fileNoPrefix')}{character.fileNo || '—'}</div>
      </div>
      <div className="header-body">
        <div className="id-block">
          <div className="id-callsign">{character.callsign || '—'}</div>
          <div className="id-name">{character.name || '—'}</div>
          <div className="id-rank-role">{character.rank || '—'} · {character.role || '—'}</div>
        </div>
        <div className="portrait">
          {character.portraitUrl ? (
            <img src={character.portraitUrl} alt={t('header.portraitAlt')} />
          ) : (
            <div className="portrait-placeholder">{t('header.portraitPlaceholder')}</div>
          )}
        </div>
      </div>
    </header>
  )
}
