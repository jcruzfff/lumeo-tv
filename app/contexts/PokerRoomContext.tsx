'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Player {
  id: string;
  name: string;
}

export interface PokerRoomState {
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
  // Try to load initial state from localStorage
  const getInitialState = (): PokerRoomState => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('pokerRoomState');
        console.log('PokerRoomContext - Loading initial state from localStorage:', savedState);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          console.log('PokerRoomContext - Parsed initial state:', parsedState);
          return parsedState;
        }
      } catch (error) {
        console.error('Error loading initial poker room state:', error);
      }
    }
    console.log('PokerRoomContext - Using default initial state');
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

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;

    try {
      console.log('PokerRoomContext - Saving state to localStorage:', state);
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
    console.log('PokerRoomContext - Adding player to waitlist:', name);
    setState(prev => {
      const newState = {
        ...prev,
        waitingList: [...prev.waitingList, { id: uuidv4(), name }],
      };
      console.log('PokerRoomContext - New state after adding player:', newState);
      return newState;
    });
  };

  const removeFromWaitingList = (index: number) => {
    console.log('PokerRoomContext - Removing player at index:', index);
    setState(prev => {
      const newState = {
        ...prev,
        waitingList: prev.waitingList.filter((_, i) => i !== index),
      };
      console.log('PokerRoomContext - New state after removing player:', newState);
      return newState;
    });
  };

  const reorderWaitingList = (newOrder: Player[]) => {
    console.log('PokerRoomContext - Reordering waitlist:', newOrder);
    setState(prev => {
      const newState = {
        ...prev,
        waitingList: newOrder,
      };
      console.log('PokerRoomContext - New state after reordering:', newState);
      return newState;
    });
  };

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