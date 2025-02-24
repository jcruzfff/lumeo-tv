import { useState, useCallback, useEffect } from 'react';
import type { Event } from '@/app/types/events';
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
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add player');
      }

      // First update the poker room context
      setPokerRoomState({
        tables: event.tables,
        waitingList: [...event.waitingList, data].sort((a, b) => a.position - b.position),
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      // Then update the event state
      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: [...prev.waitingList, data].sort((a, b) => a.position - b.position)
        };
      });

    } catch (error) {
      console.error('[EventManagement] Error adding player:', error);
      setError(error instanceof Error ? error.message : 'Failed to add player');
    }
  }, [event, eventId, setPokerRoomState]);

  const removePlayer = useCallback(async (playerId: string) => {
    if (!event) return;

    try {
      const response = await fetch(`/api/events/${eventId}/waitinglist/${playerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove player');
      }

      // First update the poker room context
      setPokerRoomState({
        tables: event.tables,
        waitingList: event.waitingList.filter(p => p.id !== playerId),
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true
      });

      // Then update the event state
      setEvent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          waitingList: prev.waitingList.filter(p => p.id !== playerId)
        };
      });

    } catch (error) {
      console.error('[EventManagement] Error removing player:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove player');
    }
  }, [event, eventId, setPokerRoomState]);

  const reorderWaitlist = useCallback(async (playerId: string, newPosition: number) => {
    try {
      console.log('Attempting to reorder waitlist:', { playerId, newPosition });
      setIsLoading(true);

      // Make the API call to reorder the waitlist
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

      // Fetch the updated event data to ensure we have the correct order
      const eventResponse = await fetch(`/api/events/${eventId}`);
      if (!eventResponse.ok) {
        throw new Error('Failed to fetch updated event data');
      }

      const updatedEvent = await eventResponse.json();
      console.log('Updated event data after reorder:', {
        waitlistLength: updatedEvent.waitingList?.length || 0,
        waitlist: updatedEvent.waitingList
      });

      // Update the local state with the fresh data
      setEvent(updatedEvent);

      // Return the updated waitlist for the UI to use
      return updatedEvent.waitingList;
    } catch (error) {
      console.error('Error reordering waitlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to reorder waitlist');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Table Management
  const addTable = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to add table');
      }

      const newTable = await response.json();
      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: [...prev.tables, newTable]
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add table');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

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
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}/seats/${seatIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to assign seat');
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
      setError(error instanceof Error ? error.message : 'Failed to assign seat');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const emptySeat = useCallback(async (tableId: string, seatIndex: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}/seats/${seatIndex}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to empty seat');
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
      setError(error instanceof Error ? error.message : 'Failed to empty seat');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

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