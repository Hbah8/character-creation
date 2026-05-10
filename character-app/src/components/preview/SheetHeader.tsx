import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetHeader({ character }: Props) {
  return (
    <header className="header">
      <div className="titlebar">
          <div className="main-title">{character.sheetTitle || 'Лист персонажа'}</div>
        <div className="file-no">Файл: {character.fileNo || '—'}</div>
      </div>
      <div className="header-body">
        <div className="id-block">
          <div className="id-callsign">{character.callsign || '—'}</div>
          <div className="id-name">{character.name || '—'}</div>
          <div className="id-rank-role">{character.rank || '—'} · {character.role || '—'}</div>
        </div>
        <div className="portrait">
          {character.portraitUrl ? (
            <img src={character.portraitUrl} alt="Портрет оператора" />
          ) : (
            <div className="portrait-placeholder">Портрет<br />оператора</div>
          )}
        </div>
      </div>
    </header>
  )
}
