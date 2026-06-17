import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetPowers({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.powers.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('powers.title')}</div>
      <table className="table powers-table">
        <thead>
          <tr>
            <th>{t('powers.nameCol')}</th>
            <th className="powers-center-col">{t('powers.ppCol')}</th>
            <th>{t('powers.rangeCol')}</th>
            <th>{t('powers.durationCol')}</th>
          </tr>
        </thead>
        <tbody>
          {character.powers.map(power => (
            <Fragment key={power.id}>
              {/* Main stats row */}
              <tr>
                <td className="powers-name-cell"><strong>{power.name || '—'}</strong></td>
                <td className="powers-center-col">{power.ppCost || '—'}</td>
                <td>{power.range || '—'}</td>
                <td>{power.duration || '—'}</td>
              </tr>
              {/* Description — own row, pre-wrap to preserve line breaks */}
              {power.description && (
                <tr className="powers-detail-row">
                  <td colSpan={4} className="powers-desc-cell">{power.description}</td>
                </tr>
              )}
              {/* Modifiers — own row, each modifier on its own line */}
              {power.modifiers.length > 0 && (
                <tr className="powers-detail-row">
                  <td colSpan={4} className="powers-modifiers-cell">
                    {power.modifiers.map(m => (
                      <span key={m.id} className="powers-modifier-line">
                        ▸{m.ppCost && <strong className="powers-modifier-cost"> {m.ppCost}</strong>}{m.ppCost && m.name ? ' ' : ''}{m.name}
                      </span>
                    ))}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  )
}
