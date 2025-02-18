"use client"

import { useState } from "react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
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
import { UserPlus } from "lucide-react"

interface Player {
  id: string
  name: string
}

interface PokerTableProps {
  seats: (Player | null)[]
  onAssignSeatAction: (index: number) => void
  onEmptySeatAction: (index: number) => void
}

export default function PokerTable({ seats, onAssignSeatAction, onEmptySeatAction }: PokerTableProps) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null)
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
    const angle = (index * 2 * Math.PI) / totalSpots
    return {
      top: `${50 - 35 * Math.cos(angle)}%`,
      left: `${50 + 35 * Math.sin(angle)}%`,
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative w-full h-0 pb-[100%] z-0">
        <div className="absolute inset-0 bg-green-600/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
          <div className="w-[80%] h-[60%] bg-green-700/90 backdrop-blur-sm rounded-[100px] flex flex-col items-center justify-center border border-white/10">
            <span className="text-white/90 text-base font-medium">Poker Table</span>
          </div>

          {/* Dealer Position (D) */}
          <div
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold bg-dark-background/90 text-text-primary border border-dark-border/20 shadow-lg backdrop-blur-sm z-10"
            style={{
              top: "15%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            D
          </div>

          {/* Player Seats */}
          {seats.map((player, index) => {
            // Calculate position starting from right of dealer (add 1 to index for display)
            const position = getPosition(index + 1);
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 shadow-lg backdrop-blur-sm z-20 ${
                      player
                        ? hoveredSeat === index
                          ? "bg-status-error/90 text-white border border-white/10"
                          : "bg-brand-primary/90 text-white border border-white/10"
                        : "bg-dark-surface/90 border border-dark-border/20 hover:bg-dark-surface-lighter/90"
                    }`}
                    style={{
                      ...position,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => player && setHoveredSeat(index)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    onClick={() => player ? handleRemoveSeat(index) : onAssignSeatAction(index)}
                  >
                    {player ? (
                      index + 1
                    ) : (
                      <UserPlus className="h-3 w-3 text-text-secondary" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5} className="bg-dark-card border border-dark-border/20 text-text-primary z-[9999] relative">
                  {player ? (
                    <p>Seat {index + 1}: {player.name} (Click to remove)</p>
                  ) : (
                    <p>Click to assign next player to seat {index + 1}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-dark-card border border-dark-border/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Remove Player</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure you want to remove {selectedSeat !== null && seats[selectedSeat]?.name} from seat {selectedSeat !== null ? selectedSeat + 1 : ''}?
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