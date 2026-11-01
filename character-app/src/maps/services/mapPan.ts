export interface MapPanOffset {
  x: number
  y: number
}

export interface MapPanBounds {
  width: number
  height: number
}

function clampAxis(value: number, maxOffset: number): number {
  if (maxOffset === 0) return 0
  return Math.min(maxOffset, Math.max(-maxOffset, value))
}

export function clampMapPan(
  offset: MapPanOffset,
  image: MapPanBounds,
  viewport: MapPanBounds,
): MapPanOffset {
  const maxX = Math.max(0, (image.width - viewport.width) / 2)
  const maxY = Math.max(0, (image.height - viewport.height) / 2)
  return {
    x: clampAxis(offset.x, maxX),
    y: clampAxis(offset.y, maxY),
  }
}
