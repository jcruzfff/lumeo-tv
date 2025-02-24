"use client"

import { Seat } from '@/app/types/events'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog"

interface PokerTableProps {
  seats: Seat[]
  onAssignSeatAction: (index: number) => void
  onEmptySeatAction: (index: number) => void
}

export default function PokerTable({
  seats,
  onAssignSeatAction,
  onEmptySeatAction
}: PokerTableProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  const handleRemoveSeat = (index: number) => {
    setSelectedSeat(index)
    setShowRemoveDialog(true)
  }

  const handleConfirmRemove = () => {
    if (selectedSeat !== null) {
      onEmptySeatAction(selectedSeat)
    }
    setShowRemoveDialog(false)
    setSelectedSeat(null)
  }

  // Calculate positions for 10 spots (9 players + 1 dealer)
  const getPosition = (index: number, totalSpots: number = 10) => {
    // Start from the top (12 o'clock) and go clockwise
    const angle = (index * 2 * Math.PI) / totalSpots - Math.PI / 2
    return {
      top: `${50 + 40 * Math.sin(angle)}%`,
      left: `${50 + 40 * Math.cos(angle)}%`,
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative w-full h-0 pb-[100%] z-0">
        <div className="absolute inset-0 bg-[#1B4D2E] backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl border border-[#2C2C2E]">
          <div className="w-[80%] h-[60%] bg-[#1B4D2E] backdrop-blur-sm rounded-[100px] flex flex-col items-center justify-center border border-[#2C2C2E]">
            <span className="text-white/90 text-base font-medium">Poker Table</span>
          </div>

          {/* Dealer Position (D) */}
          <div
            className="absolute w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold bg-dark-background/90 text-white border-2 border-white shadow-lg backdrop-blur-sm z-10"
            style={{
              top: "10%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            D
          </div>

          {/* Player Seats */}
          {seats.map((seat, index) => {
            const isOccupied = Boolean(seat.playerId && seat.playerName)
            // Calculate position starting from right of dealer
            const position = getPosition(index + 1)
            
            return (
              <Tooltip key={seat.id}>
                <TooltipTrigger asChild>
                  <button
                    className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-200 shadow-lg backdrop-blur-sm z-20 ${
                      isOccupied
                        ? "bg-brand-primary text-white border-2 border-white hover:bg-status-error"
                        : "bg-dark-surface/90 border-2 border-[#2C2C2E] hover:bg-dark-surface-lighter/90 hover:border-white/50"
                    }`}
                    style={{
                      ...position,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => isOccupied ? handleRemoveSeat(index) : onAssignSeatAction(index)}
                  >
                    {isOccupied ? (
                      index + 1
                    ) : (
                      <UserPlus className="h-4 w-4 text-text-secondary" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5} className="bg-dark-card border border-dark-border/20 text-text-primary z-[9999] relative">
                  {isOccupied ? (
                    <p>Remove {seat.playerName}</p>
                  ) : (
                    <p>Assign Seat {index + 1}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-dark-card border border-dark-border/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Remove Player</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure you want to remove {selectedSeat !== null && seats[selectedSeat]?.playerName} from seat {selectedSeat !== null ? selectedSeat + 1 : ''}?
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
    </TooltipProvider>
  )
} 