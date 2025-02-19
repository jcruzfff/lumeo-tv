'use client';

import { useState, useEffect } from 'react';
import { useTimer } from '../contexts/TimerContext';
import { useMedia } from '../contexts/MediaContext';
import Image from 'next/image';
import { usePokerRoom } from '../contexts/PokerRoomContext';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Display() {
  const { activeTimer, pokerState, basketballState, customTimerState, setBasketballState, setActiveTimer, setPokerState } = useTimer();
  const { mediaItems, currentMediaIndex, setCurrentMediaIndex, setMediaItems } = useMedia();
  const { waitingList, isRoomManagementEnabled, showWaitlistOnDisplay, setState: setPokerRoomState, tables } = usePokerRoom();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimerPage, setIsTimerPage] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGameTime, setCurrentGameTime] = useState(0);

  // Add debug logs for waitlist state
  useEffect(() => {
    console.log('Display Page State:', {
      waitingList,
      isRoomManagementEnabled,
      showWaitlistOnDisplay,
      isTimerPage,
      activeTimer
    });
  }, [waitingList, isRoomManagementEnabled, showWaitlistOnDisplay, isTimerPage, activeTimer]);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load media items from localStorage first, then fetch event data
  useEffect(() => {
    if (!isClient) return;

    const loadMediaAndEventData = async () => {
      try {
        // Try to load media items from localStorage first
        const savedMediaState = localStorage.getItem('mediaState');
        if (savedMediaState) {
          const { mediaItems: savedMediaItems, currentMediaIndex: savedIndex } = JSON.parse(savedMediaState);
          console.log('Display - Loading media state:', { 
            mediaItems: savedMediaItems, 
            currentIndex: savedIndex,
            totalItems: savedMediaItems.length 
          });
          setMediaItems(savedMediaItems);
          setCurrentMediaIndex(savedIndex || 0);
        }

        // Load poker room state from localStorage if available
        const savedPokerRoomState = localStorage.getItem('pokerRoomState');
        console.log('Loaded poker room state from localStorage:', savedPokerRoomState);
        
        if (savedPokerRoomState) {
          const pokerRoomState = JSON.parse(savedPokerRoomState);
          console.log('Parsed poker room state:', pokerRoomState);
          // Ensure room management settings are properly initialized
          const updatedState = {
            ...pokerRoomState,
            isRoomManagementEnabled: true,
            showWaitlistOnDisplay: true
          };
          console.log('Setting poker room state to:', updatedState);
          setPokerRoomState(updatedState);
        } else {
          console.log('No saved poker room state found, initializing with defaults');
          // Initialize poker room state if not present
          const initialState = {
            tables: [],
            waitingList: [],
            showRoomInfo: true,
            isRoomManagementEnabled: true,
            showWaitlistOnDisplay: true
          };
          setPokerRoomState(initialState);
          localStorage.setItem('pokerRoomState', JSON.stringify(initialState));
        }

        // Load display settings
        const savedDisplaySettings = localStorage.getItem('displaySettings');
        if (savedDisplaySettings) {
          const settings = JSON.parse(savedDisplaySettings);
          console.log('Display - Media interval settings:', { 
            interval: settings.mediaInterval,
            showTimer: settings.showTimer
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };

    loadMediaAndEventData();
  }, [isClient, setMediaItems, setPokerRoomState, setCurrentMediaIndex]);

  // Media cycling effect
  useEffect(() => {
    if (!isClient || mediaItems.length === 0) {
      console.log('Media cycle skipped: Client not ready or no media items');
      return;
    }

    const savedDisplaySettings = localStorage.getItem('displaySettings');
    const displaySettings = savedDisplaySettings ? JSON.parse(savedDisplaySettings) : { mediaInterval: 15 };
    const intervalInMs = displaySettings.mediaInterval * 1000;
    
    console.log('Setting up media cycle:', {
      isTimerPage,
      currentIndex: currentMediaIndex,
      totalItems: mediaItems.length,
      intervalMs: intervalInMs,
      timestamp: new Date().toISOString()
    });

    const cycleTimeout = setInterval(() => {
      console.log('Media cycle triggered:', {
        wasTimerPage: isTimerPage,
        currentIndex: currentMediaIndex,
        totalItems: mediaItems.length,
        timestamp: new Date().toISOString()
      });

      if (isTimerPage) {
        setIsTimerPage(false);
      } else {
        const isLastMedia = currentMediaIndex === mediaItems.length - 1;
        if (isLastMedia) {
          // Update both states in a single render cycle
          Promise.resolve().then(() => {
            setIsTimerPage(true);
            setCurrentMediaIndex(0);
          });
        } else {
          setCurrentMediaIndex(currentMediaIndex + 1);
        }
      }
    }, intervalInMs);

    return () => {
      console.log('Clearing media cycle interval');
      clearInterval(cycleTimeout);
    };
  }, [isClient, mediaItems.length, currentMediaIndex, isTimerPage, setCurrentMediaIndex]);

  // Track media changes with more detailed logging
  useEffect(() => {
    console.log('Display - Media changed:', {
      currentIndex: currentMediaIndex,
      totalItems: mediaItems.length,
      currentItem: mediaItems[currentMediaIndex],
      isTimerPage,
      timestamp: new Date().toISOString(),
      nextState: isTimerPage ? 'will show media' : currentMediaIndex === mediaItems.length - 1 ? 'will show timer' : 'will show next media'
    });
  }, [currentMediaIndex, mediaItems, isTimerPage]);

  // Timer countdown effect
  useEffect(() => {
    if (!isClient) return;

    // No timer logic needed here as it's handled in TimerContext
    return () => {};
  }, [isClient]);

  // Basketball timer effect with accurate timing
  useEffect(() => {
    if (!isClient || !basketballState?.isRunning) return;

    // No timer logic needed here as it's handled in TimerContext
    return () => {};
  }, [isClient, basketballState?.isRunning]);

  // Poll for poker room state updates
  useEffect(() => {
    if (!isClient) return;

    const pollPokerRoomState = () => {
      try {
        const savedState = localStorage.getItem('pokerRoomState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Only update if the state has actually changed
          const currentState = {
            waitingList: waitingList,
            isRoomManagementEnabled,
            showWaitlistOnDisplay,
            tables
          };
          
          const hasStateChanged = JSON.stringify(currentState) !== JSON.stringify({
            waitingList: parsedState.waitingList,
            isRoomManagementEnabled: parsedState.isRoomManagementEnabled,
            showWaitlistOnDisplay: parsedState.showWaitlistOnDisplay,
            tables: parsedState.tables
          });

          if (hasStateChanged) {
            console.log('Poker room state changed, updating from localStorage:', parsedState);
            setPokerRoomState(parsedState);
          }
        }
      } catch (error) {
        console.error('Error polling poker room state:', error);
      }
    };

    // Initial check
    pollPokerRoomState();

    // Set up polling interval
    const interval = setInterval(pollPokerRoomState, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [isClient, setPokerRoomState, waitingList, isRoomManagementEnabled, showWaitlistOnDisplay, tables]);

  // Monitor state changes
  useEffect(() => {
    console.log('Detailed State:', {
      currentMediaIndex,
      mediaItemsPresent: mediaItems.length > 0,
      waitlistState: {
        isRoomManagementEnabled,
        showWaitlistOnDisplay,
        waitingListLength: waitingList.length,
        waitingList: waitingList.map(player => ({ id: player.id, name: player.name }))
      },
      displayConditions: {
        roomManagementEnabled: isRoomManagementEnabled,
        waitlistDisplayEnabled: showWaitlistOnDisplay,
        hasWaitingPlayers: waitingList.length > 0,
        allConditionsMet: isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0
      }
    });
  }, [currentMediaIndex, mediaItems, isRoomManagementEnabled, showWaitlistOnDisplay, waitingList]);

  // Add console log for media rendering
  useEffect(() => {
    if (!isTimerPage) {
      console.log('Rendering media:', {
        index: currentMediaIndex,
        type: mediaItems[currentMediaIndex].type,
        path: mediaItems[currentMediaIndex].path
      });
    }
  }, [isTimerPage, currentMediaIndex, mediaItems]);

  // Monitor basketball state changes
  useEffect(() => {
    if (activeTimer === 'basketball' && basketballState) {
      console.log('Basketball state updated:', {
        homeScore: basketballState.homeScore,
        awayScore: basketballState.awayScore,
        isRunning: basketballState.isRunning,
        period: basketballState.period
      });
    }
  }, [activeTimer, basketballState]);

  useEffect(() => {
    if (activeTimer === 'basketball' && basketballState) {
      setCurrentGameTime(basketballState.gameTime);
    }
  }, [activeTimer, basketballState]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error(err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // Listen for event end broadcasts
    const bc = new BroadcastChannel('lumeo-events');
    bc.onmessage = (event) => {
      if (event.data.type === 'END_EVENT') {
        // Clear all local state
        localStorage.removeItem('timerState');
        localStorage.removeItem('activeEventId');
        localStorage.removeItem('mediaState');
        localStorage.removeItem('displaySettings');
        localStorage.removeItem('pokerRoomState');
        localStorage.removeItem('timerPersistentState');

        // Clear React state
        setMediaItems([]);
        setCurrentMediaIndex(0);
        setIsTimerPage(true);
        setPokerRoomState({
          tables: [],
          waitingList: [],
          showRoomInfo: true,
          isRoomManagementEnabled: false,
          showWaitlistOnDisplay: false
        });

        // Close the display window
        window.close();
      }
    };

    return () => {
      bc.close();
    };
  }, [setMediaItems, setCurrentMediaIndex, setPokerRoomState]);

  // Poll for basketball score updates
  useEffect(() => {
    if (!isClient || activeTimer !== 'basketball') return;

    const loadState = () => {
      const savedState = localStorage.getItem('timerState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.basketballState) {
          setBasketballState(parsedState.basketballState);
        }
      }
    };

    loadState();

    const pollInterval = setInterval(() => {
      const eventId = localStorage.getItem('activeEventId');
      if (eventId) {
        fetch(`/api/events/${eventId}/score`)
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
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isClient, activeTimer, setBasketballState]);

  useEffect(() => {
    if (!isClient) return;

    // Check if we have an active event
    const eventId = localStorage.getItem('activeEventId');
    if (!eventId) return;

    // For basketball events
    if (activeTimer === 'basketball' && basketballState) {
      if (!basketballState.isRunning && currentGameTime <= 0) {
        const savedTimerPersistentState = localStorage.getItem('timerPersistentState');
        if (savedTimerPersistentState) {
          const persistentState = JSON.parse(savedTimerPersistentState);
          if (persistentState.period >= (basketballState.totalPeriods || 4)) {
            // Game has ended naturally - update the event status
            fetch(`/api/events/${eventId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'ENDED',
                settings: {
                  ...basketballState,
                  gameTime: 0,
                  period: persistentState.period,
                  winningTeam: basketballState.homeScore > basketballState.awayScore ? 'Home' : 
                             basketballState.awayScore > basketballState.homeScore ? 'Away' : 'Tie',
                  finalScore: {
                    home: basketballState.homeScore,
                    away: basketballState.awayScore
                  }
                }
              }),
            }).then(() => {
              // Broadcast event end
              const bc = new BroadcastChannel('lumeo-events');
              bc.postMessage({ type: 'END_EVENT', eventId });
              bc.close();
              
              // Redirect to history page
              window.location.href = '/events/history';
            }).catch(error => {
              console.error('Error ending basketball event:', error);
            });
          }
        }
      }
    }

    // For poker events
    if (activeTimer === 'poker' && pokerState) {
      if (!pokerState.isRunning && pokerState.timeRemaining <= 0 && pokerState.currentLevel >= pokerState.levels.length - 1) {
        // Tournament has ended naturally - update the event status
        fetch(`/api/events/${eventId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'ENDED',
            settings: {
              ...pokerState,
              isRunning: false,
              gameDetails: {
                totalLevels: pokerState.levels.length,
                currentLevel: pokerState.currentLevel,
                totalPlayTime: pokerState.totalPlayTime,
                mediaCount: mediaItems.length
              }
            }
          }),
        }).then(() => {
          // Broadcast event end
          const bc = new BroadcastChannel('lumeo-events');
          bc.postMessage({ type: 'END_EVENT', eventId });
          bc.close();
          
          // Redirect to history page
          window.location.href = '/events/history';
        }).catch(error => {
          console.error('Error ending poker event:', error);
        });
      }
    }
  }, [isClient, activeTimer, basketballState, pokerState, currentGameTime, mediaItems.length]);

  // Update the useEffect for timer state
  useEffect(() => {
    if (!isClient) return;

    const loadState = () => {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { activeTimer: savedActiveTimer, pokerState: savedPokerState } = JSON.parse(timerState);
          if (savedActiveTimer === 'poker' && savedPokerState) {
            setActiveTimer('poker');
            setPokerState(savedPokerState);
          }
        } catch (error) {
          console.error('Error loading timer state:', error);
        }
      }
    };

    loadState();

    // Listen for timer updates
    const bc = new BroadcastChannel('lumeo-events');
    bc.onmessage = (event) => {
      if (event.data.type === 'TIMER_UPDATE') {
        loadState();
      } else if (event.data.type === 'END_EVENT') {
        // Clear all state
        localStorage.removeItem('timerState');
        localStorage.removeItem('activeEventId');
        localStorage.removeItem('mediaState');
        localStorage.removeItem('displaySettings');
        localStorage.removeItem('pokerRoomState');
        localStorage.removeItem('timerPersistentState');
        window.close();
      }
    };

    return () => {
      bc.close();
    };
  }, [isClient, setActiveTimer, setPokerState]);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading...</h1>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  if (error || !activeTimer || (!pokerState && !basketballState && !customTimerState)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-background text-text-primary">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p>{error || 'No active timer found. Please set up a timer in the admin dashboard.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-background">
      {/* Media display */}
      {!isTimerPage && currentMediaIndex < mediaItems.length && (
        mediaItems[currentMediaIndex].type === 'video' ? (
          <video
            key={mediaItems[currentMediaIndex].id}
            src={mediaItems[currentMediaIndex].path}
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
        ) : (
          <Image
            key={mediaItems[currentMediaIndex].id}
            src={mediaItems[currentMediaIndex].path}
            alt="Display content"
            fill
            className="object-contain"
            unoptimized
          />
        )
      )}

      {/* Basketball Timer Display */}
      {activeTimer === 'basketball' && basketballState && (
        <>
          {/* Prominent center display when isTimerPage is true */}
          {isTimerPage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary p-8 rounded-lg text-center shadow-2xl">
              <div className="text-8xl font-mono mb-6 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatTime(basketballState.gameTime)}
              </div>
              <div className="text-6xl mb-4 flex items-center justify-center space-x-8">
                <div className="text-2xl font-semibold text-text-secondary">Home</div>
                <div className="bg-dark-surface-lighter px-6 py-2 rounded-lg">
                  {basketballState.homeScore} - {basketballState.awayScore}
                </div>
                <div className="text-2xl font-semibold text-text-secondary">Away</div>
              </div>
              <div className="text-3xl text-text-secondary">
                Period {basketballState.period} of {basketballState.totalPeriods}
              </div>
            </div>
          )}
          
          {/* Overlay display when showing media */}
          {!isTimerPage && (
            <div className="absolute top-4 right-4 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary p-6 rounded-lg text-right z-50 shadow-xl">
              <div className="text-6xl font-mono mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatTime(basketballState.gameTime)}
              </div>
              <div className="text-4xl mb-2 flex items-center justify-end space-x-4">
                <div className="text-sm font-semibold text-text-secondary">Home</div>
                <div className="bg-dark-surface-lighter px-4 py-1 rounded-lg">
                  {basketballState.homeScore} - {basketballState.awayScore}
                </div>
                <div className="text-sm font-semibold text-text-secondary">Away</div>
              </div>
              <div className="text-xl text-text-secondary">
                Period {basketballState.period} of {basketballState.totalPeriods}
              </div>
            </div>
          )}
        </>
      )}

      {/* Poker Timer Display */}
      {activeTimer === 'poker' && pokerState && (
        <>
          {/* Prominent center display when isTimerPage is true */}
          {isTimerPage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary p-8 rounded-lg text-center shadow-2xl">
              <div className="text-8xl font-mono mb-6 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatTime(pokerState.timeRemaining)}
              </div>
              <div className="text-4xl mb-4 bg-dark-surface-lighter px-6 py-2 rounded-lg">
                Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
              </div>
              <div className="text-2xl text-text-secondary">
                Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
              </div>

              {/* Main Waitlist Display */}
              {isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0 && (
                console.log('Waitlist display conditions:', {
                  isRoomManagementEnabled,
                  showWaitlistOnDisplay,
                  waitingListLength: waitingList.length,
                  waitingListData: waitingList,
                  shouldDisplay: isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0
                }),
                <div className="mt-8 pt-8 border-t border-dark-border/20">
                  <h3 className="text-2xl font-semibold mb-4 text-text-primary">Waiting List</h3>
                  <div className="flex flex-col items-center space-y-2">
                    {waitingList.slice(0, 5).map((player, index) => (
                      <div key={player.id} className="text-xl text-text-secondary">
                        {index + 1}. {player.name}
                      </div>
                    ))}
                    {waitingList.length > 5 && (
                      <div className="text-lg text-text-tertiary">
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
            <div className="absolute top-4 right-4 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary p-6 rounded-lg text-right z-50 shadow-xl">
              <div className="text-6xl font-mono mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatTime(pokerState.timeRemaining)}
              </div>
              <div className="text-3xl mb-2 bg-dark-surface-lighter px-4 py-1 rounded-lg">
                Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
              </div>
              <div className="text-xl text-text-secondary mb-4">
                Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
              </div>

              {/* Overlay Waitlist Display */}
              {isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0 && (
                console.log('Overlay waitlist display conditions:', {
                  isTimerPage,
                  isRoomManagementEnabled,
                  showWaitlistOnDisplay,
                  waitingListLength: waitingList.length,
                  waitingListData: waitingList,
                  shouldDisplay: !isTimerPage && isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0
                }),
                <div className="mt-4 pt-4 border-t border-dark-border/20 text-left">
                  <h4 className="text-lg font-medium mb-2 text-text-primary">Next Up:</h4>
                  <div className="space-y-1">
                    {waitingList.slice(0, 3).map((player, index) => (
                      <div key={player.id} className="text-sm text-text-secondary">
                        {index + 1}. {player.name}
                      </div>
                    ))}
                    {waitingList.length > 3 && (
                      <div className="text-xs text-text-tertiary">
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

      {/* Custom Timer Display */}
      {activeTimer === 'custom' && customTimerState && (
        <>
          {/* Prominent center display when isTimerPage is true */}
          {isTimerPage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary p-8 rounded-lg text-center shadow-2xl">
              <div className="text-8xl font-mono bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatTime(customTimerState.timeRemaining)}
              </div>
            </div>
          )}
          
          {/* Overlay display when showing media */}
          {!isTimerPage && (
            <div className="absolute top-4 right-4 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary p-6 rounded-lg text-right z-50 shadow-xl">
              <div className="text-6xl font-mono bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {formatTime(customTimerState.timeRemaining)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 bg-dark-card backdrop-blur-md border border-dark-border/20 text-text-primary px-4 py-2 rounded-lg hover:bg-dark-surface-lighter transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </button>
    </div>
  );
} 