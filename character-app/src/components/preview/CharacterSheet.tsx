import { useRef, useEffect, useState } from 'react'
import type { Character } from '@/types/character'
import { DEFAULT_LAYOUT } from '@/types/character'
import '@/styles/sheet.css'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { SheetHeader } from './SheetHeader'
import { SheetQuickStats } from './SheetQuickStats'
import { SheetAttributesSkills } from './SheetAttributesSkills'
import { SheetEdges } from './SheetEdges'
import { SheetHindrances } from './SheetHindrances'
import { SheetWeapons } from './SheetWeapons'
import { SheetGear } from './SheetGear'
import { SheetSpecialRules } from './SheetSpecialRules'
import { SheetPowers } from './SheetPowers'
import { SheetNotes } from './SheetNotes'
import { SheetRacialAbilities } from './SheetRacialAbilities'

// A4 at 96dpi: 210mm = ~794px
const SHEET_WIDTH_PX = 794

export type ScaleMode = 'fit-width' | 'full-page' | '100%'

interface Props {
  character: Character
  /** Scale to fit both width and height of the container (mobile preview). Default: scale by width only. */
  fitToContainer?: boolean
  /** Controls how the desktop preview scales. Default: 'fit-width'. Ignored when fitToContainer=true. */
  scaleMode?: ScaleMode
}

export function CharacterSheet({ character, fitToContainer = false, scaleMode = 'fit-width' }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [sheetHeight, setSheetHeight] = useState(0)

  const { entries } = useWorldLibrary()
  const world = entries.find(e => e.id === character.worldId)?.world ?? null
  const race = character.raceId ? (world?.races.find(r => r.id === character.raceId) ?? null) : null

  // fitToContainer mode: measure actual viewport width via visualViewport to avoid DOM layout
  // jitter (e.g. iOS Safari address bar animation when tapping buttons) from triggering rescales.
  // Non-fitToContainer mode: use ResizeObserver on the wrapper element as before.
  useEffect(() => {
    if (fitToContainer) {
      const update = () => {
        const vv = window.visualViewport
        const w = vv ? vv.width : window.innerWidth
        const h = vv ? vv.height : window.innerHeight
        setContainerSize({ width: w, height: h })
      }
      update()
      const vv = window.visualViewport
      const target: EventTarget = vv ?? window
      target.addEventListener('resize', update)
      return () => target.removeEventListener('resize', update)
    }

    const el = wrapperRef.current
    if (!el) return
    let rafId: number
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
      })
    })
    observer.observe(el)
    return () => { observer.disconnect(); cancelAnimationFrame(rafId) }
  }, [fitToContainer])

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setSheetHeight(entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const widthScale = containerSize.width > 0 ? containerSize.width / SHEET_WIDTH_PX : 1
  const heightScale = containerSize.height > 0 && sheetHeight > 0 ? containerSize.height / sheetHeight : 1
  // Never upscale beyond 100% — preview should match PDF size, only scale down for narrow containers
  const scale = scaleMode === '100%'
    ? 1
    : scaleMode === 'full-page'
    ? Math.min(widthScale, heightScale, 1)
    : Math.min(widthScale, 1)

  // Compensate for blank layout space left by transform: scale() — only needed in scrollable mode
  const bottomCompensation = !fitToContainer && sheetHeight > 0 ? -sheetHeight * (1 - scale) : 0

  // fitToContainer: use CSS zoom so the sheet is in document flow at the correct size.
  // zoom affects layout (unlike transform: scale), so the container tracks the actual
  // rendered size — no overflow, no clipping, no absolute positioning needed.
  if (fitToContainer) {
    const layout = character.layout ?? DEFAULT_LAYOUT
    return (
      <div
        ref={wrapperRef}
        className="sheet-outer-wrapper"
        style={{ width: '100%' }}
      >
        <div
          ref={sheetRef}
          className="sheet-scale-wrapper"
          style={{
            zoom: scale,
            width: SHEET_WIDTH_PX,
            margin: '0 auto',
          }}
        >
          <main className="sheet sheet--mobile">
            <div className="content">
              <SheetHeader character={character} />
              <SheetQuickStats character={character} />
              <section className="columns">
                <div className="column">
                  <SheetAttributesSkills character={character} />
                  {layout.weapons === 'left' && <SheetWeapons character={character} />}
                  {layout.edges === 'left' && <SheetEdges character={character} />}
                  {layout.hindrances === 'left' && <SheetHindrances character={character} />}
                  {layout.gear === 'left' && <SheetGear character={character} />}
                  {layout.specialRules === 'left' && <SheetSpecialRules character={character} />}
                  {layout.powers === 'left' && <SheetPowers character={character} />}
                </div>
                <div className="column">
                  {layout.weapons === 'right' && <SheetWeapons character={character} />}
                  {layout.edges === 'right' && <SheetEdges character={character} />}
                  {layout.hindrances === 'right' && <SheetHindrances character={character} />}
                  {layout.gear === 'right' && <SheetGear character={character} />}
                  {layout.specialRules === 'right' && <SheetSpecialRules character={character} />}
                  {layout.powers === 'right' && <SheetPowers character={character} />}
                  <SheetRacialAbilities race={race} world={world} />
                </div>
              </section>
              <SheetNotes character={character} />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className="sheet-outer-wrapper"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div
        ref={sheetRef}
        className="sheet-scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: SHEET_WIDTH_PX,
          flexShrink: 0,
          marginBottom: bottomCompensation,
        }}
      >
        <main className="sheet">
          <div className="content">
            <SheetHeader character={character} />
            <SheetQuickStats character={character} />
            <section className="columns">
              {(() => {
                const layout = character.layout ?? DEFAULT_LAYOUT
                return (
                  <>
                    <div className="column">
                      <SheetAttributesSkills character={character} />
                      {layout.weapons === 'left' && <SheetWeapons character={character} />}
                      {layout.edges === 'left' && <SheetEdges character={character} />}
                      {layout.hindrances === 'left' && <SheetHindrances character={character} />}
                      {layout.gear === 'left' && <SheetGear character={character} />}
                      {layout.specialRules === 'left' && <SheetSpecialRules character={character} />}
                      {layout.powers === 'left' && <SheetPowers character={character} />}
                    </div>
                    <div className="column">
                      {layout.weapons === 'right' && <SheetWeapons character={character} />}
                      {layout.edges === 'right' && <SheetEdges character={character} />}
                      {layout.hindrances === 'right' && <SheetHindrances character={character} />}
                      {layout.gear === 'right' && <SheetGear character={character} />}
                      {layout.specialRules === 'right' && <SheetSpecialRules character={character} />}
                      {layout.powers === 'right' && <SheetPowers character={character} />}
                      <SheetRacialAbilities race={race} world={world} />
                    </div>
                  </>
                )
              })()}
            </section>
            <SheetNotes character={character} />
          </div>
        </main>
      </div>
    </div>
  )
}
