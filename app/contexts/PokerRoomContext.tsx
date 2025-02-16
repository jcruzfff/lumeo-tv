'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Player {
  id: string;
  name: string;
}

interface PokerRoomState {
  tables: { id: number; seats: (Player | null)[] }[];
  waitingList: Player[];
  showRoomInfo: boolean;
  isRoomManagementEnabled: boolean;
  showWaitlistOnDisplay: boolean;
}

interface PokerRoomContextType extends PokerRoomState {
  addTable: () => void;
  removeTable: (tableId: number) => void;
  assignSeat: (tableId: number, seatIndex: number) => void;
  emptySeat: (tableId: number, seatIndex: number) => void;
  addToWaitingList: (name: string) => void;
  removeFromWaitingList: (index: number) => void;
  reorderWaitingList: (newOrder: Player[]) => void;
  toggleRoomInfo: () => void;
  setIsRoomManagementEnabled: (enabled: boolean) => void;
  setShowWaitlistOnDisplay: (show: boolean) => void;
  setState: (state: PokerRoomState) => void;
}

const PokerRoomContext = createContext<PokerRoomContextType | undefined>(undefined);

export function PokerRoomProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PokerRoomState>({
    tables: [],
    waitingList: [],
    showRoomInfo: true,
    isRoomManagementEnabled: false,
    showWaitlistOnDisplay: false,
  });
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedState = localStorage.getItem('pokerRoomState');
      if (savedState) {
        setState(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Error loading poker room state:', error);
    }
  }, [isClient]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem('pokerRoomState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving poker room state:', error);
    }
  }, [state, isClient]);

  const addTable = () => {
    setState(prev => ({
      ...prev,
      tables: [...prev.tables, { id: Date.now(), seats: Array(9).fill(null) }],
    }));
  };

  const removeTable = (tableId: number) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.filter(table => table.id !== tableId),
    }));
  };

  const assignSeat = (tableId: number, seatIndex: number) => {
    if (state.waitingList.length === 0) return;

    setState(prev => {
      const nextPlayer = prev.waitingList[0];
      const newTables = prev.tables.map(table => {
        if (table.id === tableId) {
          const newSeats = [...table.seats];
          newSeats[seatIndex] = nextPlayer;
          return { ...table, seats: newSeats };
        }
        return table;
      });

      return {
        ...prev,
        tables: newTables,
        waitingList: prev.waitingList.slice(1),
      };
    });
  };

  const emptySeat = (tableId: number, seatIndex: number) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table => {
        if (table.id === tableId) {
          const newSeats = [...table.seats];
          newSeats[seatIndex] = null;
          return { ...table, seats: newSeats };
        }
        return table;
      }),
    }));
  };

  const addToWaitingList = (name: string) => {
    setState(prev => ({
      ...prev,
      waitingList: [...prev.waitingList, { id: uuidv4(), name }],
    }));
  };

  const removeFromWaitingList = (index: number) => {
    setState(prev => ({
      ...prev,
      waitingList: prev.waitingList.filter((_, i) => i !== index),
    }));
  };

  const reorderWaitingList = (newOrder: Player[]) => {
    setState(prev => ({
      ...prev,
      waitingList: newOrder,
    }));
  };

  const toggleRoomInfo = () => {
    setState(prev => ({
      ...prev,
      showRoomInfo: !prev.showRoomInfo,
    }));
  };

  const setIsRoomManagementEnabled = (enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isRoomManagementEnabled: enabled,
      showWaitlistOnDisplay: enabled ? prev.showWaitlistOnDisplay : false,
    }));
  };

  const setShowWaitlistOnDisplay = (show: boolean) => {
    setState(prev => ({
      ...prev,
      showWaitlistOnDisplay: show,
    }));
  };

  if (!isClient) {
    return null;
  }

  return (
    <PokerRoomContext.Provider
      value={{
        ...state,
        addTable,
        removeTable,
        assignSeat,
        emptySeat,
        addToWaitingList,
        removeFromWaitingList,
        reorderWaitingList,
        toggleRoomInfo,
        setIsRoomManagementEnabled,
        setShowWaitlistOnDisplay,
        setState,
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