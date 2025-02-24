'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event, PokerSettings, Player } from '@/app/types/events';
import { useEventManagement } from '@/app/hooks/useEventManagement';
import { useSession } from 'next-auth/react';
import WaitingList from '@/app/components/poker/WaitingList';
import { Settings, Play, Pause } from 'lucide-react';
import TableGrid from '@/app/components/poker/TableGrid';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import { usePokerRoom } from '@/app/contexts/PokerRoomContext';
import { useTimer } from '@/app/contexts/TimerContext';
import { toast } from 'react-hot-toast';
import { useEventPolling } from '@/app/hooks/useEventPolling';

export default function EventManagement() {
  const { eventId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setState: setPokerRoomState } = usePokerRoom();
  const { pokerState, setPokerState } = useTimer();
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  console.log('[EventManagement] Initializing with:', {
    eventId,
    sessionStatus: status,
    isAuthenticated: !!session
  });

  // Initialize polling with shouldPoll parameter
  useEventPolling(eventId as string, {
    shouldPoll: isPollingEnabled
  });

  // Sync event data with poker room context
  useEffect(() => {
    if (event) {
      console.log('[EventManagement] Syncing event data with poker room context:', {
        waitlistLength: event.waitingList?.length || 0,
        waitlist: event.waitingList
      });
      setPokerRoomState({
        tables: event.tables || [],
        waitingList: event.waitingList || [],
        showRoomInfo: true,
        isRoomManagementEnabled: true,
        showWaitlistOnDisplay: true // Default to true since we want to show the waitlist
      });
    }
  }, [event, setPokerRoomState]);

  // Initialize state from localStorage when display launches
  useEffect(() => {
    const bc = new BroadcastChannel('lumeo-events');
    
    const handleTimerUpdate = () => {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { pokerState: savedPokerState } = JSON.parse(timerState);
          if (savedPokerState) {
            setPokerState(savedPokerState);
          }
        } catch (error) {
          console.error('Error loading timer state:', error);
        }
      }
    };

    // Initial load
    handleTimerUpdate();

    // Listen for updates
    bc.onmessage = (event) => {
      if (event.data.type === 'TIMER_UPDATE') {
        handleTimerUpdate();
      }
    };

    return () => bc.close();
  }, [setPokerState]);

  useEffect(() => {
    if (event?.type === 'POKER' && !pokerState) {
      // Initialize poker state from event settings
      const settings = event.settings as PokerSettings;
      setPokerState({
        isRunning: false,
        currentLevel: 0,
        timeRemaining: settings.levels[0].duration * 60,
        levels: settings.levels,
        breakDuration: settings.breakDuration,
        totalPlayTime: settings.totalPlayTime
      });
      console.log('[EventManagement] Initialized poker state from event settings');
    }
  }, [event, pokerState, setPokerState]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      console.log('[EventManagement] User not authenticated, redirecting to signin');
      router.push('/auth/signin');
      return;
    }

    const fetchEvent = async () => {
      console.log('[EventManagement] Fetching event data for:', eventId);
      const response = await fetch(`/api/events/${eventId}`);
      console.log('[EventManagement] Event fetch response:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[EventManagement] Event data received:', {
          id: data.id,
          type: data.type,
          status: data.status,
          mediaCount: data.mediaItems?.length,
          tableCount: data.tables?.length,
          waitlistCount: data.waitingList?.length || 0,
          waitlist: data.waitingList
        });

        // Initialize PokerRoomContext state
        const pokerRoomState = {
          tables: data.tables || [],
          waitingList: data.waitingList || [],
          showRoomInfo: true,
          isRoomManagementEnabled: data.roomManagement?.isRoomManagementEnabled ?? false,
          showWaitlistOnDisplay: data.roomManagement?.showWaitlistOnDisplay ?? false
        };

        // Store the state in localStorage
        localStorage.setItem('pokerRoomState', JSON.stringify(pokerRoomState));
        
        console.log('[EventManagement] Initialized PokerRoomContext:', {
          tableCount: pokerRoomState.tables.length,
          waitlistCount: pokerRoomState.waitingList.length,
          waitlist: pokerRoomState.waitingList,
          roomManagement: {
            isEnabled: pokerRoomState.isRoomManagementEnabled,
            showWaitlist: pokerRoomState.showWaitlistOnDisplay
          }
        });

        setEvent(data);
        setIsLoading(false);
      } else {
        if (response.status === 401) {
          console.log('[EventManagement] Unauthorized access, redirecting to signin');
          router.push('/auth/signin');
          return;
        }
        if (response.status === 404) {
          setError('Event not found. It may have been deleted or never existed.');
          return;
        }
        throw new Error('Failed to fetch event');
      }
    };

    if (status === 'authenticated') {
      console.log('[EventManagement] User authenticated, fetching event');
      fetchEvent();
    }
  }, [eventId, router, status]);

  const {
    addPlayer,
    removePlayer,
    reorderWaitlist,
    addTable,
    removeTable,
    assignSeat,
    emptySeat
  } = useEventManagement({
    eventId: eventId as string,
    initialEvent: event
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = async () => {
    if (!eventId || !pokerState) return;

    const newState = {
      ...pokerState,
      isRunning: !pokerState.isRunning
    };

    // Update timer state
    setPokerState(newState);

    // Update event settings
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            ...newState
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update timer state');
      }

      // Save to localStorage and broadcast update
      const timerState = {
        activeTimer: 'poker',
        pokerState: newState
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));

      // Update persistent state
      const persistentState = {
        startTime: Date.now(),
        initialGameTime: newState.timeRemaining,
        isRunning: newState.isRunning,
        currentLevel: newState.currentLevel
      };
      localStorage.setItem('timerPersistentState', JSON.stringify(persistentState));

      // Broadcast update
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ type: 'TIMER_UPDATE' });
      bc.close();
    } catch (error) {
      console.error('Error updating timer state:', error);
      // Revert state on error
      setPokerState(pokerState);
    }
  };

  const handleLaunchDisplay = async () => {
    console.log('[LaunchDisplay] Button clicked, starting launch sequence...');
    
    if (!eventId || !pokerState) {
      console.log('[LaunchDisplay] Cannot launch: missing eventId or pokerState', { eventId, hasPokerState: !!pokerState });
      return;
    }

    setIsLaunching(true);
    try {
      console.log('[LaunchDisplay] Initializing Lumeo launch with:', {
        eventId,
        displaySettings: {
          timer: {
            isRunning: false, // Start paused initially
            currentLevel: 0,
            timeRemaining: pokerState.levels[0].duration * 60,
            totalLevels: pokerState.levels.length,
            currentBlinds: `${pokerState.levels[0].smallBlind}/${pokerState.levels[0].bigBlind}`
          },
          media: {
            items: event?.mediaItems?.length || 0,
            cycleInterval: event?.settings?.mediaInterval || 15,
          },
          roomManagement: {
            isEnabled: event?.settings?.isRoomManagementEnabled,
            showWaitlist: event?.settings?.showWaitlistOnDisplay,
            tables: event?.tables?.length || 0,
            waitingPlayers: event?.waitingList?.length || 0
          }
        }
      });

      // First set event status to ACTIVE
      const activateResponse = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ACTIVE'
        })
      });

      if (!activateResponse.ok) {
        throw new Error('Failed to activate event');
      }

      console.log('[LaunchDisplay] Event activated successfully');

      // Initialize timer state but keep it paused
      const newState = {
        ...pokerState,
        isRunning: false,
        timeRemaining: pokerState.levels[0].duration * 60,
        currentLevel: 0
      };

      // Update timer state
      setPokerState(newState);
      console.log('[LaunchDisplay] Timer state initialized:', {
        timeRemaining: newState.timeRemaining,
        currentLevel: newState.currentLevel,
        isRunning: newState.isRunning
      });

      // Save to localStorage and broadcast update
      const timerState = {
        activeTimer: 'poker',
        pokerState: newState
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));

      // Update persistent state
      const persistentState = {
        startTime: Date.now(),
        initialGameTime: newState.timeRemaining,
        isRunning: false,
        currentLevel: 0
      };
      localStorage.setItem('timerPersistentState', JSON.stringify(persistentState));

      console.log('[LaunchDisplay] Local storage state saved:', {
        timerState: true,
        persistentState: true
      });

      // Enable polling
      setIsPollingEnabled(true);
      console.log('[LaunchDisplay] Real-time polling enabled');

      // Broadcast update
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ type: 'TIMER_UPDATE' });
      bc.close();

      console.log('[LaunchDisplay] Timer update broadcasted to all windows');

      // Open display window
      const windowFeatures = {
        menubar: 'no',
        toolbar: 'no',
        location: 'no',
        status: 'no',
        resizable: 'yes'
      };
      const featuresString = Object.entries(windowFeatures)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

      const displayUrl = `${window.location.origin}/display/${eventId}`;
      const displayWindow = window.open(displayUrl, `lumeo_display_${eventId}`, featuresString);
      
      if (displayWindow) {
        displayWindow.focus();
        console.log('[LaunchDisplay] Display window opened successfully:', {
          url: displayUrl,
          windowId: `lumeo_display_${eventId}`
        });

        // Wait a short moment for display to initialize
        setTimeout(() => {
          // Now start the timer by toggling it
          handleToggleTimer();
          console.log('[LaunchDisplay] Timer started synchronously');
        }, 1000);
      } else {
        throw new Error('Please allow popups to open the display window');
      }

      // Update local event state to reflect ACTIVE status
      setEvent(prev => prev ? { ...prev, status: 'ACTIVE' } : prev);

      console.log('[LaunchDisplay] Lumeo launch completed successfully ✨');
      toast.success('Lumeo launched successfully! 🚀');
    } catch (error) {
      console.error('[LaunchDisplay] Error launching display:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to launch display');
    } finally {
      setIsLaunching(false);
    }
  };

  // Add handleEndEvent function
  const handleEndEvent = async () => {
    console.log('[EndEvent] Starting event end sequence...');
    
    if (!eventId) {
      console.error('[EndEvent] Cannot end event: missing eventId');
      return;
    }

    try {
      // First stop the timer if it's running
      if (pokerState?.isRunning) {
        console.log('[EndEvent] Stopping active timer');
        await handleToggleTimer();
      }

      // Close any open display windows
      console.log('[EndEvent] Broadcasting end event message');
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ type: 'END_EVENT', eventId });
      bc.close();

      // Call the API to end the event
      console.log('[EndEvent] Updating event status to ENDED');
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

      // Clear local storage
      console.log('[EndEvent] Clearing local storage state');
      localStorage.removeItem('timerState');
      localStorage.removeItem('timerPersistentState');
      localStorage.removeItem('pokerRoomState');
      localStorage.removeItem('displaySettings');
      localStorage.removeItem('activeEventId');

      // Update local state
      setEvent(prev => prev ? { ...prev, status: 'ENDED' } : prev);
      setPokerState(null);

      console.log('[EndEvent] Event ended successfully ✨');
      toast.success('Event ended successfully');

      // Redirect to history page
      router.push('/events/history');
    } catch (error) {
      console.error('[EndEvent] Error ending event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to end event');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
        <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Loading event...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
        <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-4">Error</h1>
            <p className="text-text-secondary">{error || 'Event not found'}</p>
            <Link
              href="/events/active"
              className="inline-block mt-4 text-brand-primary hover:text-brand-primary/90 transition-colors"
            >
              ← Back to Active Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pokerSettings = event.settings as PokerSettings;
  const timeRemaining = pokerState?.timeRemaining || pokerSettings.timeRemaining || 0;
  const currentBlindLevel = pokerState?.levels[pokerState.currentLevel] || pokerSettings.levels[pokerSettings.currentLevel];
  const nextBlindLevel = pokerState?.levels[pokerState.currentLevel + 1] || pokerSettings.levels[pokerSettings.currentLevel + 1];

  return (
    <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
      <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/events/active')}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Go Back
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{event.name}</h1>
        </div>

        <div className="grid grid-cols-[350px_1fr] gap-6">
          {/* Left Column - Game Info & Waitlist */}
          <div className="space-y-4">
            {/* Game Info Card */}
            <div 
              className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl"
              onClick={(e) => {
                console.log('[Debug] Game Info Card clicked', e.target);
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Game Name</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2 bg-dark-surface text-text-primary rounded-lg hover:bg-dark-surface-lighter transition-colors">
                          <Settings size={20} /></button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Room Settings</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                          <button
                            onClick={() => addTable()}
                            className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                          >
                            Add Table
                          </button>
                          {pokerState?.isRunning && (
                            <button
                              onClick={handleToggleTimer}
                              className="w-full px-4 py-2 bg-dark-surface text-text-primary rounded-lg hover:bg-dark-surface-lighter transition-colors"
                            >
                              <Pause size={20} className="inline-block mr-2" />
                              Pause Timer
                            </button>
                          )}
                          {!pokerState?.isRunning && pokerState?.levels && pokerState?.timeRemaining !== (pokerState.levels[0]?.duration || 0) * 60 && (
                            <button
                              onClick={handleToggleTimer}
                              className="w-full px-4 py-2 bg-dark-surface text-text-primary rounded-lg hover:bg-dark-surface-lighter transition-colors"
                            >
                              <Play size={20} className="inline-block mr-2" />
                              Resume Timer
                            </button>
                          )}
                          <button
                            onClick={handleEndEvent}
                            className="w-full px-4 py-2 bg-status-error text-white rounded-lg hover:bg-status-error/90 transition-colors"
                          >
                            End Event
                          </button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
              <div className="text-[64px] font-bold text-white leading-none mb-4">
                {formatTime(timeRemaining)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-text-secondary text-sm">Current Blind Level</div>
                  <div className="text-text-primary text-lg font-medium">
                    {currentBlindLevel.smallBlind}/{currentBlindLevel.bigBlind}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">Next Blind Level</div>
                  <div className="text-text-primary text-lg font-medium">
                    {nextBlindLevel ? `${nextBlindLevel.smallBlind}/${nextBlindLevel.bigBlind}` : '-/-'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-text-secondary text-sm">Status</div>
                  <div className="text-text-primary text-lg font-medium">
                    {pokerState?.isRunning ? 'Running' : 'Paused'}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">Level</div>
                  <div className="text-text-primary text-lg font-medium">
                    {(pokerState?.currentLevel || 0) + 1} of {pokerState?.levels.length || 0}
                  </div>
                </div>
              </div>

              {event.status !== 'ENDED' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[Debug] Launch button clicked directly');
                    handleLaunchDisplay();
                  }}
                  disabled={isLaunching}
                  className={`w-full mt-6 px-4 py-2 bg-brand-primary text-white rounded-lg transition-all duration-200 relative ${
                    isLaunching 
                      ? 'bg-brand-primary/50 cursor-not-allowed' 
                      : 'hover:bg-brand-primary/90 cursor-pointer'
                  }`}
                >
                  <span className={`flex items-center justify-center gap-2 ${isLaunching ? 'opacity-0' : ''}`}>
                    Launch Lumeo
                  </span>
                  {isLaunching && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      Launching...
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Waitlist */}
            <WaitingList
              players={event.waitingList || []}
              onAddPlayerAction={(name) => addPlayer(name)}
              onRemovePlayerAction={(index) => {
                const player = event.waitingList?.[index];
                if (player) {
                  removePlayer(player.id);
                }
              }}
              onReorderPlayersAction={(newOrder: Player[]) => {
                // Find the moved player by comparing positions
                const movedPlayer = newOrder.find((player, index) => {
                  const oldIndex = event.waitingList?.findIndex(p => p.id === player.id) ?? -1;
                  return oldIndex !== index;
                });
                
                if (movedPlayer) {
                  // Get the new position (1-based as required by the API)
                  const newPosition = newOrder.findIndex(p => p.id === movedPlayer.id) + 1;
                  console.log('Reordering waitlist:', {
                    playerId: movedPlayer.id,
                    oldPosition: movedPlayer.position,
                    newPosition: newPosition,
                    waitlistLength: event.waitingList?.length
                  });

                  // Optimistically update the UI
                  setEvent(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      waitingList: newOrder.map((player, index) => ({
                        ...player,
                        position: index + 1
                      }))
                    };
                  });

                  // Make the API call
                  reorderWaitlist(movedPlayer.id, newPosition);
                }
              }}
            />
          </div>

          {/* Tables Grid */}
          <TableGrid
            tables={event.tables || []}
            onAssignSeat={assignSeat}
            onEmptySeat={emptySeat}
            onRemoveTable={removeTable}
          />
        </div>
      </div>
    </div>
  );
} 