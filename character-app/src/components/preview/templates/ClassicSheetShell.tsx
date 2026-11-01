import { SheetHeader } from '../SheetHeader'
import { SheetQuickStats } from '../SheetQuickStats'
import { SheetAttributesSkills } from '../SheetAttributesSkills'
import { SheetEdges } from '../SheetEdges'
import { SheetHindrances } from '../SheetHindrances'
import { SheetWeapons } from '../SheetWeapons'
import { SheetGear } from '../SheetGear'
import { SheetSpecialRules } from '../SheetSpecialRules'
import { SheetPowers } from '../SheetPowers'
import { SheetNotes } from '../SheetNotes'
import { SheetRacialAbilities } from '../SheetRacialAbilities'
import type { SheetTemplateShellProps } from './sheetTemplateTypes'

export function ClassicSheetShell({ resolvedCharacter, layout, world, mobile = false }: SheetTemplateShellProps) {
  const { source: character, attributes, skills, edges, hindrances, combat, modifierBreakdown } = resolvedCharacter
  const race = character.raceId ? world?.races.find(candidate => candidate.id === character.raceId) ?? null : null

  return (
    <main className={mobile ? 'sheet sheet--mobile' : 'sheet'}>
      <div className="content">
        <SheetHeader character={character} />
        <SheetQuickStats combat={combat} modifierBreakdown={modifierBreakdown} />
        <section className="columns">
          <div className="column">
            <SheetAttributesSkills skills={skills} attributes={attributes} />
            {layout.weapons === 'left' && <SheetWeapons character={character} />}
            {layout.edges === 'left' && <SheetEdges edges={edges} />}
            {layout.hindrances === 'left' && <SheetHindrances hindrances={hindrances} />}
            {layout.gear === 'left' && <SheetGear character={character} />}
            {layout.specialRules === 'left' && <SheetSpecialRules character={character} />}
            {layout.powers === 'left' && <SheetPowers character={character} />}
          </div>
          <div className="column">
            {layout.weapons === 'right' && <SheetWeapons character={character} />}
            {layout.edges === 'right' && <SheetEdges edges={edges} />}
            {layout.hindrances === 'right' && <SheetHindrances hindrances={hindrances} />}
            {layout.gear === 'right' && <SheetGear character={character} />}
            {layout.specialRules === 'right' && <SheetSpecialRules character={character} />}
            {layout.powers === 'right' && <SheetPowers character={character} />}
            <SheetRacialAbilities race={race} world={world} />
          </div>
        </section>
        <SheetNotes character={character} combat={combat} />
      </div>
    </main>
  )
}
