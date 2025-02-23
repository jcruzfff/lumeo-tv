"use client"

import { Player } from '@/app/types/poker'

interface DisplayWaitingListProps {
  players: Player[];
}

export default function DisplayWaitingList({ players }: DisplayWaitingListProps) {
  return (
    <div className="bg-dark-surface backdrop-blur-sm border border-[#2C2C2E] p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Wait list</h2>
        <span className="text-sm font-semibold text-text-secondary">Total: {players.length}</span>
      </div>
      
      <ul className="space-y-1 max-h-[820px] overflow-y-auto scrollbar-thin scrollbar-thumb-dark-border/20 scrollbar-track-dark-surface pr-2">
        {players.map((player, index) => (
          <li 
            key={player.id}
            className="bg-dark-surface-lighter/60 backdrop-blur-md border border-dark-border/20 p-3 rounded-lg flex items-center gap-2"
          >
            <span className="flex-1 text-text-primary font-medium">
              {index + 1}. {player.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
} 