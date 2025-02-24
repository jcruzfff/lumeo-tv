'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTimer } from '@/app/contexts/TimerContext';
import { useMedia } from '@/app/contexts/MediaContext';
import { usePokerRoom, PokerRoomState } from '@/app/contexts/PokerRoomContext';
import Image from 'next/image';
import { MediaItem } from '@/app/types';
import { Table, Seat, Player } from '@/app/types/events';
import { useEventPolling } from '@/app/hooks/useEventPolling';

interface WaitingPlayer {
  id: string;
  name: string;
  position: number;
}

export default function EventDisplay() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { activeTimer, pokerState, basketballState, customTimerState, setBasketballState, setActiveTimer, setPokerState } = useTimer();
  const { mediaItems, currentMediaIndex, setCurrentMediaIndex, setMediaItems } = useMedia();
  const { waitingList, isRoomManagementEnabled, showWaitlistOnDisplay, setState: setPokerRoomState } = usePokerRoom();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimerPage, setIsTimerPage] = useState(true);
  const [isClientReady, setIsClientReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize polling for updates with callback
  useEventPolling(eventId, {
    onEventData: (event) => {
      if (event.type === 'POKER') {
        // Process tables and waitlist data
        const processedTables = (event.tables || []).map((table: Table) => ({
          id: table.id,
          eventId: table.eventId,
          number: table.number,
          seats: table.seats.map((seat: Seat) => ({
            id: seat.id,
            tableId: seat.tableId,
            position: seat.position,
            playerId: seat.playerId || null,
            playerName: seat.playerName || null,
            createdAt: seat.createdAt
          })),
          createdAt: table.createdAt
        }));

        // Process waitlist and ensure it's sorted by position
        const processedWaitlist = (event.waitingList || [])
          .sort((a: Player, b: Player) => a.position - b.position)
          .map((player: Player) => ({
            id: player.id,
            eventId: player.eventId,
            name: player.name,
            position: player.position,
            addedAt: player.addedAt
          }));

        console.log('[Display] Polling - Processed waitlist:', {
          originalCount: event.waitingList?.length || 0,
          processedCount: processedWaitlist.length,
          waitlistData: processedWaitlist
        });

        // Create new state while maintaining room management settings
        const currentStateStr = localStorage.getItem('pokerRoomState');
        const currentState = currentStateStr ? JSON.parse(currentStateStr) : null;

        const newState: PokerRoomState = {
          tables: processedTables,
          waitingList: processedWaitlist,
          showRoomInfo: true,
          // Maintain existing room management settings or default to true
          isRoomManagementEnabled: currentState?.isRoomManagementEnabled ?? true,
          showWaitlistOnDisplay: currentState?.showWaitlistOnDisplay ?? true
        };

        // Only update if there are actual changes to the data
        const hasDataChanged = !currentState || 
          JSON.stringify(currentState.tables) !== JSON.stringify(processedTables) ||
          JSON.stringify(currentState.waitingList.map((p: WaitingPlayer) => ({ id: p.id, name: p.name, position: p.position }))) !== 
          JSON.stringify(processedWaitlist.map((p: WaitingPlayer) => ({ id: p.id, name: p.name, position: p.position })));

        if (hasDataChanged) {
          console.log('[Display] Polling - Updating poker room state:', {
            waitingListCount: processedWaitlist.length,
            tablesCount: processedTables.length,
            isRoomManagementEnabled: newState.isRoomManagementEnabled,
            showWaitlistOnDisplay: newState.showWaitlistOnDisplay,
            waitlistData: processedWaitlist
          });
          setPokerRoomState(newState);
          localStorage.setItem('pokerRoomState', JSON.stringify(newState));
        }
      }
    },
    skipStateUpdate: true,
    shouldPoll: true // Enable polling for display window
  });

  useEffect(() => {
    console.log('[Display] Component mounted');
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    console.log('[Display] Setting up fullscreen change listener');
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      console.log('[Display] Fullscreen state changed:', isNowFullscreen);
      setIsFullscreen(isNowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      console.log('[Display] Cleaning up fullscreen listener');
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const enableFullscreen = useCallback(async () => {
    try {
      console.log('[Display] Requesting fullscreen mode');
      await document.documentElement.requestFullscreen();
      console.log('[Display] Fullscreen mode enabled successfully');
    } catch (error) {
      console.error('[Display] Error enabling fullscreen:', error);
    }
  }, []);

  useEffect(() => {
    if (!isClientReady) {
      console.log('[Display] Skipping event load - client not ready');
      return;
    }

    const loadEventData = async () => {
      try {
        console.log('[Display] Starting event data load for ID:', eventId);
        setIsLoading(true);

        console.log('[Display] Fetching event data from API');
        const response = await fetch(`/api/events/${eventId}`, {
          credentials: 'include'
        });
        console.log('[Display] API response status:', response.status);

        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }

        const event = await response.json();
        if (!event) {
          throw new Error('Event data is empty');
        }

        console.log('[Display] Event data received:', {
          id: event.id,
          type: event.type,
          status: event.status,
          mediaItemsCount: event.mediaItems?.length,
          isRunning: event.settings?.isRunning,
          settings: event.settings ? Object.keys(event.settings) : 'no settings'
        });

        if (event.type === 'POKER') {
          console.log('[Display] Initializing poker display');
          setActiveTimer('poker');
          setPokerState(event.settings);

          // Process tables and waitlist data
          const processedTables = (event.tables || []).map((table: Table) => ({
            id: table.id,
            eventId: table.eventId,
            number: table.number,
            seats: table.seats.map((seat: Seat) => ({
              ...seat,
              playerId: seat.playerId || undefined,
              playerName: seat.playerName || undefined
            })),
            createdAt: table.createdAt
          }));

          // Process waitlist and ensure it's sorted by position
          const processedWaitlist = (event.waitingList || [])
            .sort((a: Player, b: Player) => a.position - b.position)
            .map((player: Player) => ({
              id: player.id,
              name: player.name,
              position: player.position
            }));

          console.log('[Display] Processed waitlist:', {
            originalCount: event.waitingList?.length || 0,
            processedCount: processedWaitlist.length,
            waitlistData: processedWaitlist
          });

          // Create new state with room management enabled by default for poker events
          const newState: PokerRoomState = {
            tables: processedTables,
            waitingList: processedWaitlist,
            showRoomInfo: true,
            isRoomManagementEnabled: true,
            showWaitlistOnDisplay: true
          };

          // Update state and persist to localStorage
          console.log('[Display] Setting poker room state:', {
            waitingListCount: processedWaitlist.length,
            tablesCount: processedTables.length,
            isRoomManagementEnabled: true,
            showWaitlistOnDisplay: true
          });
          setPokerRoomState(newState);
          localStorage.setItem('pokerRoomState', JSON.stringify(newState));
          localStorage.setItem('activeEventId', eventId as string);

          // Load display settings from event data
          if (event.displaySettings) {
            console.log('[Display] Loading display settings from event:', event.displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(event.displaySettings));
          }

          if (event.mediaItems?.length > 0) {
            console.log('[Display] Loading media items:', {
              count: event.mediaItems.length,
              types: event.mediaItems.map((item: MediaItem) => ({ type: item.type, url: item.url }))
            });
            // Process media items ensuring they match the MediaItem interface
            const processedMediaItems = event.mediaItems.map((item: MediaItem) => ({
              id: item.id,
              type: item.type,
              url: item.url,
              displayOrder: item.displayOrder,
              duration: item.duration
            }));
            console.log('[Display] Processed media items:', processedMediaItems);
            setMediaItems(processedMediaItems);
          }
        } else if (event.type === 'BASKETBALL') {
          console.log('[Display] Initializing basketball display');
          setActiveTimer('basketball');
          setBasketballState(event.settings);
          setIsTimerPage(true); // Ensure timer is shown first
        } else if (event.type === 'CUSTOM') {
          console.log('[Display] Initializing custom display');
          setActiveTimer('custom');
          setIsTimerPage(true); // Ensure timer is shown first
        }

        console.log('[Display] Event initialization complete');
        setIsLoading(false);
      } catch (error) {
        console.error('[Display] Error loading event:', error);
        setError(error instanceof Error ? error.message : 'Failed to load event');
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [eventId, isClientReady, setActiveTimer, setMediaItems, setPokerRoomState, setPokerState, setBasketballState]);

  // Media cycling effect
  useEffect(() => {
    if (!isClientReady || mediaItems.length === 0) {
      console.log('[Display] Media cycle skipped: Client not ready or no media items', {
        isClientReady,
        mediaItemsCount: mediaItems.length,
        mediaItems: mediaItems
      });
      return;
    }

    try {
      console.log('[Display] Setting up media cycle');
      const defaultDisplaySettings = {
        aspectRatio: '16:9',
        timerPosition: 'top-right',
        mediaInterval: 15,
        showTimer: true,
        theme: 'dark',
        customColors: {
          timerText: '#FFFFFF',
          timerBackground: '#000000',
        }
      };

      let displaySettings;
      try {
        console.log('[Display] Attempting to load display settings');
        const savedSettings = localStorage.getItem('displaySettings');
        console.log('[Display] Raw saved settings:', savedSettings);

        if (savedSettings) {
          console.log('[Display] Parsing saved settings');
          const parsedSettings = JSON.parse(savedSettings);
          console.log('[Display] Successfully parsed settings:', parsedSettings);
          displaySettings = { 
            ...defaultDisplaySettings,
            ...parsedSettings,
            customColors: {
              ...defaultDisplaySettings.customColors,
              ...(parsedSettings.customColors || {})
            }
          };
        } else {
          console.log('[Display] No saved settings found, using defaults');
          displaySettings = defaultDisplaySettings;
        }
      } catch (parseError) {
        console.error('[Display] Error parsing display settings:', parseError);
        console.log('[Display] Using default settings due to parse error');
        displaySettings = defaultDisplaySettings;
      }

      const intervalInMs = displaySettings.mediaInterval * 1000;
      
      console.log('[Display] Starting media cycle with configuration:', {
        isTimerPage,
        currentIndex: currentMediaIndex,
        totalItems: mediaItems.length,
        currentItem: mediaItems[currentMediaIndex],
        intervalMs: intervalInMs,
        mediaInterval: displaySettings.mediaInterval,
        displaySettings: displaySettings
      });

      const cycleInterval = setInterval(() => {
        console.log('[Display] Media cycle tick:', {
          currentState: isTimerPage ? 'timer' : 'media',
          currentIndex: currentMediaIndex,
          totalItems: mediaItems.length,
          currentItem: mediaItems[currentMediaIndex]
        });

        if (isTimerPage) {
          console.log('[Display] Switching from timer to first media');
          setIsTimerPage(false);
        } else {
          if (currentMediaIndex >= mediaItems.length - 1) {
            console.log('[Display] Reached last media, returning to timer');
            setIsTimerPage(true);
            setCurrentMediaIndex(0);
          } else {
            console.log('[Display] Moving to next media item');
            setCurrentMediaIndex(currentMediaIndex + 1);
          }
        }
      }, intervalInMs);

      // Cleanup function
      return () => {
        console.log('[Display] Cleaning up media cycle interval');
        clearInterval(cycleInterval);
      };
    } catch (error) {
      console.error('[Display] Error in media cycle effect:', error);
      return () => {};
    }
  }, [isClientReady, mediaItems, currentMediaIndex, isTimerPage, setCurrentMediaIndex]);

  // Initial setup effect
  useEffect(() => {
    if (isClientReady && mediaItems.length > 0) {
      console.log('[Display] Setting initial state');
      setIsTimerPage(true);
      setCurrentMediaIndex(0);
    }
  }, [isClientReady, mediaItems.length, setCurrentMediaIndex]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add click handler for fullscreen
  const handleClick = useCallback(() => {
    if (!isFullscreen) {
      enableFullscreen();
    }
  }, [enableFullscreen, isFullscreen]);

  // Set up broadcast channel for event end
  useEffect(() => {
    if (!eventId) return;
    
    console.log('[Display] Setting up broadcast channel');
    const bc = new BroadcastChannel('lumeo-events');
    
    bc.onmessage = (event) => {
      console.log('[Display] Broadcast message received:', event.data);
      if (event.data.type === 'END_EVENT' && event.data.eventId === eventId) {
        console.log('[Display] Event end signal received, closing window');
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        window.close();
      }
    };

    return () => {
      console.log('[Display] Cleaning up broadcast channel');
      bc.close();
    };
  }, [eventId]);

  // Check if event is already ended
  useEffect(() => {
    if (!eventId) return;

    const checkEventStatus = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          credentials: 'include'
        });
        const event = await response.json();
        
        if (event.status === 'ENDED') {
          console.log('[Display] Event is already ended, closing window');
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          window.close();
        }
      } catch (error) {
        console.error('[Display] Error checking event status:', error);
      }
    };

    checkEventStatus();
  }, [eventId]);

  // Poll for basketball score updates
  useEffect(() => {
    if (!isClientReady || activeTimer !== 'basketball' || !eventId) return;

    const pollInterval = setInterval(() => {
      fetch(`/api/events/${eventId}/score`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (setBasketballState) {
            setBasketballState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                homeScore: data.homeScore,
                awayScore: data.awayScore
              };
            });
          }
        })
        .catch(error => {
          console.error('Error polling score:', error);
        });
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isClientReady, activeTimer, eventId, setBasketballState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" onClick={handleClick}>
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" onClick={handleClick}>
        <div className="text-red-500 text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden p-0 m-0">
      {!isFullscreen && (
        <button
          onClick={enableFullscreen}
          className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white transition-all duration-200 z-50 flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          Enter Fullscreen
        </button>
      )}
      <div className="relative w-full h-screen">
        {/* Media display */}
        {!isTimerPage && mediaItems.length > 0 && currentMediaIndex < mediaItems.length && mediaItems[currentMediaIndex] && (
          <div className="absolute inset-0 w-full h-full bg-black">
            {mediaItems[currentMediaIndex].type === 'VIDEO' ? (
              <video
                key={mediaItems[currentMediaIndex].id}
                src={mediaItems[currentMediaIndex].url || ''}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                muted
                onEnded={() => {
                  const isLastMedia = currentMediaIndex === mediaItems.length - 1;
                  if (isLastMedia) {
                    setIsTimerPage(true);
                    setCurrentMediaIndex(0);
                  } else {
                    setCurrentMediaIndex(currentMediaIndex + 1);
                  }
                }}
              />
            ) : mediaItems[currentMediaIndex].url ? (
              <Image
                key={mediaItems[currentMediaIndex].id}
                src={mediaItems[currentMediaIndex].url}
                alt="Display content"
                fill
                className="object-contain"
                unoptimized
                priority
              />
            ) : null}
          </div>
        )}

        {/* Timer Displays */}
        {/* Poker Timer Display */}
        {activeTimer === 'poker' && pokerState && (
          <>
            {/* Prominent center display when isTimerPage is true */}
            {isTimerPage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl px-8">
                <div className="text-[128px] font-bold leading-none mb-8">
                  {formatTime(pokerState.timeRemaining)}
                </div>
                <div className="text-4xl mb-4">
                  Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
                </div>
                <div className="text-2xl">
                  Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
                </div>

                {/* Main Waitlist Display */}
                {isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/20">
                    <h3 className="text-2xl font-semibold mb-4">Waiting List</h3>
                    <div className="flex flex-col items-center space-y-2">
                      {waitingList.slice(0, 5).map((player, index) => (
                        <div key={player.id} className="text-xl">
                          {index + 1}. {player.name}
                        </div>
                      ))}
                      {waitingList.length > 5 && (
                        <div className="text-lg text-white/70">
                          +{waitingList.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Overlay display when showing media */}
            {!isTimerPage && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-6 rounded-lg text-right">
                <div className="text-6xl font-bold mb-4">
                  {formatTime(pokerState.timeRemaining)}
                </div>
                <div className="text-3xl mb-2">
                  Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
                </div>
                <div className="text-xl mb-4">
                  Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
                </div>

                {/* Overlay Waitlist Display */}
                {isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20 text-left">
                    <h4 className="text-lg font-medium mb-2">Next Up:</h4>
                    <div className="space-y-1">
                      {waitingList.slice(0, 3).map((player, index) => (
                        <div key={player.id} className="text-sm">
                          {index + 1}. {player.name}
                        </div>
                      ))}
                      {waitingList.length > 3 && (
                        <div className="text-xs text-white/70">
                          +{waitingList.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Basketball Timer Display */}
        {activeTimer === 'basketball' && basketballState && (
          <>
            {/* Prominent center display when isTimerPage is true */}
            {isTimerPage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-[128px] font-bold leading-none mb-8">
                  {formatTime(basketballState.gameTime)}
                </div>
                <div className="text-6xl mb-4 flex items-center justify-center space-x-8">
                  <div className="text-2xl font-semibold">Home</div>
                  <div>
                    {basketballState.homeScore} - {basketballState.awayScore}
                  </div>
                  <div className="text-2xl font-semibold">Away</div>
                </div>
                <div className="text-3xl">
                  Period {basketballState.period} of {basketballState.totalPeriods}
                </div>
              </div>
            )}
            
            {/* Overlay display when showing media */}
            {!isTimerPage && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-6 rounded-lg text-right">
                <div className="text-6xl font-bold mb-4">
                  {formatTime(basketballState.gameTime)}
                </div>
                <div className="text-4xl mb-2 flex items-center justify-end space-x-4">
                  <div className="text-sm font-semibold">Home</div>
                  <div>
                    {basketballState.homeScore} - {basketballState.awayScore}
                  </div>
                  <div className="text-sm font-semibold">Away</div>
                </div>
                <div className="text-xl">
                  Period {basketballState.period} of {basketballState.totalPeriods}
                </div>
              </div>
            )}
          </>
        )}

        {/* Custom Timer Display */}
        {activeTimer === 'custom' && customTimerState && (
          <>
            {/* Prominent center display when isTimerPage is true */}
            {isTimerPage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-[128px] font-bold">
                  {formatTime(customTimerState.timeRemaining)}
                </div>
              </div>
            )}
            
            {/* Overlay display when showing media */}
            {!isTimerPage && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-6 rounded-lg text-right">
                <div className="text-6xl font-bold">
                  {formatTime(customTimerState.timeRemaining)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 