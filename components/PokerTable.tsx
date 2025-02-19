import React from 'react';
import { User } from 'lucide-react';

interface Player {
  id: string;
  name: string;
}

interface PokerTableProps {
  seats: (Player | null)[];
  onAssignSeatAction: (seatIndex: number) => void;
  onEmptySeatAction: (seatIndex: number) => void;
}

export function PokerTable({ seats, onAssignSeatAction, onEmptySeatAction }: PokerTableProps) {
  // Calculate positions for 9 seats around an oval table
  const seatPositions = [
    { top: '0%', left: '50%', transform: 'translate(-50%, 0)' },           // Top center
    { top: '15%', left: '85%', transform: 'translate(-50%, -50%)' },      // Top right
    { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },     // Middle right
    { top: '85%', left: '85%', transform: 'translate(-50%, -50%)' },      // Bottom right
    { top: '100%', left: '50%', transform: 'translate(-50%, -100%)' },    // Bottom center
    { top: '85%', left: '15%', transform: 'translate(-50%, -50%)' },      // Bottom left
    { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },       // Middle left
    { top: '15%', left: '15%', transform: 'translate(-50%, -50%)' },      // Top left
    { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },      // Dealer (center)
  ];

  return (
    <div className="w-full h-full relative">
      {/* Table outline */}
      <div 
        className="absolute inset-[15%] bg-[#1B4332] border-4 border-[#2D6A4F] rounded-[50%]"
        style={{ transform: 'rotate(45deg)' }}
      />
      
      {/* Seats */}
      {seats.map((player, index) => (
        <div
          key={index}
          className="absolute"
          style={seatPositions[index]}
        >
          <button
            onClick={() => player ? onEmptySeatAction(index) : onAssignSeatAction(index)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${player 
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90' 
                : 'bg-dark-surface border border-[#2C2C2E] text-text-secondary hover:border-brand-primary'
              }
              transition-colors
            `}
            title={player ? player.name : 'Empty Seat'}
          >
            <User size={20} />
          </button>
        </div>
      ))}
    </div>
  );
} 