import { useState, useCallback, useEffect } from 'react';
import type { Event, Player, Table } from '@/app/types/events';
import { isBasketballSettings } from '@/app/types/events';
import { usePokerRoom } from '../contexts/PokerRoomContext';
import { useEventPolling } from './useEventPolling';

interface UseEventManagementProps {
  eventId: string;
  initialEvent?: Event | null;
}

interface TableSeat {
  id: string;
  position: number;
  playerId?: string;
  playerName?: string;
}

export function useEventManagement({ eventId, initialEvent }: UseEventManagementProps) {
  const [event, setEvent] = useState<Event | null>(initialEvent || null);
  const [isLoading, setIsLoading] = useState(!initialEvent);
  const [error, setError] = useState<string | null>(null);
  const { setState: setPokerRoomState } = usePokerRoom();
  
  // Initialize polling for updates
  useEventPolling(eventId);

  // Effect to sync event state with PokerRoom context
  useEffect(() => {
    if (event) {
      console.log('[EventManagement] Syncing event state with PokerRoom context:', {
        tablesCount: event.tables.length,
        waitlistCount: event.waitingList.length
      });
      setPokerRoomState({
        tables: event.tables,
        waitingList: event.waitingList,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });
    }
  }, [event, setPokerRoomState]);

  // Initial event setup
  useEffect(() => {
    if (initialEvent) {
      setEvent(initialEvent);
    }
  }, [initialEvent]);

  // Timer Controls
  const toggleTimer = useCallback(async () => {
    try {
      if (!event) return;
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            ...event.settings,
            isRunning: !event.settings.isRunning
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle timer');
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle timer');
    } finally {
      setIsLoading(false);
    }
  }, [event, eventId]);

  // Waiting List Management
  const addPlayer = useCallback(async (name: string) => {
    if (!event) return;

    try {
      console.log('[EventManagement] Adding player:', { name, eventId });

      // Calculate the next position for optimistic update
      const nextPosition = event.waitingList.length > 0
        ? Math.max(...event.waitingList.map(p => p.position)) + 1
        : 1;

      // Create optimistic player
      const optimisticPlayer = {
        id: `temp-${Date.now()}`, // temporary ID that will be replaced
        name: name.trim(),
        position: nextPosition,
        eventId,
        addedAt: new Date().toISOString()
      };

      // Optimistically update the UI
      const optimisticWaitlist = [...event.waitingList, optimisticPlayer];
      console.log('[EventManagement] Optimistically updating waitlist:', optimisticWaitlist);

      setPokerRoomState({
        tables: event.tables,
        waitingList: optimisticWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: optimisticWaitlist
        };
      });

      // Make the API call
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // If the API call fails, revert to the original state
        console.log('[EventManagement] API call failed, reverting state');
        setPokerRoomState({
          tables: event.tables,
          waitingList: event.waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled: true,
          showWaitlistOnDisplay: true
        });

        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            waitingList: event.waitingList
          };
        });
        throw new Error(data.error || 'Failed to add player');
      }

      // Update with the server response to ensure consistency
      const serverWaitlist = data.waitingList as Player[];
      console.log('[EventManagement] Updating state with server waitlist:', serverWaitlist);

      setPokerRoomState({
        tables: event.tables,
        waitingList: serverWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: serverWaitlist
        };
      });

      console.log('[EventManagement] State updated successfully');
    } catch (error) {
      console.error('[EventManagement] Error adding player:', error);
      setError(error instanceof Error ? error.message : 'Failed to add player');
    }
  }, [event, eventId, setPokerRoomState]);

  const removePlayer = useCallback(async (playerId: string) => {
    if (!event) return;

    try {
      console.log('[EventManagement] Removing player:', { playerId, eventId });
      
      // Optimistically update the UI first
      const optimisticWaitlist = event.waitingList.filter(p => p.id !== playerId);
      console.log('[EventManagement] Optimistically updating waitlist:', optimisticWaitlist);
      
      setPokerRoomState({
        tables: event.tables,
        waitingList: optimisticWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: optimisticWaitlist
        };
      });
      
      // Then make the API call
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId })
      });

      const data = await response.json();
      console.log('[EventManagement] Remove player response:', data);

      if (!response.ok) {
        // If the API call fails, revert to the original state
        console.log('[EventManagement] API call failed, reverting state');
        setPokerRoomState({
          tables: event.tables,
          waitingList: event.waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled: true,
          showWaitlistOnDisplay: true
        });

        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            waitingList: event.waitingList
          };
        });
        throw new Error(data.error || 'Failed to remove player');
      }

      // Update with the server response to ensure consistency
      const newWaitlist = data.waitingList as Player[];
      console.log('[EventManagement] Updating state with server waitlist:', newWaitlist);

      setPokerRoomState({
        tables: event.tables,
        waitingList: newWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: newWaitlist
        };
      });

      console.log('[EventManagement] State updated successfully');
    } catch (error) {
      console.error('[EventManagement] Error removing player:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove player');
    }
  }, [event, eventId, setPokerRoomState]);

  const reorderWaitlist = useCallback(async (playerId: string, newPosition: number) => {
    try {
      console.log('[EventManagement] Reordering waitlist:', { playerId, newPosition, currentEvent: event });
      setIsLoading(true);

      if (!event) {
        throw new Error('No event data available');
      }

      // Optimistically update the UI
      const player = event.waitingList.find(p => p.id === playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      const oldPosition = player.position;
      const optimisticWaitlist = [...event.waitingList];
      
      // Remove player from old position
      const playerToMove = optimisticWaitlist.splice(oldPosition - 1, 1)[0];
      // Insert at new position
      optimisticWaitlist.splice(newPosition - 1, 0, playerToMove);
      
      // Update positions for all players
      const reorderedWaitlist = optimisticWaitlist.map((p, idx) => ({
        ...p,
        position: idx + 1
      }));

      console.log('[EventManagement] Optimistic update:', {
        oldPosition,
        newPosition,
        reorderedWaitlist
      });

      // Update UI optimistically
      setPokerRoomState({
        tables: event.tables,
        waitingList: reorderedWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: reorderedWaitlist
        };
      });

      // Make the API call
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId, newPosition })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder waitlist');
      }

      const data = await response.json();
      console.log('[EventManagement] Server response:', data);

      // Update with the server response to ensure consistency
      const serverWaitlist = data.waitingList as Player[];
      
      setPokerRoomState({
        tables: event.tables,
        waitingList: serverWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: serverWaitlist
        };
      });

      return serverWaitlist;
    } catch (error) {
      console.error('[EventManagement] Error reordering waitlist:', error);
      
      // Revert to original state on error
      if (event) {
        setPokerRoomState({
          tables: event.tables,
          waitingList: event.waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled: true,
          showWaitlistOnDisplay: true
        });

        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            waitingList: event.waitingList
          };
        });
      }
      
      setError(error instanceof Error ? error.message : 'Failed to reorder waitlist');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [event, eventId, setPokerRoomState]);

  // Table Management
  const addTable = useCallback(async () => {
    try {
      if (!event) return;
      console.log('[EventManagement] Adding new table');

      // Calculate the next table number
      const nextTableNumber = event.tables.length > 0
        ? Math.max(...event.tables.map(t => t.number)) + 1
        : 1;

      // Create optimistic table with empty seats
      const optimisticTable = {
        id: `temp-${Date.now()}`,
        eventId,
        number: nextTableNumber,
        createdAt: new Date().toISOString(),
        seats: Array.from({ length: 9 }).map((_, i) => ({
          id: `temp-seat-${i}`,
          tableId: `temp-${Date.now()}`,
          position: i + 1,
          playerId: null,
          playerName: null,
          createdAt: new Date().toISOString()
        }))
      } as Table;

      // Create optimistic tables array
      const optimisticTables = [...event.tables, optimisticTable];
      console.log('[EventManagement] Optimistically updating tables:', optimisticTables);

      // Update UI optimistically
      setPokerRoomState({
        tables: optimisticTables,
        waitingList: event.waitingList,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tables: optimisticTables
        };
      });

      // Make the API call
      const response = await fetch(`/api/events/${eventId}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If the API call fails, revert to the original state
        console.log('[EventManagement] API call failed, reverting state');
        setPokerRoomState({
          tables: event.tables,
          waitingList: event.waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled: true,
          showWaitlistOnDisplay: true
        });

        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tables: event.tables
          };
        });
        throw new Error('Failed to add table');
      }

      const data = await response.json();
      console.log('[EventManagement] Server response:', data);

      // Update with the server response to ensure consistency
      const updatedTables = [...event.tables.filter(t => t.id !== optimisticTable.id), data];
      updatedTables.sort((a, b) => a.number - b.number);

      setPokerRoomState({
        tables: updatedTables,
        waitingList: event.waitingList,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tables: updatedTables
        };
      });

      console.log('[EventManagement] State updated successfully');
    } catch (error) {
      console.error('[EventManagement] Error adding table:', error);
      setError(error instanceof Error ? error.message : 'Failed to add table');
    }
  }, [event, eventId, setPokerRoomState]);

  const removeTable = useCallback(async (tableId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/tables`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove table');
      }

      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.filter((table) => table.id !== tableId)
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove table');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const updateTableSeats = useCallback(async (tableId: string, seats: TableSeat[]) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/tables`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableId, seats })
      });

      if (!response.ok) {
        throw new Error('Failed to update table seats');
      }

      const updatedTable = await response.json();
      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map((table) =>
            table.id === tableId ? updatedTable : table
          )
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update table seats');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Score Management (Basketball)
  const updateScore = useCallback(async (team: 'home' | 'away', points: number) => {
    try {
      if (!event) return;
      setIsLoading(true);

      // Type guard for basketball settings
      if (event.type !== 'BASKETBALL' || !isBasketballSettings(event.settings)) {
        throw new Error('Invalid event type or settings for basketball score update');
      }

      const currentScore = team === 'home' ? event.settings.homeScore : event.settings.awayScore;
      const newScore = Math.max(0, currentScore + points);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            ...event.settings,
            homeScore: team === 'home' ? newScore : event.settings.homeScore,
            awayScore: team === 'away' ? newScore : event.settings.awayScore
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update score');
    } finally {
      setIsLoading(false);
    }
  }, [event, eventId]);

  // End Event
  const endEvent = useCallback(async () => {
    try {
      if (!event) return;
      setIsLoading(true);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ENDED',
          endedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to end event');
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to end event');
    } finally {
      setIsLoading(false);
    }
  }, [event, eventId]);

  const assignSeat = useCallback(async (tableId: string, seatIndex: number) => {
    try {
      if (!event) return;
      console.log('[EventManagement] Assigning seat:', { tableId, seatIndex, eventId });

      // Get the next player from the waiting list
      const nextPlayer = event.waitingList[0];
      if (!nextPlayer) {
        console.log('[EventManagement] No players in waiting list');
        return;
      }

      // Create optimistic table update
      const optimisticTables = event.tables.map(table => {
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

      // Create optimistic waitlist (remove assigned player)
      const optimisticWaitlist = event.waitingList.slice(1);

      console.log('[EventManagement] Optimistically updating table and waitlist:', {
        tables: optimisticTables,
        waitlist: optimisticWaitlist
      });

      // Update UI optimistically
      setPokerRoomState({
        tables: optimisticTables,
        waitingList: optimisticWaitlist,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tables: optimisticTables,
          waitingList: optimisticWaitlist
        };
      });

      // Make the API call
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}/seats/${seatIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId: nextPlayer.id })
      });

      if (!response.ok) {
        // If the API call fails, revert to the original state
        console.log('[EventManagement] API call failed, reverting state');
        setPokerRoomState({
          tables: event.tables,
          waitingList: event.waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled: true,
          showWaitlistOnDisplay: true
        });

        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tables: event.tables,
            waitingList: event.waitingList
          };
        });
        throw new Error('Failed to assign seat');
      }

      const data = await response.json();
      console.log('[EventManagement] Server response:', data);

      // Update with the server response to ensure consistency
      setPokerRoomState({
        tables: data.tables,
        waitingList: data.waitingList,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tables: data.tables,
          waitingList: data.waitingList
        };
      });

      console.log('[EventManagement] State updated successfully');
    } catch (error) {
      console.error('[EventManagement] Error assigning seat:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign seat');
    }
  }, [event, eventId, setPokerRoomState]);

  const emptySeat = useCallback(async (tableId: string, seatIndex: number) => {
    try {
      if (!event) return;
      console.log('[EventManagement] Emptying seat:', { tableId, seatIndex, eventId });

      // Find the table and seat
      const table = event.tables.find(t => t.id === tableId);
      if (!table) {
        throw new Error('Table not found');
      }

      const seat = table.seats[seatIndex];
      if (!seat?.playerId) {
        console.log('[EventManagement] Seat is already empty');
        return;
      }

      // Create optimistic table update
      const optimisticTables = event.tables.map(t => {
        if (t.id === tableId) {
          const updatedSeats = [...t.seats];
          updatedSeats[seatIndex] = {
            ...updatedSeats[seatIndex],
            playerId: null,
            playerName: null
          };
          return { ...t, seats: updatedSeats };
        }
        return t;
      });

      console.log('[EventManagement] Optimistically updating tables:', optimisticTables);

      // Update UI optimistically
      setPokerRoomState({
        tables: optimisticTables,
        waitingList: event.waitingList,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tables: optimisticTables
        };
      });

      // Make the API call
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}/seats/${seatIndex}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If the API call fails, revert to the original state
        console.log('[EventManagement] API call failed, reverting state');
        setPokerRoomState({
          tables: event.tables,
          waitingList: event.waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled: true,
          showWaitlistOnDisplay: true
        });

        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tables: event.tables
          };
        });
        throw new Error('Failed to empty seat');
      }

      const data = await response.json();
      console.log('[EventManagement] Server response:', data);

      // Update with the server response to ensure consistency
      setPokerRoomState({
        tables: data.tables,
        waitingList: data.waitingList,
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tables: data.tables,
          waitingList: data.waitingList
        };
      });

      console.log('[EventManagement] State updated successfully');
    } catch (error) {
      console.error('[EventManagement] Error emptying seat:', error);
      setError(error instanceof Error ? error.message : 'Failed to empty seat');
    }
  }, [event, eventId, setPokerRoomState]);

  return {
    event,
    isLoading,
    error,
    toggleTimer,
    addPlayer,
    removePlayer,
    reorderWaitlist,
    addTable,
    removeTable,
    updateTableSeats,
    updateScore,
    assignSeat,
    emptySeat,
    endEvent
  };
} 