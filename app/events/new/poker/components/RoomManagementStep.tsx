import { usePokerRoom } from '@/app/contexts/PokerRoomContext';
import TableGrid from '@/app/components/poker/TableGrid';
import WaitingList from '@/app/components/poker/WaitingList';
import { Button } from '@/app/components/ui/button';
import { useEffect, useState, useCallback, useRef } from 'react';

interface RoomManagementStepProps {
  onCompleteAction: (roomSettings: { isRoomManagementEnabled: boolean; showWaitlistOnDisplay: boolean }) => void;
}

export default function RoomManagementStep({ onCompleteAction }: RoomManagementStepProps) {
  const [eventId, setEventId] = useState<string | null>(null);
  const initRef = useRef(false);
  const {
    tables,
    waitingList,
    addTable,
    removeTable,
    assignSeat,
    emptySeat,
    addToWaitlist,
    removeFromWaitlist,
    reorderWaitlist,
    isRoomManagementEnabled,
    showWaitlistOnDisplay,
    setIsRoomManagementEnabled,
    setShowWaitlistOnDisplay,
  } = usePokerRoom();

  // Get the event ID from localStorage on mount
  useEffect(() => {
    const storedEventId = localStorage.getItem('activeEventId');
    if (storedEventId) {
      console.log('RoomManagementStep - Found stored event ID:', storedEventId);
      setEventId(storedEventId);
    } else {
      console.error('RoomManagementStep - No active event ID found in localStorage');
    }
  }, []); // Only run once on mount

  // Initialize settings once when eventId is available
  useEffect(() => {
    if (eventId && !initRef.current) {
      console.log('RoomManagementStep - Initializing room management settings');
      setIsRoomManagementEnabled(false);
      setShowWaitlistOnDisplay(false);
      initRef.current = true;
    }
  }, [eventId, setIsRoomManagementEnabled, setShowWaitlistOnDisplay]);

  // Memoize handleSettingsChange with useCallback
  const handleSettingsChange = useCallback(async (enabled: boolean, showWaitlist: boolean) => {
    if (!eventId) {
      console.error('RoomManagementStep - Cannot update settings: No event ID available');
      return;
    }

    console.log('RoomManagementStep - Updating settings:', {
      eventId,
      enabled,
      showWaitlist
    });

    // Update local state through the context
    setIsRoomManagementEnabled(enabled);
    setShowWaitlistOnDisplay(showWaitlist);
    
    // Only call onCompleteAction for user-initiated changes
    onCompleteAction({
      isRoomManagementEnabled: enabled,
      showWaitlistOnDisplay: showWaitlist
    });

    try {
      // Update event settings in the database
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          settings: {
            isRunning: false,
            currentLevel: 0,
            timeRemaining: 0,
            levels: [],
            isRoomManagementEnabled: enabled,
            showWaitlistOnDisplay: showWaitlist
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to update event settings');
      }

      console.log('RoomManagementStep - Settings updated successfully');
    } catch (error) {
      console.error('RoomManagementStep - Error updating settings:', error);
    }
  }, [eventId, onCompleteAction, setIsRoomManagementEnabled, setShowWaitlistOnDisplay]);

  const handleAddPlayer = (name: string) => {
    if (!eventId) {
      console.error('RoomManagementStep - Cannot add player: No event ID available');
      return;
    }
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      console.error('RoomManagementStep - Cannot add player: Name is required');
      return;
    }

    console.log('RoomManagementStep - Adding player:', {
      eventId,
      name: trimmedName
    });

    addToWaitlist(eventId, trimmedName);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white pb-2">Poker Room Manager</h2>
        <p className="text-text-secondary">Configure table and waitlist management</p>
      </div>

      {/* Room Management Settings */}
      <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 mb-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary pb-2">Room Management</h3>
              <p className="text-sm text-text-secondary">Enable table and waitlist management</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRoomManagementEnabled}
                onChange={(e) => handleSettingsChange(e.target.checked, showWaitlistOnDisplay)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-surface/80 border border-dark-border peer-focus:outline-none rounded-full peer dark:bg-dark-surface-lighter peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary hover:bg-dark-surface-lighter transition-colors"></div>
            </label>
          </div>

          {isRoomManagementEnabled && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Show Waitlist on Display</h3>
                <p className="text-sm text-text-secondary">Display the waitlist in the timer sequence</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWaitlistOnDisplay}
                  onChange={(e) => handleSettingsChange(isRoomManagementEnabled, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-surface/80 border border-dark-border peer-focus:outline-none rounded-full peer dark:bg-dark-surface-lighter peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary hover:bg-dark-surface-lighter transition-colors"></div>
              </label>
            </div>
          )}
        </div>
      </div>

      {isRoomManagementEnabled && eventId && (
        <div className="grid grid-cols-[1fr_300px] gap-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => addTable(eventId)} 
                  className="bg-brand-primary hover:bg-brand-primary/90"
                >
                  +Add Tables
                </Button>
              </div>
            </div>

            <TableGrid
              tables={tables}
              onAssignSeat={assignSeat}
              onEmptySeat={emptySeat}
              onRemoveTable={removeTable}
            />
          </div>

          <WaitingList
            players={waitingList}
            onAddPlayerAction={handleAddPlayer}
            onRemovePlayerAction={removeFromWaitlist}
            onReorderPlayersAction={reorderWaitlist}
          />
        </div>
      )}
    </div>
  );
} 