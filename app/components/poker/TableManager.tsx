"use client"

import PokerTable from "./PokerTable"
import { Button } from "../../components/ui/button"
import { X } from "lucide-react"
import { Player } from '../../contexts/PokerRoomContext'
import { useState } from "react"

interface TableManagerProps {
  tables: { id: number; seats: (Player | null)[] }[]
  onAssignSeatAction: (tableId: number, seatIndex: number) => void
  onEmptySeatAction: (tableId: number, seatIndex: number) => void
  onRemoveTableAction: (tableId: number) => void
}

export default function TableManager({ tables, onAssignSeatAction, onEmptySeatAction, onRemoveTableAction }: TableManagerProps) {
  const [activeTable, setActiveTable] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {tables.map((table, index) => {
        const availableSeats = table.seats.filter((seat) => seat === null).length
        const totalSeats = table.seats.length

        return (
          <div 
            key={table.id} 
            className={`bg-dark-surface backdrop-blur-md border border-dark-border/20 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all relative ${
              activeTable === table.id ? 'z-50' : 'z-0'
            }`}
            onMouseEnter={() => setActiveTable(table.id)}
            onMouseLeave={() => setActiveTable(null)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Table {index + 1}</h3>
                <p className="text-text-secondary text-sm">
                  {availableSeats}/{totalSeats} seats available
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 text-text-secondary hover:text-status-error hover:bg-status-error/10"
                onClick={() => onRemoveTableAction(table.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-dark-background/50 backdrop-blur-sm p-2 rounded-xl">
              <PokerTable
                seats={table.seats}
                onAssignSeatAction={(seatIndex) => onAssignSeatAction(table.id, seatIndex)}
                onEmptySeatAction={(seatIndex) => onEmptySeatAction(table.id, seatIndex)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
} 