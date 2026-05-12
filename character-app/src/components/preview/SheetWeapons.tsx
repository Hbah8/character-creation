import { useTranslation } from 'react-i18next'
import type { Character } from '@/types/character'

interface Props {
  character: Character
}

export function SheetWeapons({ character }: Props) {
  const { t } = useTranslation('preview')
  if (character.weapons.length === 0) return null
  return (
    <section className="section">
      <div className="section-title">{t('sections.weapons')}</div>
      <table className="table weapon-table">
        <thead>
          <tr>
            <th>{t('weapons.columnWeapon')}</th>
            <th>{t('weapons.columnRange')}</th>
            <th>{t('weapons.columnDamage')}</th>
            <th>{t('weapons.columnAp')}</th>
            <th>{t('weapons.columnRof')}</th>
            <th>{t('weapons.columnMag')}</th>
          </tr>
        </thead>
        <tbody>
          {character.weapons.map(w => (
            <tr key={w.id}>
              <td>{w.name}</td>
              <td>{w.range}</td>
              <td>{w.damage}</td>
              <td>{w.ap}</td>
              <td>{w.rof}</td>
              <td>{w.magazine}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
