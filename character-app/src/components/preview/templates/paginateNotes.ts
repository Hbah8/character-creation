/// <reference lib="es2022.intl" />

// Split the rendered Markdown so inline formatting and nested blocks survive page breaks.
export function paginateNotes(markdown: HTMLElement, probe: HTMLElement, firstHeight: number, pageHeight: number): string[] {
  const source = markdown.cloneNode(true) as HTMLElement
  // Range fragments retain explicit list item values when the earlier items are on another page.
  for (const list of source.querySelectorAll('ol')) {
    let value = list.start
    for (const item of list.querySelectorAll(':scope > li')) {
      item.setAttribute('value', String(value++))
    }
  }
  // Most characters fit on one page. Measure once before computing possible split points.
  probe.replaceChildren(...source.cloneNode(true).childNodes)
  if (probe.offsetHeight <= firstHeight) {
    const html = probe.innerHTML
    probe.replaceChildren()
    return [html]
  }

  const document = source.ownerDocument
  const positions: Array<{ node: Node; offset: number; preferred: boolean }> = [
    { node: source, offset: 0, preferred: true },
  ]
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : null
  let node = walker.nextNode()
  while (node) {
    if (node instanceof Text) {
      const segments = segmenter
        ? Array.from(segmenter.segment(node.data), entry => entry.segment)
        : node.data
      let offset = 0
      for (const segment of segments) {
        offset += segment.length
        positions.push({ node, offset, preferred: /\s/u.test(segment) })
      }
    } else if (node instanceof Element) {
      const parent = node.parentNode!
      const offset = Array.from(parent.childNodes).indexOf(node)
      if (node.matches('br, hr, img, input')) {
        positions.push({ node: parent, offset: offset + 1, preferred: true })
      } else if (node.matches('p, li, blockquote, pre, h1, h2, h3, h4, h5, h6, tr')) {
        positions.push({ node: parent, offset, preferred: true })
      }
    }
    node = walker.nextNode()
  }
  if (positions.length === 1) {
    probe.replaceChildren()
    return ['']
  }
  positions[positions.length - 1] = { node: source, offset: source.childNodes.length, preferred: true }

  const range = document.createRange()
  function fragment(from: number, to: number): DocumentFragment {
    const start = positions[from]
    const end = positions[to]
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset)
    const content = range.cloneContents()
    // Range only clones descendants of the common ancestor. Restore its formatting.
    let ancestor = range.commonAncestorContainer
    if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentNode!
    while (ancestor !== source) {
      const wrapper = ancestor.cloneNode(false)
      wrapper.appendChild(content)
      content.append(wrapper)
      ancestor = ancestor.parentNode!
    }
    // The rest of an item belongs to the same bullet, even on a new page.
    const leadingItem = (start.node instanceof Element ? start.node : start.node.parentElement)?.closest('li')
    if (leadingItem) content.querySelector('li')?.classList.add('compact-notes-list-continuation')
    return content
  }

  const pages: string[] = []
  let start = 0
  const last = positions.length - 1
  while (start < last) {
    const height = pages.length ? pageHeight : firstHeight
    let low = start
    let high = last
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      probe.replaceChildren(fragment(start, mid))
      if (probe.offsetHeight <= height) low = mid
      else high = mid - 1
    }

    if (low === start && pages.length === 0) {
      pages.push('')
      continue
    }

    // Prefer to keep ordinary words together. Long unbroken tokens can split anywhere.
    let end = Math.max(low, start + 1)
    if (end < last) {
      for (let candidate = end; candidate > start && candidate > end - 32; candidate--) {
        if (positions[candidate].preferred) {
          end = candidate
          break
        }
      }
    }
    probe.replaceChildren(fragment(start, end))
    pages.push(probe.innerHTML)
    start = end
  }
  probe.replaceChildren()
  return pages
}
