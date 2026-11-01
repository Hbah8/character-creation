import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Character } from '@/types/character'
import { getMagazineCapacity } from './ammunition'

interface Props {
  character: Character
}

export function SheetNotesAmmo({ character }: Props) {
  const { t } = useTranslation('preview')
  const ammunition = character.weapons.flatMap(weapon => {
    const capacity = getMagazineCapacity(weapon.magazine)
    return capacity === null ? [] : [{ weapon, capacity }]
  })

  return (
    <section className="section compact-notes-ammo">
      <div className="section-title">{t('sections.notesAndAmmo')}</div>
      <div className="compact-notes-ammo-body">
        {ammunition.length > 0 && (
          <div className="compact-ammunition">
            {ammunition.map(({ weapon, capacity }) => (
              <div className="compact-ammunition-row" key={weapon.id}>
                <span className="compact-ammunition-label">{weapon.name} · {capacity}</span>
                <span
                  className="compact-ammunition-track"
                  role="img"
                  aria-label={t('notes.ammunitionCapacity', { name: weapon.name, capacity })}
                  data-ammo-capacity={capacity}
                  data-ammo-width={`${capacity * 3.2}mm`}
                  style={{
                    '--ammo-capacity': capacity,
                    '--ammo-width': `${capacity * 3.2}mm`,
                  } as CSSProperties}
                />
              </div>
            ))}
          </div>
        )}
        {character.notes && (
          <div className="compact-notes-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{character.notes}</ReactMarkdown>
          </div>
        )}
        <div className="compact-notes-lines" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
        </div>
      </div>
    </section>
  )
}
