"use client"

import { Button } from "../ui/button"
import { X, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Player } from '@/app/types/poker'

interface SortableItemProps {
  player: Player
  index: number
  onRemove: () => void
}

export function SortableItem({ player, index, onRemove }: SortableItemProps) {
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