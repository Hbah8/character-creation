import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DieName, Skill } from '@/types/character'
import { Trash2, Plus } from 'lucide-react'

const DIE_NAMES: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12']

const LINKED_ATTRIBUTES = [
  'Ловкость',
  'Сила',
  'Смекалка',
  'Характер',
  'Выносливость',
]

interface Props {
  skills: Skill[]
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Skill>) => void
  onRemove: (id: string) => void
}

export function SkillsForm({ skills, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Skills</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-3.5 mr-1" /> Add Skill
        </Button>
      </div>

      <div className="space-y-2 overflow-x-auto">
        <div className="grid grid-cols-[1fr_80px_140px_36px] gap-1.5 text-xs text-muted-foreground px-1 min-w-[320px]">
          <Label className="text-xs">Name</Label>
          <Label className="text-xs">Die</Label>
          <Label className="text-xs">Linked Attribute</Label>
          <span />
        </div>

        {skills.map(skill => (
          <div key={skill.id} className="grid grid-cols-[1fr_80px_140px_36px] gap-1.5 items-center min-w-[320px]">
            <Input
              value={skill.name}
              onChange={e => onUpdate(skill.id, { name: e.target.value })}
              placeholder="Skill name"
            />
            <Select value={skill.die} onValueChange={val => onUpdate(skill.id, { die: val as DieName })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIE_NAMES.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={skill.linkedAttribute} onValueChange={val => onUpdate(skill.id, { linkedAttribute: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINKED_ATTRIBUTES.map(attr => (
                  <SelectItem key={attr} value={attr}>{attr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => onRemove(skill.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No skills yet.</p>
        )}
      </div>
    </div>
  )
}
