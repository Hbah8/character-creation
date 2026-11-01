export async function enterMapFullscreen(element: HTMLElement): Promise<void> {
  await element.requestFullscreen()
}

export async function exitMapFullscreen(): Promise<void> {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  }
}
