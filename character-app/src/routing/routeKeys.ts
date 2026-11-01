export function entityEditorKey(id?: string): string {
  return id === undefined ? 'create' : `edit:${id}`
}
