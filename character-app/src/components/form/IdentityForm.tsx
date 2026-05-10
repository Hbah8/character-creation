import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Character } from '@/types/character'

interface Props {
  character: Character
  onChange: <K extends keyof Character>(key: K, value: Character[K]) => void
}

export function IdentityForm({ character, onChange }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identity</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="sheetTitle">Sheet Title</Label>
          <Input id="sheetTitle" value={character.sheetTitle} onChange={e => onChange('sheetTitle', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="callsign">Callsign</Label>
          <Input id="callsign" value={character.callsign} onChange={e => onChange('callsign', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={character.name} onChange={e => onChange('name', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rank">Rank</Label>
          <Input id="rank" value={character.rank} onChange={e => onChange('rank', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={character.role} onChange={e => onChange('role', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fileNo">File No.</Label>
          <Input id="fileNo" value={character.fileNo} onChange={e => onChange('fileNo', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="portraitUrl">Portrait URL</Label>
          <Input id="portraitUrl" value={character.portraitUrl} onChange={e => onChange('portraitUrl', e.target.value)} placeholder="https://…" />
        </div>
      </div>
    </div>
  )
}
