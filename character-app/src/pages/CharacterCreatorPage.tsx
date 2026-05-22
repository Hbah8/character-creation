import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, User, Zap, Shield, Target, Star, AlertTriangle, Crosshair, Package, Settings, FileText } from 'lucide-react'
import { useCharacterStore } from '@/store/useCharacterStore'
import { useCharacterLibrary } from '@/store/useCharacterLibrary'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { CharacterSheet } from '@/components/preview/CharacterSheet'
import type { ScaleMode } from '@/components/preview/CharacterSheet'
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
import { CharacterLibrary } from '@/components/CharacterLibrary'
import { ImportErrorDialog } from '@/components/ImportErrorDialog'
import { ShareConfirmDialog } from '@/components/ShareConfirmDialog'
import { WelcomeDialog, hasSeenWelcome, markWelcomeSeen } from '@/components/WelcomeDialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { exportToJson, exportToPdf } from '@/services/exportService'
import { importFromJson } from '@/services/importService'
import { encodeCharacterToHash, decodeCharacterFromHash, buildShareUrl } from '@/services/shareService'
import type { Character } from '@/types/character'
import { DEFAULT_LAYOUT } from '@/types/character'
import type { ColumnSide } from '@/types/character'
import { detectInitialLocale, changeLocale } from '@/i18n/index'
import { getDefaultCharacter } from '@/data/defaultCharacter'
import type { Locale } from '@/i18n/types'

const initialLocale = detectInitialLocale()

const SECTIONS = [
  'identity', 'attributes', 'combat', 'skills',
  'edges', 'hindrances', 'weapons', 'gear', 'specialRules', 'notes',
] as const

type SectionKey = typeof SECTIONS[number]

