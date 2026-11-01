import { useRef, useEffect, useState } from 'react'
import type { SheetTemplateId } from '@/types/character'
import type { ResolvedCharacter } from '@/services/resolveEffectiveCharacter'
import '@/styles/sheet.css'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { getSheetTemplate } from './templates/sheetTemplateRegistry'
import { resolveSheetLayout } from './templates/sheetTemplateLayout'

const SHEET_WIDTH_PX = 794

export type ScaleMode = 'fit-width' | 'full-page' | '100%'

interface Props {
  resolvedCharacter: ResolvedCharacter
  fitToContainer?: boolean
  scaleMode?: ScaleMode
  templateId?: SheetTemplateId
  printMode?: boolean
}

export function CharacterSheet({
  resolvedCharacter,
  fitToContainer = false,
  scaleMode = 'fit-width',
  templateId = 'classic',
  printMode = false,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [sheetHeight, setSheetHeight] = useState(0)
  const { source: character } = resolvedCharacter
  const { entries } = useWorldLibrary()
  const world = entries.find(entry => entry.id === character.worldId)?.world ?? null
  const template = getSheetTemplate(templateId)
  const layout = resolveSheetLayout(character, template.id, template.defaultLayout)
  const Shell = template.Shell

  useEffect(() => {
    if (printMode) return

    if (fitToContainer) {
      const update = () => {
        const viewport = window.visualViewport
        const width = viewport ? viewport.width : window.innerWidth
        const height = viewport ? viewport.height : window.innerHeight
        setContainerSize({ width, height })
      }
      update()
      const viewport = window.visualViewport
      const target: EventTarget = viewport ?? window
      target.addEventListener('resize', update)
      return () => target.removeEventListener('resize', update)
    }

    const element = wrapperRef.current
    if (!element) return
    let frameId: number
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
      })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [fitToContainer, printMode])

  useEffect(() => {
    if (printMode) return
    const element = sheetRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSheetHeight(entry.contentRect.height))
    observer.observe(element)
    return () => observer.disconnect()
  }, [printMode])

  const widthScale = containerSize.width > 0 ? containerSize.width / SHEET_WIDTH_PX : 1
  const heightScale = containerSize.height > 0 && sheetHeight > 0 ? containerSize.height / sheetHeight : 1
  const scale = scaleMode === '100%'
    ? 1
    : scaleMode === 'full-page'
      ? Math.min(widthScale, heightScale, 1)
      : Math.min(widthScale, 1)
  const bottomCompensation = !fitToContainer && sheetHeight > 0 ? -sheetHeight * (1 - scale) : 0

  if (printMode) {
    return <Shell resolvedCharacter={resolvedCharacter} layout={layout} world={world} />
  }

  const shell = (
    <Shell
      resolvedCharacter={resolvedCharacter}
      layout={layout}
      world={world}
      mobile={fitToContainer && template.id === 'classic'}
    />
  )

  if (fitToContainer) {
    return (
      <div ref={wrapperRef} className="sheet-outer-wrapper" style={{ width: '100%' }}>
        <div
          ref={sheetRef}
          className="sheet-scale-wrapper"
          style={{ zoom: scale, width: SHEET_WIDTH_PX, margin: '0 auto' }}
        >
          {shell}
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
        {shell}
      </div>
    </div>
  )
}
