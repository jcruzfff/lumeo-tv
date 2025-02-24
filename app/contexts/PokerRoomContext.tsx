'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Table, Player } from '@/app/types/events';

export interface PokerRoomState {
  tables: Table[];
  waitingList: Player[];
  showRoomInfo: boolean;
  isRoomManagementEnabled: boolean;
  showWaitlistOnDisplay: boolean;
}

interface PokerRoomContextType extends PokerRoomState {
  setState: (state: PokerRoomState) => void;
  addTable: (eventId: string) => void;
  removeTable: (tableId: string) => void;
  assignSeat: (tableId: string, seatIndex: number) => void;
  emptySeat: (tableId: string, seatIndex: number) => void;
  addToWaitlist: (eventId: string, name: string) => void;
  removeFromWaitlist: (index: number) => void;
  reorderWaitlist: (newOrder: Player[]) => void;
  toggleRoomInfo: () => void;
  setIsRoomManagementEnabled: (enabled: boolean) => void;
  setShowWaitlistOnDisplay: (show: boolean) => void;
}

const PokerRoomContext = createContext<PokerRoomContextType | undefined>(undefined);

export function PokerRoomProvider({ children }: { children: React.ReactNode }) {
  const getInitialState = (): PokerRoomState => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('pokerRoomState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Only log invalid data that needs attention
          if (Array.isArray(parsedState.waitingList)) {
            const invalidPlayers = parsedState.waitingList.filter(
              (player: Player) => !player.id || !player.name || typeof player.position !== 'number'
            );
            if (invalidPlayers.length > 0) {
              console.error('PokerRoomContext - Found invalid players in waitlist:', invalidPlayers);
            }
          }

          return {
            tables: Array.isArray(parsedState.tables) ? parsedState.tables : [],
            waitingList: Array.isArray(parsedState.waitingList) ? parsedState.waitingList : [],
            showRoomInfo: parsedState.showRoomInfo ?? true,
            isRoomManagementEnabled: parsedState.isRoomManagementEnabled ?? false,
            showWaitlistOnDisplay: parsedState.showWaitlistOnDisplay ?? false,
          };
        }
      } catch (error) {
        console.error('Error loading initial poker room state:', error);
      }
    }
    return {
      tables: [],
      waitingList: [],
      showRoomInfo: true,
      isRoomManagementEnabled: false,
      showWaitlistOnDisplay: false,
    };
  };

  const [state, setState] = useState<PokerRoomState>(getInitialState);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    try {
      console.log('PokerRoomContext - Saving state to localStorage:', state);
      localStorage.setItem('pokerRoomState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving poker room state:', error);
    }
  }, [state, isClient]);

  const addTable = useCallback((eventId: string) => {
    setState((prev) => {
      const newTable: Table = {
        id: crypto.randomUUID(),
        eventId,
        number: prev.tables.length + 1,
        seats: Array(9).fill(null).map((_, i) => ({
          id: crypto.randomUUID(),
          tableId: '',  // Will be set after table creation
          position: i,
          playerId: null,
          playerName: null,
          createdAt: new Date().toISOString()
        })),
        createdAt: new Date().toISOString()
      };
      
      // Update the tableId for each seat
      newTable.seats = newTable.seats.map(seat => ({
        ...seat,
        tableId: newTable.id
      }));

      return {
        ...prev,
        tables: [...prev.tables, newTable]
      };
    });
  }, []);

  const removeTable = useCallback((tableId: string) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.filter((table) => table.id !== tableId)
    }));
  }, []);

  const assignSeat = useCallback((tableId: string, seatIndex: number) => {
    setState((prev) => {
      if (prev.waitingList.length === 0) return prev;

      const [nextPlayer, ...remainingPlayers] = prev.waitingList;
      const updatedTables = prev.tables.map((table) => {
        if (table.id === tableId) {
          const updatedSeats = [...table.seats];
          updatedSeats[seatIndex] = {
            ...updatedSeats[seatIndex],
            playerId: nextPlayer.id,
            playerName: nextPlayer.name
          };
          return { ...table, seats: updatedSeats };
        }
        return table;
      });

      return {
        ...prev,
        tables: updatedTables,
        waitingList: remainingPlayers
      };
    });
  }, []);

  const emptySeat = useCallback((tableId: string, seatIndex: number) => {
    setState((prev) => {
      const updatedTables = prev.tables.map((table) => {
        if (table.id === tableId) {
          const updatedSeats = [...table.seats];
          updatedSeats[seatIndex] = {
            ...updatedSeats[seatIndex],
            playerId: null,
            playerName: null
          };
          return { ...table, seats: updatedSeats };
        }
        return table;
      });

      return {
        ...prev,
        tables: updatedTables
      };
    });
  }, []);

  const addToWaitlist = useCallback((eventId: string, name: string) => {
    setState((prev) => {
      // Validate required fields according to PROMPT.md
      if (!eventId || !name.trim()) {
        console.error('Invalid player data: eventId and name are required');
        return prev;
      }

      // Find the highest position in the current waitlist
      const highestPosition = prev.waitingList.reduce((max, player) => 
        Math.max(max, player.position), -1);

      // Capitalize first letter of each word
      const capitalizedName = name.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const newPlayer: Player = {
        id: crypto.randomUUID(),
        eventId: eventId,
        name: capitalizedName,
        position: highestPosition + 1, // Always add to the end
        addedAt: new Date().toISOString()
      };

      const updatedWaitlist = [...prev.waitingList, newPlayer];

      return {
        ...prev,
        waitingList: updatedWaitlist
      };
    });
  }, []);

  const removeFromWaitlist = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      waitingList: prev.waitingList.filter((_, i) => i !== index)
    }));
  }, []);

  const reorderWaitlist = useCallback((newOrder: Player[]) => {
    setState((prev) => ({
      ...prev,
      waitingList: newOrder.map((player, index) => ({
        ...player,
        position: index
      }))
    }));
  }, []);

  const toggleRoomInfo = () => {
    setState(prev => ({
      ...prev,
      showRoomInfo: !prev.showRoomInfo,
    }));
  };

  const setIsRoomManagementEnabled = (enabled: boolean) => {
    console.log('PokerRoomContext - Setting room management enabled:', enabled);
    setState(prev => {
      const newState = {
        ...prev,
        isRoomManagementEnabled: enabled,
        showWaitlistOnDisplay: enabled ? prev.showWaitlistOnDisplay : false,
      };
      console.log('PokerRoomContext - New state after setting room management:', newState);
      return newState;
    });
  };

  const setShowWaitlistOnDisplay = (show: boolean) => {
    console.log('PokerRoomContext - Setting show waitlist on display:', show);
    setState(prev => {
      const newState = {
        ...prev,
        showWaitlistOnDisplay: show,
      };
      console.log('PokerRoomContext - New state after setting show waitlist:', newState);
      return newState;
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <PokerRoomContext.Provider
      value={{
        ...state,
        setState,
        addTable,
        removeTable,
        assignSeat,
        emptySeat,
        addToWaitlist,
        removeFromWaitlist,
        reorderWaitlist,
        toggleRoomInfo,
        setIsRoomManagementEnabled,
        setShowWaitlistOnDisplay,
      }}
    >
      {children}
    </PokerRoomContext.Provider>
  );
}

export function usePokerRoom() {
  const context = useContext(PokerRoomContext);
  if (context === undefined) {
    throw new Error('usePokerRoom must be used within a PokerRoomProvider');
  }
  return context;
} 