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
    <li ref={setNodeRef} style={style} className="bg-gray-50 p-3 rounded flex items-center gap-2">
      <button className="touch-none p-1 text-gray-400" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-gray-900">
        {index + 1}. {player.name}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-gray-400 hover:text-gray-600" 
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
    <div className="bg-white modern-card p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Wait list</h2>
        <Button onClick={handleSubmit} size="sm" className="bg-[#12C4E7] hover:bg-[#10B3D3]">
          Add Player
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <Input
          type="text"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Player name"
          className="w-full"
        />
      </form>

      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold">Total: {players.length}</p>
        {players.length > 0 && (
          <button
            onClick={() => setShowClearListDialog(true)}
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            Clear list
          </button>
        )}
      </div>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1 max-h-[440px] overflow-y-auto">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player from Waitlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedPlayerIndex !== null && players[selectedPlayerIndex]?.name} from the waitlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-red-500 hover:bg-red-600">
              Yes, remove player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearListDialog} onOpenChange={setShowClearListDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Waiting List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all {players.length} players from the waiting list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onReorderPlayersAction([]);
                setShowClearListDialog(false);
              }} 
              className="bg-red-500 hover:bg-red-600"
            >
              Yes, clear list
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 