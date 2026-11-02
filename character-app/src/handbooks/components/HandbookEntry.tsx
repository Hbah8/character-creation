import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { HandbookEntryDetail } from '@/handbooks/components/HandbookEntryDetail'
import { getEdgeRequirementRank } from '@/handbooks/utils/edgeRequirements'
import { localizeStandardWeapon } from '@/handbooks/utils/localizeStandardWeapon'
import { formatWeaponRange } from '@/handbooks/utils/weaponRange'
import { WEAPON_CATEGORY_LABEL_KEYS } from '@/handbooks/utils/handbookTranslationKeys'
import type { AnyHandbookEntry } from '@/handbooks/types'
import { isWeaponCategory } from '@/types/handbook'
import {
  isEdge,
  isGear,
  isHindrance,
  isMount,
  isPower,
  isRacialAbility,
  isSkill,
  isWeapon,
} from '@/handbooks/types'

interface Props {
  entry: AnyHandbookEntry
  skillReferences?: readonly { id: string; name: string }[]
  source?: 'system' | 'world'
  activeWorldName?: string
  onOverride?: () => void
  onEditOverride?: () => void
  onDeleteOverride?: () => void
}

function EntryTags({ entry }: Props) {
  const { t } = useTranslation('handbooks')

  if (isEdge(entry)) {
    const rank = getEdgeRequirementRank(entry.requirements)
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">{t(`enums.edgeType.${entry.type}`)}</Badge>
        {rank && (
          <Badge variant="secondary">{t(`enums.rank.${rank}`)}</Badge>
        )}
      </div>
    )
  }

  if (isHindrance(entry)) {
    return (
      <Badge variant={entry.type === 'Major' ? 'destructive' : 'secondary'}>
        {t(`enums.hindranceType.${entry.type}`)}
      </Badge>
    )
  }

  if (isSkill(entry)) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">{t(`modifiers.${entry.linkedAttribute}`)}</Badge>
        {entry.isCore && <Badge variant="secondary">{t('fields.coreSkill')}</Badge>}
      </div>
    )
  }

  if (isWeapon(entry)) {
    const range = formatWeaponRange(entry.range, {
      melee: t('fields.rangeTypes.melee'),
      reach: t('fields.reach'),
      extreme: t('fields.extremeRange'),
    })
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">
          {isWeaponCategory(entry.category)
            ? t(WEAPON_CATEGORY_LABEL_KEYS[entry.category])
            : t('fields.unknownWeaponCategory')}
        </Badge>
        <Badge variant="secondary">{t('fields.damage')}: {entry.damage}</Badge>
        {range && (
          <Badge variant="secondary">{t('fields.range')}: {range}</Badge>
        )}
        {entry.areaTemplate && (
          <Badge variant="secondary">
            {t('fields.areaTemplate')}: {t(`fields.areaTemplates.${entry.areaTemplate}`)}
          </Badge>
        )}
      </div>
    )
  }

  if (isGear(entry)) {
    return <Badge variant="outline">{t(`enums.gearCategory.${entry.category}`)}</Badge>
  }

  if (isPower(entry)) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary">{t('fields.ppCost')}: {entry.ppCost}</Badge>
        {entry.arcaneBackground.slice(0, 3).map(ab => (
          <Badge key={ab} variant="outline">{t(`enums.arcaneBackground.${ab}`)}</Badge>
        ))}
        {entry.arcaneBackground.length > 3 && (
          <Badge variant="outline">+{entry.arcaneBackground.length - 3}</Badge>
        )}
      </div>
    )
  }

  if (isMount(entry)) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">{t(`enums.mountCategory.${entry.category}`)}</Badge>
        <Badge variant="secondary">{t('fields.toughness')}: {entry.toughness}</Badge>
      </div>
    )
  }

  if (isRacialAbility(entry)) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant={entry.type === 'positive' ? 'default' : 'destructive'}>
          {t(`enums.racialAbilityType.${entry.type}`)}
        </Badge>
        {entry.points !== undefined && (
          <Badge variant="secondary">{t('fields.points')}: {entry.points}</Badge>
        )}
      </div>
    )
  }

  return null
}

export function HandbookEntry({ entry, skillReferences, source, activeWorldName, onOverride, onEditOverride, onDeleteOverride }: Props) {
  const { t } = useTranslation('handbooks')
  const isWorld = source === 'world'
  const badgeLabel = isWorld && activeWorldName ? activeWorldName : t('badge.swade')
  const displayEntry = isWeapon(entry)
    ? localizeStandardWeapon(entry, source, key => t(key))
    : entry

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Card
          size="sm"
          className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground text-left w-full"
          role="button"
          tabIndex={0}
        >
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{displayEntry.name}</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {badgeLabel}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EntryTags entry={entry} />
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {displayEntry.description}
            </p>
          </CardContent>
        </Card>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 w-full sm:max-w-md">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2 pr-8">
            <SheetTitle className="text-base">{displayEntry.name}</SheetTitle>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {badgeLabel}
            </Badge>
          </div>
          <SheetDescription className="text-sm leading-relaxed">
            {displayEntry.description}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <HandbookEntryDetail entry={entry} skillReferences={skillReferences} />
        </div>
        {activeWorldName && (
          <div className="p-4 border-t flex flex-col gap-2">
            {!isWorld ? (
              <Button size="sm" variant="outline" className="h-auto min-h-7 w-full justify-start whitespace-normal py-1 text-left" onClick={onOverride}>
                {t('actions.override')}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="h-auto min-h-7 w-full justify-start whitespace-normal py-1 text-left" onClick={onEditOverride}>
                  {t('actions.editOverride')}
                </Button>
                <Button size="sm" variant="destructive" className="h-auto min-h-7 w-full justify-start whitespace-normal py-1 text-left" onClick={onDeleteOverride}>
                  {t('actions.deleteOverride')}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
