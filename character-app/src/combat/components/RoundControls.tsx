import { useState } from 'react'
import { ChevronRight, RotateCcw, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'

interface RoundControlsProps {
  round: number
  jokerDrawnThisRound: boolean
  hasCombatants: boolean
  onDealCards: () => void
  onNextRound: () => void
  onResetCombat: () => void
}

export function RoundControls({
  round,
  jokerDrawnThisRound,
  hasCombatants,
  onDealCards,
  onNextRound,
  onResetCombat,
}: RoundControlsProps) {
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Round counter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Раунд {round}</span>
        {jokerDrawnThisRound && (
          <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40 text-xs px-1.5 py-0">
            Джокер!
          </Badge>
        )}
      </div>

      <Separator orientation="vertical" className="h-5 hidden sm:block" />

      {/* Deal cards */}
      <Button
        size="sm"
        variant="outline"
        disabled={!hasCombatants}
        onClick={onDealCards}
        className="gap-1.5"
      >
        <Shuffle className="size-3.5" />
        Раздать карты
      </Button>

      {/* Next round */}
      <Button
        size="sm"
        disabled={!hasCombatants}
        onClick={onNextRound}
        className="gap-1.5"
      >
        <ChevronRight className="size-3.5" />
        Следующий раунд
      </Button>

      {/* Reset combat */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={!hasCombatants}
            className="gap-1.5 text-muted-foreground hover:text-foreground ml-auto"
          >
            <RotateCcw className="size-3.5" />
            Завершить бой
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить бой?</AlertDialogTitle>
            <AlertDialogDescription>
              Карты инициативы и статусы будут сброшены. Ранения, усталость и фишки
              участников сохранятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onResetCombat}>Завершить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
