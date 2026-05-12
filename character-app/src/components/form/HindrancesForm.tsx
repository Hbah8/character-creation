import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Hindrance } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  hindrances: Hindrance[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Hindrance>) => void
  onRemove: (id: string) => void
}

export function HindrancesForm({ hindrances, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Hindrances</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add Hindrance
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {hindrances.map(h => (
          <div key={h.id} className="flex flex-col gap-1.5 p-2 border rounded-md">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={h.name}
                  onChange={e => onUpdate(h.id, { name: e.target.value })}
                  placeholder="Hindrance name"
                />
              </div>
              <div className="w-28 flex flex-col gap-1">
                <Label className="text-xs">Severity</Label>
                <Select value={h.severity} onValueChange={val => onUpdate(h.id, { severity: val as Hindrance['severity'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="М">Minor (М)</SelectItem>
                      <SelectItem value="К">Major (К)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onRemove(h.id)} className="mt-5 text-destructive hover:text-destructive">
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={h.description}
                onChange={e => onUpdate(h.id, { description: e.target.value })}
                placeholder="Describe the hindrance…"
                rows={2}
              />
            </div>
          </div>
        ))}

        {hindrances.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No hindrances yet.</p>
        )}
      </div>
    </div>
  )
}
