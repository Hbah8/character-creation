import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { AnyHandbookEntry } from '@/handbooks/types'
import {
  isEdge,
  isGear,
  isHindrance,
  isMount,
  isPower,
  isRacialAbility,
  isWeapon,
} from '@/handbooks/types'

interface Props {
  entry: AnyHandbookEntry
}

export function HandbookEntryDetail({ entry }: Props) {
  const { t } = useTranslation('handbooks')

  if (isEdge(entry)) {
    const req = entry.requirements
    return (
      <div className="flex flex-col gap-3">
        {req && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('entry.requirements')}
            </p>
            <div className="flex flex-col gap-1 text-sm">
              {req.rank && (
                <span>
                  <span className="text-muted-foreground">{t('entry.rank')}:</span> {req.rank}
                </span>
              )}
              {req.attributes && Object.entries(req.attributes).map(([attr, die]) => (
                <span key={attr}>
                  <span className="text-muted-foreground">{attr}:</span> {die}
                </span>
              ))}
              {req.skills && Object.entries(req.skills).map(([skill, die]) => (
                <span key={skill}>
                  <span className="text-muted-foreground">{skill}:</span> {die}
                </span>
              ))}
              {req.edges && req.edges.length > 0 && (
                <span>
                  <span className="text-muted-foreground">{t('entry.edges')}:</span> {req.edges.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 items-center text-sm">
          <span className="text-muted-foreground">{t('fields.type')}:</span>
          <Badge variant="outline">{entry.type}</Badge>
        </div>
      </div>
    )
  }

  if (isHindrance(entry)) {
    return (
      <div className="flex gap-2 items-center text-sm">
        <span className="text-muted-foreground">{t('fields.type')}:</span>
        <Badge variant={entry.type === 'Major' ? 'destructive' : 'secondary'}>{entry.type}</Badge>
      </div>
    )
  }

  if (isWeapon(entry)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">{t('fields.category')}</span>
        <span>{entry.category}</span>
        <span className="text-muted-foreground">{t('fields.damage')}</span>
        <span>{entry.damage}</span>
        {entry.range && (
          <>
            <span className="text-muted-foreground">{t('fields.range')}</span>
            <span>{entry.range}</span>
          </>
        )}
        {entry.ap !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.ap')}</span>
            <span>{entry.ap}</span>
          </>
        )}
        {entry.rof !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.rof')}</span>
            <span>{entry.rof}</span>
          </>
        )}
        {entry.weight !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.weight')}</span>
            <span>{entry.weight} lb</span>
          </>
        )}
        {entry.cost !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.cost')}</span>
            <span>${entry.cost}</span>
          </>
        )}
      </div>
    )
  }

  if (isGear(entry)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">{t('fields.category')}</span>
        <span>{entry.category}</span>
        {entry.weight !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.weight')}</span>
            <span>{entry.weight} lb</span>
          </>
        )}
        {entry.cost !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.cost')}</span>
            <span>${entry.cost}</span>
          </>
        )}
      </div>
    )
  }

  if (isPower(entry)) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t('fields.ppCost')}</span>
          <span>{entry.ppCost}</span>
          <span className="text-muted-foreground">{t('fields.range')}</span>
          <span>{entry.range}</span>
          <span className="text-muted-foreground">{t('fields.duration')}</span>
          <span>{entry.duration}</span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('fields.arcaneBackground')}
          </p>
          <div className="flex flex-wrap gap-1">
            {entry.arcaneBackground.map(ab => (
              <Badge key={ab} variant="outline">{ab}</Badge>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isMount(entry)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">{t('fields.category')}</span>
        <span>{entry.category}</span>
        <span className="text-muted-foreground">{t('fields.toughness')}</span>
        <span>{entry.toughness}</span>
        {entry.pace !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.pace')}</span>
            <span>{entry.pace}"</span>
          </>
        )}
        {entry.handling !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.handling')}</span>
            <span>{entry.handling}</span>
          </>
        )}
        {entry.cost !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.cost')}</span>
            <span>${entry.cost}</span>
          </>
        )}
      </div>
    )
  }

  if (isRacialAbility(entry)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">{t('fields.type')}</span>
        <span>{entry.type}</span>
        {entry.points !== undefined && (
          <>
            <span className="text-muted-foreground">{t('fields.points')}</span>
            <span>{entry.points > 0 ? `+${entry.points}` : entry.points}</span>
          </>
        )}
      </div>
    )
  }

  return null
}
