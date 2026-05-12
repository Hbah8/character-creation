import { useState } from 'react'
import { useCharacterStore } from '@/store/useCharacterStore'
import { CharacterSheet } from '@/components/preview/CharacterSheet'
import { IdentityForm } from '@/components/form/IdentityForm'
import { AttributesForm } from '@/components/form/AttributesForm'
import { CombatForm } from '@/components/form/CombatForm'
import { SkillsForm } from '@/components/form/SkillsForm'
import { EdgesForm } from '@/components/form/EdgesForm'
import { HindrancesForm } from '@/components/form/HindrancesForm'
import { WeaponsForm } from '@/components/form/WeaponsForm'
import { GearForm } from '@/components/form/GearForm'
import { SpecialRulesForm } from '@/components/form/SpecialRulesForm'
import { NotesForm } from '@/components/form/NotesForm'
import { ExportDropdown } from '@/components/ExportDropdown'
import { ImportErrorDialog } from '@/components/ImportErrorDialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { exportToJson, exportToPdf } from '@/services/exportService'
import { importFromJson } from '@/services/importService'

function App() {
  const store = useCharacterStore()
  const { character } = store

  const [importError, setImportError] = useState<string | null>(null)

  async function handleImportJson(file: File) {
    try {
      const imported = await importFromJson(file)
      store.replaceCharacter(imported)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unknown error.')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground print:h-auto">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0 print:hidden">
        <h1 className="text-lg font-semibold tracking-tight">SWADE Character Creator</h1>
        <ExportDropdown
          onExportPdf={() => exportToPdf()}
          onExportJson={() => exportToJson(character)}
          onImportJson={handleImportJson}
        />
      </header>

      {/* Desktop: two-panel side-by-side layout */}
      <div className="hidden md:flex flex-1 min-h-0 print:flex print:h-auto">
        {/* Form panel */}
        <div className="w-[420px] shrink-0 border-r flex flex-col min-h-0 print:hidden">
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="p-4 space-y-6">
              <IdentityForm character={character} onChange={store.updateField} />
              <Separator />
              <AttributesForm character={character} onChange={store.updateField} />
              <Separator />
              <CombatForm character={character} onChange={store.updateField} />
              <Separator />
              <SkillsForm
                skills={character.skills}
                onAdd={store.addSkill}
                onUpdate={store.updateSkill}
                onRemove={store.removeSkill}
              />
              <Separator />
              <EdgesForm
                edges={character.edges}
                onAdd={store.addEdge}
                onUpdate={store.updateEdge}
                onRemove={store.removeEdge}
              />
              <Separator />
              <HindrancesForm
                hindrances={character.hindrances}
                onAdd={store.addHindrance}
                onUpdate={store.updateHindrance}
                onRemove={store.removeHindrance}
              />
              <Separator />
              <WeaponsForm
                weapons={character.weapons}
                onAdd={store.addWeapon}
                onUpdate={store.updateWeapon}
                onRemove={store.removeWeapon}
              />
              <Separator />
              <GearForm
                gear={character.gear}
                onAdd={store.addGearItem}
                onUpdate={store.updateGearItem}
                onRemove={store.removeGearItem}
              />
              <Separator />
              <SpecialRulesForm
                specialRules={character.specialRules}
                onAdd={store.addSpecialRule}
                onUpdate={store.updateSpecialRule}
                onRemove={store.removeSpecialRule}
              />
              <Separator />
              <NotesForm
                notes={character.notes}
                onChange={val => store.updateField('notes', val)}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Preview panel */}
        <div className="flex-1 min-w-0 bg-[#d0d0d0] overflow-hidden print:overflow-visible print:w-full">
          <CharacterSheet character={character} />
        </div>
      </div>

      {/* Mobile: tab layout */}
      <Tabs defaultValue="form" className="flex md:hidden flex-col flex-1 min-h-0">
        <div className="shrink-0 border-b px-3 py-1.5">
          <TabsList className="w-full">
            <TabsTrigger value="form" className="flex-1">Edit Form</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="form" className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <IdentityForm character={character} onChange={store.updateField} />
              <Separator />
              <AttributesForm character={character} onChange={store.updateField} />
              <Separator />
              <CombatForm character={character} onChange={store.updateField} />
              <Separator />
              <SkillsForm
                skills={character.skills}
                onAdd={store.addSkill}
                onUpdate={store.updateSkill}
                onRemove={store.removeSkill}
              />
              <Separator />
              <EdgesForm
                edges={character.edges}
                onAdd={store.addEdge}
                onUpdate={store.updateEdge}
                onRemove={store.removeEdge}
              />
              <Separator />
              <HindrancesForm
                hindrances={character.hindrances}
                onAdd={store.addHindrance}
                onUpdate={store.updateHindrance}
                onRemove={store.removeHindrance}
              />
              <Separator />
              <WeaponsForm
                weapons={character.weapons}
                onAdd={store.addWeapon}
                onUpdate={store.updateWeapon}
                onRemove={store.removeWeapon}
              />
              <Separator />
              <GearForm
                gear={character.gear}
                onAdd={store.addGearItem}
                onUpdate={store.updateGearItem}
                onRemove={store.removeGearItem}
              />
              <Separator />
              <SpecialRulesForm
                specialRules={character.specialRules}
                onAdd={store.addSpecialRule}
                onUpdate={store.updateSpecialRule}
                onRemove={store.removeSpecialRule}
              />
              <Separator />
              <NotesForm
                notes={character.notes}
                onChange={val => store.updateField('notes', val)}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 min-h-0 bg-[#d0d0d0] overflow-hidden">
          <CharacterSheet character={character} />
        </TabsContent>
      </Tabs>

      <ImportErrorDialog
        open={importError !== null}
        message={importError ?? ''}
        onClose={() => setImportError(null)}
      />
    </div>
  )
}

export default App
