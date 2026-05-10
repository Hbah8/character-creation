import { useRef, useEffect, useState } from 'react'
import type { Character } from '@/types/character'
import '@/styles/sheet.css'
import { SheetHeader } from './SheetHeader'
import { SheetQuickStats } from './SheetQuickStats'
import { SheetAttributesSkills } from './SheetAttributesSkills'
import { SheetEdges } from './SheetEdges'
import { SheetHindrances } from './SheetHindrances'
import { SheetWeapons } from './SheetWeapons'
import { SheetGear } from './SheetGear'
import { SheetSpecialRules } from './SheetSpecialRules'
import { SheetNotes } from './SheetNotes'

// A4 at 96dpi: 210mm = ~794px
const SHEET_WIDTH_PX = 794

interface Props {
  character: Character
}

export function CharacterSheet({ character }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [sheetHeight, setSheetHeight] = useState(0)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect
      setScale(width / SHEET_WIDTH_PX)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setSheetHeight(entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Compensate for the blank layout space that transform: scale() leaves below
  const bottomCompensation = sheetHeight > 0 ? -sheetHeight * (1 - scale) : 0

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
              <div className="column">
                <SheetAttributesSkills character={character} />
                <SheetWeapons character={character} />
              </div>
              <div className="column">
                <SheetEdges character={character} />
                <SheetHindrances character={character} />
                <SheetGear character={character} />
                <SheetSpecialRules character={character} />
              </div>
            </section>
            <SheetNotes character={character} />
          </div>
        </main>
      </div>
    </div>
  )
}
