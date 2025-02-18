"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { X, GripVertical } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"

interface Player {
  id: string
  name: string
}

interface WaitingListProps {
  players: Player[]
  onAddPlayerAction: (name: string) => void
  onRemovePlayerAction: (index: number) => void
  onReorderPlayersAction: (newOrder: Player[]) => void
}

interface SortableItemProps {
  player: Player
  index: number
  onRemove: () => void
}

function SortableItem({ player, index, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: player.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li ref={setNodeRef} style={style} className="bg-dark-surface-lighter/60 backdrop-blur-md border border-dark-border/20 p-3 rounded-lg flex items-center gap-2 hover:border-brand-primary/50 hover:bg-dark-surface-light transition-all shadow-sm">
      <button className="touch-none p-1 text-text-tertiary hover:text-text-secondary" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-text-primary font-medium">
        {index + 1}. {player.name}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-text-tertiary hover:text-status-error hover:bg-status-error/10" 
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </li>
  )
}

export default function WaitingList({ players, onAddPlayerAction, onRemovePlayerAction, onReorderPlayersAction }: WaitingListProps) {
  const [newPlayer, setNewPlayer] = useState("")
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showClearListDialog, setShowClearListDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlayer.trim()) {
      onAddPlayerAction(newPlayer.trim())
      setNewPlayer("")
    }
  }

  const handleRemoveClick = (index: number) => {
    setSelectedPlayerIndex(index)
    setShowRemoveDialog(true)
  }

  const handleConfirmRemove = () => {
    if (selectedPlayerIndex !== null) {
      onRemovePlayerAction(selectedPlayerIndex)
    }
    setShowRemoveDialog(false)
    setSelectedPlayerIndex(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = players.findIndex(p => p.id === active.id)
      const newIndex = players.findIndex(p => p.id === over.id)
      const newOrder = arrayMove(players, oldIndex, newIndex)
      onReorderPlayersAction(newOrder)
    }
  }

  return (
    <div className="bg-dark-surface backdrop-blur-sm border border-[#2C2C2E] p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Wait list</h2>
        <Button onClick={handleSubmit} size="sm" className="bg-brand-primary hover:bg-brand-primary/90">
          +Add Player
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <Input
          type="text"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Player name"
          className="w-full bg-dark-surface border-dark-border text-text-primary placeholder:text-text-tertiary focus:border-brand-primary"
        />
      </form>

      <div className="flex justify-between items-center mb-2 ">
        <p className="text-sm font-semibold  text-text-secondary">Total: {players.length}</p>
        {players.length > 0 && (
          <button
            onClick={() => setShowClearListDialog(true)}
            className="text-sm text-status-error hover:text-status-error/80 transition-colors"
          >
            Clear list
          </button>
        )}
      </div>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1 max-h-[820px]  overflow-y-auto scrollbar-thin scrollbar-thumb-dark-border/20 scrollbar-track-dark-surface pr-2">
            {players.map((player, index) => (
              <SortableItem 
                key={player.id} 
                player={player} 
                index={index} 
                onRemove={() => handleRemoveClick(index)} 
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-dark-card border border-dark-border/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Remove Player from Waitlist</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure you want to remove {selectedPlayerIndex !== null && players[selectedPlayerIndex]?.name} from the waitlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-dark-surface text-text-primary hover:bg-dark-surface-lighter">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-status-error hover:bg-status-error/90">
              Yes, remove player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearListDialog} onOpenChange={setShowClearListDialog}>
        <AlertDialogContent className="bg-dark-card border border-dark-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Clear Waiting List</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure you want to remove all {players.length} players from the waiting list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-dark-surface text-text-primary hover:bg-dark-surface-lighter">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onReorderPlayersAction([]);
                setShowClearListDialog(false);
              }} 
              className="bg-status-error hover:bg-status-error/90"
            >
              Yes, clear list
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 