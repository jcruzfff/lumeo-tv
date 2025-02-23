import { useState, useCallback, useEffect } from 'react';
import type { Event } from '@/app/types/events';
import { isBasketballSettings } from '@/app/types/events';

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
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEvent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      const data = await response.json();
      setEvent(data);
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh event');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (initialEvent) {
      setEvent(initialEvent);
    } else {
      refreshEvent();
    }
  }, [initialEvent, refreshEvent]);

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
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error('Failed to add player');
      }

      const newPlayer = await response.json();
      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          waitingList: [...prev.waitingList, newPlayer]
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add player');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const removePlayer = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove player');
      }

      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          waitingList: prev.waitingList.filter((player) => player.id !== playerId)
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove player');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const reorderWaitingList = useCallback(async (playerId: string, newPosition: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/waitinglist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerId, newPosition })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder waiting list');
      }

      setEvent((prev) => {
        if (!prev) return prev;
        const player = prev.waitingList.find((p) => p.id === playerId);
        if (!player) return prev;

        const oldPosition = player.position;
        const updatedWaitingList = prev.waitingList.map((p) => {
          if (p.id === playerId) {
            return { ...p, position: newPosition };
          }
          if (newPosition > oldPosition && p.position > oldPosition && p.position <= newPosition) {
            return { ...p, position: p.position - 1 };
          }
          if (newPosition < oldPosition && p.position >= newPosition && p.position < oldPosition) {
            return { ...p, position: p.position + 1 };
          }
          return p;
        });

        return {
          ...prev,
          waitingList: updatedWaitingList.sort((a, b) => a.position - b.position)
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reorder waiting list');
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

  return {
    event,
    isLoading,
    error,
    toggleTimer,
    addPlayer,
    removePlayer,
    reorderWaitingList,
    addTable,
    removeTable,
    updateTableSeats,
    updateScore,
    endEvent,
    refreshEvent
  };
} 