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
  mobile?: boolean
  scaleMode?: ScaleMode
  templateId?: SheetTemplateId
  printMode?: boolean
}

export function CharacterSheet({
  resolvedCharacter,
  mobile = false,
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
  }, [printMode])

  useEffect(() => {
    if (printMode) return
    const element = sheetRef.current?.querySelector<HTMLElement>('.sheet')
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setSheetHeight(entry.borderBoxSize[0]?.blockSize ?? element.offsetHeight)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [printMode, template.id])

  const widthScale = containerSize.width > 0 ? containerSize.width / SHEET_WIDTH_PX : 1
  const heightScale = containerSize.height > 0 && sheetHeight > 0 ? containerSize.height / sheetHeight : 1
  const scale = scaleMode === '100%'
    ? 1
    : scaleMode === 'full-page'
      ? Math.min(widthScale, heightScale, 1)
      : Math.min(widthScale, 1)

  if (printMode) {
    return <Shell resolvedCharacter={resolvedCharacter} layout={layout} world={world} />
  }

  return (
    <div ref={wrapperRef} className="sheet-outer-wrapper size-full overflow-auto">
      <div
        ref={sheetRef}
        className="sheet-scale-wrapper"
        style={{ zoom: scale, width: SHEET_WIDTH_PX, marginInline: 'auto' }}
      >
        <Shell
          resolvedCharacter={resolvedCharacter}
          layout={layout}
          world={world}
          mobile={mobile && template.id === 'classic'}
        />
      </div>
    </div>
  )
}
