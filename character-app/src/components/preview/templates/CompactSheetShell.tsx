import { SheetHeader } from '../SheetHeader'
import { SheetQuickStats } from '../SheetQuickStats'
import { SheetAttributesSkills } from '../SheetAttributesSkills'
import { SheetEdges } from '../SheetEdges'
import { SheetHindrances } from '../SheetHindrances'
import { SheetWeapons } from '../SheetWeapons'
import { SheetGear } from '../SheetGear'
import { SheetSpecialRules } from '../SheetSpecialRules'
import { SheetPowers } from '../SheetPowers'
import { SheetRacialAbilities } from '../SheetRacialAbilities'
import { SheetMarks } from './SheetMarks'
import { SheetNotesAmmo } from './SheetNotesAmmo'
import type { SheetTemplateShellProps } from './sheetTemplateTypes'
import '@/styles/sheet-compact.css'

export function CompactSheetShell({ resolvedCharacter, layout, world }: SheetTemplateShellProps) {
  const { source: character, attributes, skills, edges, hindrances, combat, modifierBreakdown } = resolvedCharacter
  const race = character.raceId ? world?.races.find(candidate => candidate.id === character.raceId) ?? null : null

  return (
    <main className="sheet sheet--compact">
      <div className="content">
        <div className="compact-top">
          <SheetHeader character={character} />
          <SheetQuickStats combat={combat} modifierBreakdown={modifierBreakdown} variant="compact" />
        </div>
        <SheetAttributesSkills skills={skills} attributes={attributes} variant="compact" />
        <SheetMarks combat={combat} />
        <section className="columns">
          <div className="column">
            {layout.weapons === 'left' && <SheetWeapons character={character} />}
            {layout.edges === 'left' && <SheetEdges edges={edges} />}
            {layout.hindrances === 'left' && <SheetHindrances hindrances={hindrances} />}
            {layout.gear === 'left' && <SheetGear character={character} variant="compact" />}
            {layout.specialRules === 'left' && <SheetSpecialRules character={character} variant="compact" />}
            {layout.powers === 'left' && <SheetPowers character={character} />}
          </div>
          <div className="column">
            {layout.weapons === 'right' && <SheetWeapons character={character} />}
            {layout.edges === 'right' && <SheetEdges edges={edges} />}
            {layout.hindrances === 'right' && <SheetHindrances hindrances={hindrances} />}
            {layout.gear === 'right' && <SheetGear character={character} variant="compact" />}
            {layout.specialRules === 'right' && <SheetSpecialRules character={character} variant="compact" />}
            {layout.powers === 'right' && <SheetPowers character={character} />}
            <SheetRacialAbilities race={race} world={world} />
          </div>
        </section>
        <SheetNotesAmmo character={character} />
      </div>
    </main>
  )
}
