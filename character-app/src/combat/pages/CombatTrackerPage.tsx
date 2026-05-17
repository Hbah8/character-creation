import { useState, useRef, useCallback } from 'react'
import { AlignJustify, Rows3, Plus, Swords, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const MIN_LIST_PX = 200
const MIN_CARD_PX = 300
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useCombatStore } from '../store/useCombatStore'
import { CombatantRow } from '../components/CombatantRow'
import { CombatantCard, CombatantCardEmpty } from '../components/CombatantCard'
import { AddCombatantDialog } from '../components/AddCombatantDialog'
import { RoundControls } from '../components/RoundControls'

export function CombatTrackerPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [splitPct, setSplitPct] = useState(40)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const offsetX = ev.clientX - rect.left
      const clamped = Math.min(
        Math.max(offsetX, MIN_LIST_PX),
        rect.width - MIN_CARD_PX,
      )
      setSplitPct((clamped / rect.width) * 100)
    }

    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const {
    sortedCombatants,
    combatants,
    round,
    jokerDrawnThisRound,
    activeCombatantId,
    setActiveCombatantId,
    advanceTurn,
    takeHold,
    addCombatant,
    removeCombatant,
    clearCombatants,
    updateCombatant,
    toggleStatus,
    dealCards,
    redrawCard,
    resolveRedraw,
    nextRound,
    resetCombat,
    focusedCombatantId,
    setFocusedCombatantId,
  } = useCombatStore()

  const hasCombatants = combatants.length > 0
  const focusedCombatant = sortedCombatants.find(c => c.id === focusedCombatantId) ?? null

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <Swords className="size-4 text-muted-foreground" />
        <h1 className="text-base font-semibold">Трекер боя</h1>
        <div className="flex-1" />
        <Button
          size="icon"
          variant={compact ? 'secondary' : 'ghost'}
          className="size-8"
          title={compact ? 'Полный режим' : 'Компактный режим'}
          onClick={() => setCompact(v => !v)}
        >
          {compact ? <AlignJustify className="size-3.5" /> : <Rows3 className="size-3.5" />}
        </Button>
        {hasCombatants && (
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Очистить всех
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Очистить список?</AlertDialogTitle>
                <AlertDialogDescription>
                  Все участники будут удалены без возможности восстановления.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={clearCombatants}
                >
                  Удалить всех
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1.5">
          <Plus className="size-3.5" />
          Добавить
        </Button>
      </header>

      {/* Round controls */}
      <div className="px-4 py-2 border-b shrink-0">
        <RoundControls
          round={round}
          jokerDrawnThisRound={jokerDrawnThisRound}
          hasCombatants={hasCombatants}
          onDealCards={() => dealCards()}
          onNextRound={nextRound}
          onResetCombat={resetCombat}
        />
      </div>

      {/* Main area: list (left) + draggable divider + detail card (right) */}
      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* Left: initiative list */}
        <div
          style={{ width: `${splitPct}%` }}
          className="shrink-0 min-w-0 flex flex-col min-h-0"
        >
          <ScrollArea className="flex-1">
            <div className="p-4">
              {!hasCombatants ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <Swords className="size-10 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Нет участников</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Добавьте Диких Карт и статистов, чтобы начать бой
                    </p>
                  </div>
                  <Button onClick={() => setAddDialogOpen(true)} className="gap-1.5">
                    <Plus className="size-4" />
                    Добавить участника
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {sortedCombatants.map(combatant => (
                    <CombatantRow
                      key={combatant.id}
                      combatant={combatant}
                      isActive={combatant.id === activeCombatantId}
                      isSelected={combatant.id === focusedCombatantId}
                      compact={compact}
                      onUpdate={patch => updateCombatant(combatant.id, patch)}
                      onRemove={() => removeCombatant(combatant.id)}
                      onToggleStatus={status => toggleStatus(combatant.id, status)}
                      onRedrawCard={() => redrawCard(combatant.id)}
                      onResolveRedraw={keepNew => resolveRedraw(combatant.id, keepNew)}
                      onSetActive={() => setActiveCombatantId(combatant.id)}
                      onEndTurn={advanceTurn}
                      onSelect={() =>
                        setFocusedCombatantId(
                          combatant.id === focusedCombatantId ? null : combatant.id,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Draggable divider */}
        <div
          className="w-1 shrink-0 bg-border hover:bg-primary/50 cursor-col-resize transition-colors relative group"
          onMouseDown={handleDividerMouseDown}
        >
          {/* Wider invisible hit area */}
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          {/* Drag handle dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
            {[0, 1, 2].map(i => (
              <div key={i} className="size-0.5 rounded-full bg-foreground" />
            ))}
          </div>
        </div>

        {/* Right: combatant detail card */}
        <div className="flex-1 min-w-0 border-l-0 flex flex-col min-h-0">
          {focusedCombatant ? (
            <CombatantCard
              combatant={focusedCombatant}
              onUpdate={patch => updateCombatant(focusedCombatant.id, patch)}
              onToggleStatus={status => toggleStatus(focusedCombatant.id, status)}
              allCombatants={sortedCombatants}
              onUpdateCombatant={(id, patch) => updateCombatant(id, patch)}
              isActive={focusedCombatant.id === activeCombatantId}
              onEndTurn={advanceTurn}
              onTakeHold={() => takeHold(focusedCombatant.id)}
            />
          ) : (
            <CombatantCardEmpty />
          )}
        </div>
      </div>

      {/* Add combatant dialog */}
      <AddCombatantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={addCombatant}
      />
    </div>
  )
}
