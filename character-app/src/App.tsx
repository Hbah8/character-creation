import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Button } from '@/components/ui/button'
import { exportToJson, exportToPdf } from '@/services/exportService'
import { importFromJson } from '@/services/importService'
import { detectInitialLocale, changeLocale } from '@/i18n/index'
import { getDefaultCharacter } from '@/data/defaultCharacter'
import type { Locale } from '@/i18n/types'

const initialLocale = detectInitialLocale()

function App() {
  const store = useCharacterStore(getDefaultCharacter(initialLocale))
  const { character } = store
  const { t: tNav } = useTranslation('navigation')
  const { t: tHeader } = useTranslation('header')

  const [importError, setImportError] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>(initialLocale)

  async function handleImportJson(file: File) {
    try {
      const imported = await importFromJson(file)
      store.replaceCharacter(imported)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'validation.import.notAnObject')
    }
  }

  function handleLocaleChange(next: Locale) {
    setLocale(next)
    changeLocale(next)
  }

  const FormContent = (
    <>
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
    </>
  )

  return (
    <div className="flex flex-col h-[100svh] w-full max-w-full overflow-x-hidden bg-background text-foreground print:h-auto">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0 print:hidden gap-2">
        <h1 className="text-lg font-semibold tracking-tight">{tHeader('appTitle')}</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button
              variant={locale === 'en' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-7 px-2 text-xs"
              onClick={() => handleLocaleChange('en')}
            >
              EN
            </Button>
            <Button
              variant={locale === 'ru' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-7 px-2 text-xs"
              onClick={() => handleLocaleChange('ru')}
            >
              RU
            </Button>
          </div>
          <ExportDropdown
            onExportPdf={() => exportToPdf()}
            onExportJson={() => exportToJson(character)}
            onImportJson={handleImportJson}
          />
        </div>
      </header>

      {/* Desktop: two-panel side-by-side layout */}
      <div className="hidden md:flex flex-1 min-h-0 print:flex print:h-auto">
        {/* Form panel */}
        <div className="w-[420px] shrink-0 border-r flex flex-col min-h-0 print:hidden">
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="p-4 flex flex-col gap-6">
              {FormContent}
            </div>
          </ScrollArea>
        </div>

        {/* Preview panel */}
        <div className="flex-1 min-w-0 bg-[#d0d0d0] overflow-hidden print:overflow-visible print:w-full">
          <CharacterSheet character={character} />
        </div>
      </div>

      {/* Mobile: tab layout */}
      <Tabs defaultValue="form" className="flex md:hidden flex-col flex-1 min-h-0 w-full min-w-0 overflow-x-hidden">
        <div className="shrink-0 border-b px-3 py-1.5">
          <TabsList className="w-full">
            <TabsTrigger value="form" className="flex-1">{tNav('editForm')}</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">{tNav('preview')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="form" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="p-4 flex flex-col gap-6">
            {FormContent}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 min-h-0 bg-[#d0d0d0] overflow-y-auto overflow-x-hidden">
          <CharacterSheet character={character} fitToContainer />
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
