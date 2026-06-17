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
            <th style={{ width: '40%' }}>Название</th>
            <th className="text-center" style={{ width: '8%' }}>{t('powers.ppCol')}</th>
            <th style={{ width: '22%' }}>{t('powers.rangeCol')}</th>
            <th style={{ width: '20%' }}>{t('powers.durationCol')}</th>
          </tr>
        </thead>
        <tbody>
          {character.powers.map(power => (
            <>
              <tr key={power.id}>
                <td className="powers-name-cell">
                  <strong>{power.name || '—'}</strong>
                </td>
                <td className="text-center">{power.ppCost || '—'}</td>
                <td>{power.range || '—'}</td>
                <td>{power.duration || '—'}</td>
              </tr>
              {(power.description || power.modifiers.length > 0) && (
                <tr key={`${power.id}-detail`} className="powers-detail-row">
                  <td colSpan={4} className="powers-detail-cell">
                    {power.description && (
                      <span className="powers-desc">{power.description}</span>
                    )}
                    {power.modifiers.length > 0 && (
                      <span className="powers-modifiers">
                        {power.description ? ' ' : ''}
                        {t('powers.modifiers')}{' '}
                        {power.modifiers.map((m, i) => (
                          <span key={m.id}>
                            {m.name}{m.ppCost ? ` ${m.ppCost}` : ''}{i < power.modifiers.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </section>
  )
}