const SECTION_ICONS: Record<SectionKey, React.ElementType> = {
  identity: User,
  attributes: Zap,
  combat: Shield,
  skills: Target,
  edges: Star,
  hindrances: AlertTriangle,
  weapons: Crosshair,
  gear: Package,
  specialRules: Settings,
  notes: FileText,
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function CharacterCreatorPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const library = useCharacterLibrary()
  const { activeWorldId } = useWorldLibrary()
  const store = useCharacterStore(
    id ? getDefaultCharacter(initialLocale) : { ...getDefaultCharacter(initialLocale), worldId: activeWorldId ?? undefined }
  )
  const { character } = store

  const { t: tNav } = useTranslation('navigation')
  const { t: tHeader } = useTranslation('header')
  const { t: tLibrary } = useTranslation('library')
  const { t: tForm } = useTranslation('form')

  const [importError, setImportError] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [cleanSnapshot, setCleanSnapshot] = useState<string>(
    () => JSON.stringify(getDefaultCharacter(initialLocale))
  )
  const [copyLinkStatus, setCopyLinkStatus] = useState<'idle' | 'copied'>('idle')
  const [pendingShareChar, setPendingShareChar] = useState<Character | null>(null)
  const [pendingSharePortraitStripped, setPendingSharePortraitStripped] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(() => !hasSeenWelcome())
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [activeSection, setActiveSection] = useState<string>('identity')
  const [scaleMode, setScaleMode] = useState<ScaleMode>('fit-width')
  const copyLinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedIdRef = useRef<string | undefined>(undefined)

  // Load character from library when navigating to /creator/:id
  useEffect(() => {
    if (id && id !== loadedIdRef.current) {
      try {
        const loaded = library.loadById(id)
        store.replaceCharacter(loaded)
        setCleanSnapshot(JSON.stringify(loaded))
        setSavedAt(null)
        loadedIdRef.current = id
      } catch {
        navigate('/', { replace: true })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Handle share hash on /creator route
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash === '#') return
    history.replaceState(null, '', window.location.pathname + window.location.search)
    try {
      const { character: shared, portraitStripped } = decodeCharacterFromHash(hash)
      setPendingShareChar(shared)
      setPendingSharePortraitStripped(portraitStripped)
    } catch {
      setImportError('share.decodeError')
    }
  }, [])

  function handleWelcomeClose() {
    markWelcomeSeen()
    setWelcomeOpen(false)
  }

  const isDirty = useMemo(
    () => JSON.stringify(character) !== cleanSnapshot,
    [character, cleanSnapshot]
  )

  function handleSave() {
    const savedId = library.save(character)
    setCleanSnapshot(JSON.stringify(character))
    setSavedAt(new Date())
    // Update URL to /creator/:id if we just saved a new character
    if (!id) {
      navigate(`/creator/${savedId}`, { replace: true })
    }
  }

  function handleLoad(char: ReturnType<typeof library.loadById>) {
    store.replaceCharacter(char)
    setCleanSnapshot(JSON.stringify(char))
    setSavedAt(null)
  }

  function handleNewCharacter() {
    const fresh = getDefaultCharacter(locale)
    store.replaceCharacter(fresh)
    setCleanSnapshot(JSON.stringify(fresh))
    setSavedAt(null)
    library.markNew()
    navigate('/creator', { replace: true })
  }

  async function handleImportJson(file: File) {
    try {
      const imported = await importFromJson(file)
      store.replaceCharacter(imported)
      setCleanSnapshot(JSON.stringify(imported))
      setSavedAt(null)
      library.markNew()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'validation.import.notAnObject')
    }
  }

  function handleCopyLink() {
    const { hash } = encodeCharacterToHash(character)
    const url = buildShareUrl(hash)
    void navigator.clipboard.writeText(url).then(() => {
      setCopyLinkStatus('copied')
      if (copyLinkTimerRef.current) clearTimeout(copyLinkTimerRef.current)
      copyLinkTimerRef.current = setTimeout(() => setCopyLinkStatus('idle'), 2000)
    })
  }

  function handleShareConfirm() {
    if (!pendingShareChar) return
    store.replaceCharacter(pendingShareChar)
    setCleanSnapshot(JSON.stringify(pendingShareChar))
    setSavedAt(null)
    library.markNew()
    setPendingShareChar(null)
  }

  function handleShareCancel() {
    setPendingShareChar(null)
  }

  function handleLocaleChange(next: Locale) {
    setLocale(next)
    changeLocale(next)
  }

  function handleLayoutChange(block: keyof typeof DEFAULT_LAYOUT, col: ColumnSide) {
    store.updateField('layout', { ...(character.layout ?? DEFAULT_LAYOUT), [block]: col })
  }

  const layout = character.layout ?? DEFAULT_LAYOUT

  const subtitle = [character.rank, character.role, character.fileNo].filter(Boolean).join(' · ')

  const sectionLabels: Record<SectionKey, string> = useMemo(() => ({
    identity: tForm('sections.identity'),
    attributes: tForm('sections.attributes'),
    combat: tForm('sections.combat'),
    skills: tForm('sections.skills'),
    edges: tForm('sections.edges'),
    hindrances: tForm('sections.hindrances'),
    weapons: tForm('sections.weapons'),
    gear: tForm('sections.gear'),
    specialRules: tForm('sections.specialRules'),
    notes: tForm('sections.notes'),
  }), [tForm])

  function renderFormSection(section: string) {
    switch (section) {
      case 'identity':
        return <IdentityForm character={character} onChange={store.updateField} />
      case 'attributes':
        return <AttributesForm character={character} onChange={store.updateField} />
      case 'combat':
        return <CombatForm character={character} onChange={store.updateField} />
      case 'skills':
        return (
          <SkillsForm
            skills={character.skills}
            character={character}
            onAdd={store.addSkill}
            onUpdate={store.updateSkill}
            onRemove={store.removeSkill}
          />
        )
      case 'edges':
        return (
          <EdgesForm
            edges={character.edges}
            onAdd={store.addEdge}
            onUpdate={store.updateEdge}
            onRemove={store.removeEdge}
            column={layout.edges}
            onColumnChange={col => handleLayoutChange('edges', col)}
          />
        )
      case 'hindrances':
        return (
          <HindrancesForm
            hindrances={character.hindrances}
            onAdd={store.addHindrance}
            onUpdate={store.updateHindrance}
            onRemove={store.removeHindrance}
            column={layout.hindrances}
            onColumnChange={col => handleLayoutChange('hindrances', col)}
          />
        )
      case 'weapons':
        return (
          <WeaponsForm
            weapons={character.weapons}
            onAdd={store.addWeapon}
            onUpdate={store.updateWeapon}
            onRemove={store.removeWeapon}
            column={layout.weapons}
            onColumnChange={col => handleLayoutChange('weapons', col)}
          />
        )
      case 'gear':
        return (
          <GearForm
            gear={character.gear}
            onAdd={store.addGearItem}
            onUpdate={store.updateGearItem}
            onRemove={store.removeGearItem}
            column={layout.gear}
            onColumnChange={col => handleLayoutChange('gear', col)}
          />
        )
      case 'specialRules':
        return (
          <SpecialRulesForm
            specialRules={character.specialRules}
            onAdd={store.addSpecialRule}
            onUpdate={store.updateSpecialRule}
            onRemove={store.removeSpecialRule}
            column={layout.specialRules}
            onColumnChange={col => handleLayoutChange('specialRules', col)}
          />
        )
      case 'notes':
        return (
          <NotesForm
            notes={character.notes}
            onChange={val => store.updateField('notes', val)}
          />
        )
      default:
        return null
    }
  }

  const mobileSectionNav = (
    <div className="shrink-0 border-b px-3 py-2 print:hidden">
      <Select value={activeSection} onValueChange={setActiveSection}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SECTIONS.map(s => (
            <SelectItem key={s} value={s} className="text-xs">{sectionLabels[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col h-[100svh] w-full max-w-full overflow-x-hidden bg-background text-foreground print:h-auto">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0 print:hidden gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
            title="Назад к обзору"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-semibold text-sm truncate">
              {character.callsign || tHeader('newCharacterPlaceholder')}
            </span>
            {subtitle && (
              <span className="text-muted-foreground text-xs truncate">{subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="text-amber-500 text-xs">{tHeader('unsaved')}</span>
          )}
          {!isDirty && savedAt && (
            <span className="text-muted-foreground text-xs">
              {tHeader('savedAt', { time: formatTime(savedAt) })}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={tHeader('helpButton')}
            onClick={() => setWelcomeOpen(true)}
          >
            ?
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium"
            onClick={() => handleLocaleChange(locale === 'en' ? 'ru' : 'en')}
          >
            {locale.toUpperCase()}
          </Button>
          <CharacterLibrary
            library={library}
            isDirty={isDirty}
            onLoad={handleLoad}
            onNewCharacter={handleNewCharacter}
          />
          <Button variant="default" size="sm" onClick={handleSave}>
            {tLibrary('save')}
          </Button>
          <ExportDropdown
            onExportPdf={() => exportToPdf()}
            onExportJson={() => exportToJson(character)}
            onImportJson={handleImportJson}
            onCopyLink={handleCopyLink}
            copyLinkStatus={copyLinkStatus}
          />
        </div>
      </header>

      {/* Desktop: three-panel layout */}
      <div className="hidden md:flex flex-1 min-h-0 print:flex print:h-auto">
        {/* Left sidebar: section nav */}
        <div className="w-44 shrink-0 border-r flex flex-col min-h-0 print:hidden">
          <div className="px-3 pt-3 pb-1.5 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tHeader('sectionsHeading')}
            </span>
          </div>
          <ScrollArea className="flex-1">
            <nav className="px-2 pb-2 flex flex-col gap-0.5">
              {SECTIONS.map(s => {
                const Icon = SECTION_ICONS[s]
                return (
                  <button
                    key={s}
                    onClick={() => setActiveSection(s)}
                    className={cn(
                      'flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-xs font-medium text-left transition-colors',
                      activeSection === s
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {sectionLabels[s]}
                  </button>
                )
              })}
            </nav>
          </ScrollArea>
        </div>

        {/* Form panel */}
        <div className="w-[400px] shrink-0 border-r flex flex-col min-h-0 print:hidden">
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="p-4">
              {renderFormSection(activeSection)}
            </div>
          </ScrollArea>
        </div>

        {/* Preview panel */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 print:flex print:w-full print:h-auto">
          <div className="shrink-0 border-b flex items-center justify-between px-3 py-1.5 bg-background print:hidden">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="size-3.5" />
              <span>{tHeader('previewLabel')}</span>
            </div>
            <ToggleGroup
              type="single"
              size="sm"
              value={scaleMode}
              onValueChange={val => { if (val) setScaleMode(val as ScaleMode) }}
            >
              <ToggleGroupItem value="fit-width" className="h-6 px-2 text-xs">{tHeader('scalesFitWidth')}</ToggleGroupItem>
              <ToggleGroupItem value="full-page" className="h-6 px-2 text-xs">{tHeader('scalesFullPage')}</ToggleGroupItem>
              <ToggleGroupItem value="100%" className="h-6 px-2 text-xs">{tHeader('scalesActual')}</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex-1 min-h-0 bg-[#d0d0d0] overflow-hidden print:overflow-visible">
            <CharacterSheet character={character} scaleMode={scaleMode} />
          </div>
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

        <TabsContent value="form" className="flex-1 min-h-0 flex flex-col mt-0">
          {mobileSectionNav}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4">
              {renderFormSection(activeSection)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 min-h-0 flex flex-col mt-0">
          <div className="relative flex-1 bg-[#d0d0d0] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-2 right-2 z-10 flex justify-end px-2 mb-[-32px] pointer-events-none print:hidden">
              <div className="bg-background/90 backdrop-blur-sm border rounded-md px-1 py-0.5 shadow-sm pointer-events-auto">
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={scaleMode}
                  onValueChange={val => { if (val) setScaleMode(val as ScaleMode) }}
                >
                  <ToggleGroupItem value="fit-width" className="h-6 px-2 text-xs">{tHeader('scalesFitWidth')}</ToggleGroupItem>
                  <ToggleGroupItem value="full-page" className="h-6 px-2 text-xs">{tHeader('scalesFullPage')}</ToggleGroupItem>
                  <ToggleGroupItem value="100%" className="h-6 px-2 text-xs">{tHeader('scalesActual')}</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <CharacterSheet character={character} fitToContainer />
          </div>
        </TabsContent>
      </Tabs>

      <WelcomeDialog open={welcomeOpen} onClose={handleWelcomeClose} />
      <ImportErrorDialog
        open={importError !== null}
        message={importError ?? ''}
        onClose={() => setImportError(null)}
      />
      <ShareConfirmDialog
        open={pendingShareChar !== null}
        callsign={pendingShareChar?.callsign ?? ''}
        portraitStripped={pendingSharePortraitStripped}
        onConfirm={handleShareConfirm}
        onCancel={handleShareCancel}
      />
    </div>
  )
}
