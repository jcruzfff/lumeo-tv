import { Table } from '@/app/types/events';
import PokerTable from './PokerTable';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface TableGridProps {
  tables: Table[];
  onAssignSeat: (tableId: string, seatIndex: number) => void;
  onEmptySeat: (tableId: string, seatIndex: number) => void;
  onRemoveTable: (tableId: string) => void;
}

export default function TableGrid({
  tables,
  onAssignSeat,
  onEmptySeat,
  onRemoveTable
}: TableGridProps) {
  const [activeTable, setActiveTable] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table) => {
        const totalSeats = table.seats.length;
        const availableSeats = table.seats.filter(seat => !seat.playerId).length;

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
                <h3 className="text-[16px] font-semibold text-text-primary">Table {table.number}</h3>
                <p className="text-text-secondary text-[12px]">
                  {availableSeats}/{totalSeats} seats available
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 text-text-secondary hover:text-status-error hover:bg-status-error/10"
                onClick={() => onRemoveTable(table.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-dark-background/50 backdrop-blur-sm p-2 rounded-xl">
              <PokerTable
                seats={table.seats}
                onAssignSeatAction={(seatIndex) => onAssignSeat(table.id, seatIndex)}
                onEmptySeatAction={(seatIndex) => onEmptySeat(table.id, seatIndex)}
              />
            </div>
          </div>
        )
      })}
    </div>
  );
} 