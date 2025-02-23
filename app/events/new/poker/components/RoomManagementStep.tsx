import { usePokerRoom } from '@/app/contexts/PokerRoomContext';
import TableManager from '@/app/components/poker/TableManager';
import WaitingList from '@/app/components/poker/WaitingList';
import { Button } from '@/app/components/ui/button';
import { useEffect } from 'react';

interface RoomManagementStepProps {
  onCompleteAction: (roomSettings: { isRoomManagementEnabled: boolean; showWaitlistOnDisplay: boolean }) => void;
}

export default function RoomManagementStep({ onCompleteAction }: RoomManagementStepProps) {
  const {
    tables,
    waitingList,
    addTable,
    removeTable,
    assignSeat,
    emptySeat,
    addToWaitingList,
    removeFromWaitingList,
    reorderWaitingList,
    isRoomManagementEnabled,
    showWaitlistOnDisplay,
    setIsRoomManagementEnabled,
    setShowWaitlistOnDisplay,
  } = usePokerRoom();

  // Call onCompleteAction and update event whenever relevant state changes
  const handleSettingsChange = async (enabled: boolean, showWaitlist: boolean) => {
    // Update local state through the context
    onCompleteAction({
      isRoomManagementEnabled: enabled,
      showWaitlistOnDisplay: showWaitlist
    });

    try {
      // Get the event ID from localStorage
      const eventId = localStorage.getItem('activeEventId');
      if (!eventId) {
        console.error('No active event ID found');
        return;
      }

      // Update event settings in the database
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          roomManagement: {
            isRoomManagementEnabled: enabled,
            showWaitlistOnDisplay: showWaitlist
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event settings');
      }

      console.log('Room management settings updated successfully');
    } catch (error) {
      console.error('Error updating room management settings:', error);
    }
  };

  // Initialize room management settings
  useEffect(() => {
    handleSettingsChange(false, false);
  }, []);

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
                onChange={(e) => {
                  setIsRoomManagementEnabled(e.target.checked);
                  handleSettingsChange(e.target.checked, showWaitlistOnDisplay);
                }}
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
                  onChange={(e) => {
                    setShowWaitlistOnDisplay(e.target.checked);
                    handleSettingsChange(isRoomManagementEnabled, e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-surface/80 border border-dark-border peer-focus:outline-none rounded-full peer dark:bg-dark-surface-lighter peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary hover:bg-dark-surface-lighter transition-colors"></div>
              </label>
            </div>
          )}
        </div>
      </div>

      {isRoomManagementEnabled && (
        <div className="grid grid-cols-[1fr_300px] gap-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button onClick={addTable} className="bg-brand-primary hover:bg-brand-primary/90">
                  +Add Tables
                </Button>
              </div>
            </div>

            <TableManager
              tables={tables}
              onAssignSeatAction={assignSeat}
              onEmptySeatAction={emptySeat}
              onRemoveTableAction={removeTable}
            />
          </div>

          <WaitingList
            players={waitingList}
            onAddPlayerAction={addToWaitingList}
            onRemovePlayerAction={removeFromWaitingList}
            onReorderPlayersAction={reorderWaitingList}
          />
        </div>
      )}
    </div>
  );
} 