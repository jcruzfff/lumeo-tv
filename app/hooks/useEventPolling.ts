import { useEffect, useRef, useCallback } from 'react';
import { usePokerRoom } from '../contexts/PokerRoomContext';
import type { PokerRoomState } from '../contexts/PokerRoomContext';
import type { Table, Seat, Player, Event } from '../types/events';
import { useRouter } from 'next/navigation';

const POLLING_INTERVAL = 3000; // Poll every 3 seconds

interface ApiTable extends Omit<Table, 'seats'> {
  seats: Array<Seat>;
}

interface ApiPlayer extends Player {
  position: number;
}

interface UseEventPollingOptions {
  onEventData?: (data: Event) => void;
  skipStateUpdate?: boolean;
}

export function useEventPolling(eventId: string, options: UseEventPollingOptions = {}) {
  const router = useRouter();
  const pokerRoom = usePokerRoom();
  const { setState: setPokerRoomState } = pokerRoom;
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(pokerRoom);
  const lastDataRef = useRef<string>(''); // Track last data to prevent unnecessary updates

  // Keep stateRef current without triggering effect
  useEffect(() => {
    stateRef.current = pokerRoom;
  });

  const handleEventEnd = useCallback(() => {
    console.log('[EventPolling] Event ended, cleaning up...');
    
    // Clear polling interval
    if (pollingRef.current) {
      console.log('[EventPolling] Clearing polling interval');
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Clear local storage
    console.log('[EventPolling] Clearing local storage data');
    localStorage.removeItem('pokerRoomState');
    localStorage.removeItem('activeEventId');
    localStorage.removeItem('displaySettings');
    localStorage.removeItem('timerState');

    // Reset poker room state
    console.log('[EventPolling] Resetting poker room state');
    setPokerRoomState({
      tables: [],
      waitingList: [],
      showRoomInfo: true,
      isRoomManagementEnabled: false,
      showWaitlistOnDisplay: false
    });

    // Notify any open display windows
    console.log('[EventPolling] Broadcasting event end to display windows');
    const bc = new BroadcastChannel('lumeo-events');
    bc.postMessage({ type: 'END_EVENT', eventId });
    bc.close();

    // Redirect to event history
    console.log('[EventPolling] Redirecting to event history');
    router.push('/events/history');
  }, [eventId, router, setPokerRoomState]);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        console.log('[EventPolling] Fetching event data:', { eventId });
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          console.error('[EventPolling] Failed to fetch event data:', response.statusText);
          if (response.status === 404) {
            console.log('[EventPolling] Event not found, assuming it was deleted');
            handleEventEnd();
          }
          return;
        }

        const data = await response.json() as Event;
        console.log('[EventPolling] Event data received:', {
          id: data.id,
          status: data.status,
          tablesCount: data.tables?.length,
          waitlistCount: data.waitingList?.length
        });

        // Check if event is ended
        if (data.status === 'ENDED') {
          console.log('[EventPolling] Event status is ENDED');
          handleEventEnd();
          return;
        }

        // Call the onEventData callback if provided
        if (options.onEventData) {
          options.onEventData(data);
          return;
        }

        // Skip state update if requested
        if (options.skipStateUpdate) {
          return;
        }

        // Process tables and waitlist data
        const processedTables = (data.tables || []).map((table: ApiTable) => ({
          id: table.id,
          eventId: table.eventId,
          number: table.number,
          seats: table.seats.map((seat: Seat) => ({
            ...seat,
            playerId: seat.playerId,
            playerName: seat.playerName
          })),
          createdAt: table.createdAt
        }));

        // Process waitlist and ensure it's sorted by position
        const processedWaitlist = (data.waitingList || [])
          .sort((a: ApiPlayer, b: ApiPlayer) => a.position - b.position)
          .map((player: ApiPlayer) => ({
            id: player.id,
            eventId: player.eventId,
            name: player.name,
            position: player.position,
            addedAt: player.addedAt
          }));

        // Create new state while maintaining room management settings
        const newState: PokerRoomState = {
          tables: processedTables,
          waitingList: processedWaitlist,
          showRoomInfo: true,
          isRoomManagementEnabled: stateRef.current.isRoomManagementEnabled,
          showWaitlistOnDisplay: stateRef.current.showWaitlistOnDisplay
        };

        // Only update if there are actual changes
        const newDataString = JSON.stringify({
          tables: processedTables,
          waitingList: processedWaitlist
        });

        if (newDataString !== lastDataRef.current) {
          console.log('[EventPolling] State update detected:', {
            tablesCount: processedTables.length,
            waitlistCount: processedWaitlist.length
          });
          lastDataRef.current = newDataString;
          setPokerRoomState(newState);
        }
      } catch (error) {
        console.error('[EventPolling] Error fetching event data:', error);
      }
    };

    // Initial fetch
    fetchEventData();

    // Setup polling
    console.log('[EventPolling] Setting up polling interval:', { intervalMs: POLLING_INTERVAL });
    pollingRef.current = setInterval(fetchEventData, POLLING_INTERVAL);

    // Cleanup
    return () => {
      console.log('[EventPolling] Cleaning up polling effect');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [eventId, setPokerRoomState, router, handleEventEnd, options]); // Added options to dependencies
} 