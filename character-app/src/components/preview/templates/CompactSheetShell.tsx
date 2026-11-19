import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { paginateNotes } from './paginateNotes'
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
  const { source: character, attributes, skills, edges, hindrances, combat, modifierBreakdown, powers } = resolvedCharacter
  const race = character.raceId ? world?.races.find(candidate => candidate.id === character.raceId) ?? null : null

  const { t } = useTranslation('preview')
  const writingArea = useRef<HTMLDivElement>(null)
  const continuationArea = useRef<HTMLDivElement>(null)
  const source = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<string[]>([])

  useLayoutEffect(() => {
    const first = writingArea.current
    const continuation = continuationArea.current
    const markdown = source.current
    const measurement = probe.current
    if (!first || !continuation || !markdown || !measurement) return

    function update() {
      if (!first || !continuation || !markdown || !measurement) return
      if (!first.offsetWidth || !continuation.offsetHeight) return
      const next = paginateNotes(markdown, measurement, first.offsetHeight, continuation.offsetHeight)
      setPages(current => current.length === next.length && current.every((page, index) => page === next[index])
        ? current
        : next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(first)
    observer.observe(continuation)
    observer.observe(markdown)
    document.fonts.addEventListener('loadingdone', update)
    return () => {
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', update)
    }
  }, [character.notes])

  function continuationPage(html?: string, index?: number) {
    return (
      <main className="sheet sheet--compact" key={index}>
        <div className="content">
          <section className="section compact-notes-ammo">
            <div className="section-title">{t('sections.notesContinuation')}</div>
            <div className="compact-notes-ammo-body">
              <div ref={html === undefined ? continuationArea : undefined} className="compact-notes-writing-area">
                {html !== undefined && <div className="compact-notes-text" dangerouslySetInnerHTML={{ __html: html }} />}
                {html === undefined && (
                  <>
                    <div ref={source} className="compact-notes-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{character.notes}</ReactMarkdown>
                    </div>
                    <div ref={probe} className="compact-notes-text" />
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <div className="compact-sheet-document" data-sheet-document>
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
              {layout.edges === 'left' && <SheetEdges edges={edges} variant="compact" />}
              {layout.hindrances === 'left' && <SheetHindrances hindrances={hindrances} variant="compact" />}
              {layout.gear === 'left' && <SheetGear character={character} variant="compact" />}
              {layout.specialRules === 'left' && <SheetSpecialRules character={character} variant="compact" />}
              {layout.powers === 'left' && <SheetPowers powers={powers} />}
            </div>
            <div className="column">
              {layout.weapons === 'right' && <SheetWeapons character={character} />}
              {layout.edges === 'right' && <SheetEdges edges={edges} variant="compact" />}
              {layout.hindrances === 'right' && <SheetHindrances hindrances={hindrances} variant="compact" />}
              {layout.gear === 'right' && <SheetGear character={character} variant="compact" />}
              {layout.specialRules === 'right' && <SheetSpecialRules character={character} variant="compact" />}
              {layout.powers === 'right' && <SheetPowers powers={powers} />}
              <SheetRacialAbilities race={race} world={world} />
            </div>
          </section>
          <SheetNotesAmmo character={character} writingAreaRef={writingArea}>
            {pages[0] && <div className="compact-notes-text" dangerouslySetInnerHTML={{ __html: pages[0] }} />}
          </SheetNotesAmmo>
        </div>
      </main>
      {pages.slice(1).map((html, index) => continuationPage(html, index))}
      <div className="compact-notes-measurement" aria-hidden="true" data-notes-measurement>
        {continuationPage()}
      </div>
    </div>
  )
}
