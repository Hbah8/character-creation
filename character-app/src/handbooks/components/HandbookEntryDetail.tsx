import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import type { AnyHandbookEntry } from '@/handbooks/types'
import type { EdgeRequirementCondition, HandbookModifier } from '@/types/handbook'
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

const systemEdgeNames = new Map(SWADE_EDGES.map(edge => [edge.id, edge.name]))
const systemHindranceNames = new Map(SWADE_HINDRANCES.map(hindrance => [hindrance.id, hindrance.name]))

function ModifierSummary({ modifiers }: { modifiers: HandbookModifier[] | undefined }) {
  const { t } = useTranslation('handbooks')

  function targetLabel(modifier: HandbookModifier): string {
    if (modifier.type === 'attribute-die-step') {
      switch (modifier.attribute) {
        case 'agility': return t('modifiers.agility')
        case 'strength': return t('modifiers.strength')
        case 'smarts': return t('modifiers.smarts')
        case 'spirit': return t('modifiers.spirit')
        case 'vigor': return t('modifiers.vigor')
        default: return modifier.attribute
      }
    }
    if (modifier.stat === 'pace' || modifier.stat === 'toughness') {
      return t(`fields.${modifier.stat}`)
    }
    return t(`modifiers.${modifier.stat}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('modifiers.title')}
      </p>
      {modifiers && modifiers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {modifiers.map((modifier, index) => (
            <Badge key={`${modifier.type}-${index}`} variant="secondary">
              {targetLabel(modifier)} {modifier.amount > 0 ? `+${modifier.amount}` : modifier.amount}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('modifiers.none')}</p>
      )}
    </div>
  )
}

export function HandbookEntryDetail({ entry }: Props) {
  const { t } = useTranslation('handbooks')

  const formatRequirement = (condition: EdgeRequirementCondition): string => {
    switch (condition.type) {
      case 'rank': {
        const labels = {
          Novice: t('enums.rank.Novice'),
          Seasoned: t('enums.rank.Seasoned'),
          Veteran: t('enums.rank.Veteran'),
          Heroic: t('enums.rank.Heroic'),
          Legendary: t('enums.rank.Legendary'),
        }
        return labels[condition.minimum]
      }
      case 'attribute': {
        const labels = {
          agility: t('modifiers.agility'),
          smarts: t('modifiers.smarts'),
          spirit: t('modifiers.spirit'),
          strength: t('modifiers.strength'),
          vigor: t('modifiers.vigor'),
        }
        return `${labels[condition.attribute]} ${condition.minimum}`
      }
      case 'skill': {
        const labels: Record<string, string> = {
          athletics: t('requirements.skills.athletics'),
          faith: t('requirements.skills.faith'),
          fighting: t('requirements.skills.fighting'),
          notice: t('requirements.skills.notice'),
          psionics: t('requirements.skills.psionics'),
          repair: t('requirements.skills.repair'),
          research: t('requirements.skills.research'),
          shooting: t('requirements.skills.shooting'),
          spellcasting: t('requirements.skills.spellcasting'),
          stealth: t('requirements.skills.stealth'),
          survival: t('requirements.skills.survival'),
          taunt: t('requirements.skills.taunt'),
          talent: t('requirements.skills.talent'),
          thievery: t('requirements.skills.thievery'),
          warfare: t('requirements.skills.warfare'),
          'weird-science': t('requirements.skills.weirdScience'),
        }
        return `${labels[condition.skill] ?? condition.skill} ${condition.minimum}`
      }
      case 'edge': {
        const edgeName = systemEdgeNames.get(condition.edgeId) ?? condition.edgeId
        if (!condition.arcaneBackground) return edgeName
        const backgrounds = {
          any: t('requirements.arcaneBackground.any'),
          weirdScience: t('requirements.arcaneBackground.weirdScience'),
          magic: t('requirements.arcaneBackground.magic'),
          psionics: t('requirements.arcaneBackground.psionics'),
          gifted: t('requirements.arcaneBackground.gifted'),
          miracles: t('requirements.arcaneBackground.miracles'),
        }
        return `${edgeName} (${backgrounds[condition.arcaneBackground]})`
      }
      case 'hindrance':
        return systemHindranceNames.get(condition.hindranceId) ?? condition.hindranceId
      case 'race':
        return condition.raceId
      case 'wildCard':
        return t('requirements.wildCard')
      case 'text':
        return condition.text
    }
  }

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
              {req.allOf.map((condition, index) => (
                <span key={index}>
                  {'anyOf' in condition
                    ? condition.anyOf.map(formatRequirement).join(` ${t('requirements.or')} `)
                    : formatRequirement(condition)}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 items-center text-sm">
          <span className="text-muted-foreground">{t('fields.type')}:</span>
          <Badge variant="outline">{t(`enums.edgeType.${entry.type}`)}</Badge>
          {entry.wildCardOnly && (
            <Badge variant="secondary">{t('fields.wildCardOnly')}</Badge>
          )}
        </div>
        <ModifierSummary modifiers={entry.modifiers} />
      </div>
    )
  }

  if (isHindrance(entry)) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center text-sm">
          <span className="text-muted-foreground">{t('fields.type')}:</span>
          <Badge variant={entry.type === 'Major' ? 'destructive' : 'secondary'}>{t(`enums.hindranceType.${entry.type}`)}</Badge>
        </div>
        <ModifierSummary modifiers={entry.modifiers} />
      </div>
    )
  }

  if (isWeapon(entry)) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">{t('fields.category')}</span>
        <span>{t(`enums.weaponCategory.${entry.category}`)}</span>
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
        <span>{t(`enums.gearCategory.${entry.category}`)}</span>
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
              <Badge key={ab} variant="outline">{t(`enums.arcaneBackground.${ab}`)}</Badge>
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
        <span>{t(`enums.mountCategory.${entry.category}`)}</span>
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
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t('fields.type')}</span>
          <span>{t(`enums.racialAbilityType.${entry.type}`)}</span>
          {entry.points !== undefined && (
            <>
              <span className="text-muted-foreground">{t('fields.points')}</span>
              <span>{entry.points > 0 ? `+${entry.points}` : entry.points}</span>
            </>
          )}
        </div>
        <ModifierSummary modifiers={entry.modifiers} />
      </div>
    )
  }

  return null
}
