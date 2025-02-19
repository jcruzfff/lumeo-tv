'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '@/app/contexts/TimerContext';
import { useMedia } from '@/app/contexts/MediaContext';
import { MediaItem, BasketballTimerState } from '@/app/types';
import Image from 'next/image';
import { X } from 'lucide-react';
import { usePokerRoom } from '@/app/contexts/PokerRoomContext';

import WaitingList from '@/app/components/poker/WaitingList';
import TableManager from '@/app/components/poker/TableManager';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface TimerPersistentState {
  startTime: number;
  initialGameTime: number;
  isRunning: boolean;
  period: number;
  totalPeriods: number;
}

export default function ActiveEvents() {
  const { activeTimer, basketballState, pokerState, setBasketballState, setPokerState, setActiveTimer, updateBasketballScore } = useTimer();
  const { mediaItems, setMediaItems, storeMediaItems } = useMedia();
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
  } = usePokerRoom();
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'time-score' | 'media'>('time-score');
  const [isEventEnded, setIsEventEnded] = useState(false);
  const [currentGameTime, setCurrentGameTime] = useState<number>(0);

  // Memoize the loadEventData function with useCallback
  const loadEventData = useCallback(async () => {
    if (typeof window !== 'undefined') {
      console.log('Loading event data...');
      
      // Get the actual host URL
      const protocol = window.location.protocol;
      const host = window.location.host;
      setDisplayUrl(`${protocol}//${host}/display`);
      
      const savedEventId = localStorage.getItem('activeEventId');
      if (savedEventId) {
        try {
          console.log('Fetching event data for ID:', savedEventId);
          const response = await fetch(`/api/events/${savedEventId}`);
          const event = await response.json();
          console.log('Fetched event data:', event);
          
          // Set event name and status
          setEventName(event.name || 'Basketball Game');
          setIsEventEnded(event.status === 'ENDED');

          // Load media items and store in localStorage
          if (event.mediaItems && event.mediaItems.length > 0) {
            console.log('Setting media items:', event.mediaItems);
            setMediaItems(event.mediaItems);
            storeMediaItems(event.mediaItems);
          }

          // Set active timer if not already set
          if (!activeTimer) {
            setActiveTimer('basketball');
          }

          // Load timer state from localStorage
          const savedTimerPersistentState = localStorage.getItem('timerPersistentState');
          if (savedTimerPersistentState && !isEventEnded) {
            console.log('Loading timer state from localStorage:', savedTimerPersistentState);
            const persistentState: TimerPersistentState = JSON.parse(savedTimerPersistentState);
            
            // Calculate current game time
            const elapsedSeconds = persistentState.isRunning ? 
              Math.floor((Date.now() - persistentState.startTime) / 1000) : 0;
            const currentTime = Math.max(0, persistentState.initialGameTime - elapsedSeconds);
            
            console.log('Timer state calculation:', {
              persistentState,
              elapsedSeconds,
              currentTime,
              now: new Date().toISOString(),
              startTime: new Date(persistentState.startTime).toISOString()
            });
            
            setCurrentGameTime(currentTime);

            // Update basketball state if needed and if it's different from current state
            if (basketballState) {
              const updatedState = {
                ...basketballState,
                gameTime: currentTime,
                period: persistentState.period,
                isRunning: persistentState.isRunning,
                totalPeriods: persistentState.totalPeriods
              };

              // Only update if state has actually changed
              if (JSON.stringify(basketballState) !== JSON.stringify(updatedState)) {
                console.log('Updating basketball state with persistent state');
                setBasketballState(updatedState);
              }
            }
          } else if (event.settings && !isEventEnded) {
            // If no persistent state exists, initialize from event settings
            console.log('Initializing timer state from event settings:', event.settings);
            const settings = event.settings as BasketballTimerState;
            const initialGameTime = settings.gameTime;
            
            // Create and save persistent state
            const newPersistentState: TimerPersistentState = {
              startTime: Date.now(),
              initialGameTime,
              isRunning: settings.isRunning || false,
              period: settings.period || 1,
              totalPeriods: settings.totalPeriods || 4
            };
            localStorage.setItem('timerPersistentState', JSON.stringify(newPersistentState));
            setCurrentGameTime(initialGameTime);

            if (!basketballState) {
              setBasketballState({
                isRunning: settings.isRunning || false,
                gameTime: initialGameTime,
                period: settings.period || 1,
                homeScore: settings.homeScore || 0,
                awayScore: settings.awayScore || 0,
                totalPeriods: settings.totalPeriods || 4
              });
            }
          }

          // Listen for score updates from other windows
          const bc = new BroadcastChannel('lumeo-events');
          bc.onmessage = (event) => {
            if (event.data.type === 'SCORE_UPDATE' && event.data.source !== 'current-window') {
              const newState = event.data.state;
              if (basketballState?.homeScore !== newState.homeScore || 
                  basketballState?.awayScore !== newState.awayScore) {
                updateBasketballScore(newState.homeScore, newState.awayScore);
              }
            } else if (event.data.type === 'TIMER_UPDATE') {
              const newState = event.data.state;
              if (newState?.gameTime !== undefined) {
                setCurrentGameTime(newState.gameTime);
              }
            } else if (event.data.type === 'PERIOD_CHANGE') {
              const newState = event.data.state;
              if (basketballState) {
                setBasketballState({
                  ...basketballState,
                  period: newState.period,
                  gameTime: newState.gameTime,
                  isRunning: newState.isRunning
                });
              }
              setCurrentGameTime(newState.gameTime);
            }
          };

          return () => bc.close();
        } catch (error) {
          console.error('Error loading event data:', error);
        }
      }
    }
  }, [activeTimer, setActiveTimer, setMediaItems, storeMediaItems, isEventEnded, basketballState, setBasketballState, updateBasketballScore]);

  // Use the memoized loadEventData function in useEffect
  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Separate effect for timer updates
  useEffect(() => {
    if (isEventEnded) return;

    const timerInterval = setInterval(() => {
      const savedTimerPersistentState = localStorage.getItem('timerPersistentState');
      if (savedTimerPersistentState) {
        const persistentState: TimerPersistentState = JSON.parse(savedTimerPersistentState);
        if (persistentState.isRunning) {
          const elapsedSeconds = Math.floor((Date.now() - persistentState.startTime) / 1000);
          const currentTime = Math.max(0, persistentState.initialGameTime - elapsedSeconds);
          setCurrentGameTime(currentTime);
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isEventEnded]);

  // Move handleAutomaticEventEnd inside useCallback
  const handleAutomaticEventEnd = useCallback(async (eventId: string, persistentState: TimerPersistentState) => {
    try {
      // Determine winning team
      const homeScore = basketballState?.homeScore ?? 0;
      const awayScore = basketballState?.awayScore ?? 0;
      const winningTeam = homeScore > awayScore ? 'Home' : 
                         awayScore > homeScore ? 'Away' : 'Tie';

      // Update the event settings with final state
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ENDED',
          settings: {
            ...basketballState,
            gameTime: 0, // Time is up
            period: persistentState.period,
            winningTeam,
            finalScore: {
              home: homeScore,
              away: awayScore
            },
            gameDetails: {
              periodLength: Math.floor(persistentState.initialGameTime / 60),
              format: persistentState.period <= 2 ? 'Halves' : 'Quarters',
              intervals: 15,
              mediaCount: mediaItems.length
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end event automatically');
      }

      // Broadcast event end to all display windows
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ type: 'END_EVENT', eventId });
      bc.close();

      // Clear all state
      setBasketballState(() => ({
        isRunning: false,
        gameTime: 0,
        period: 1,
        homeScore: 0,
        awayScore: 0,
        totalPeriods: 4
      }));
      setActiveTimer(null);
      setIsEventEnded(true);
      localStorage.removeItem('timerState');
      localStorage.removeItem('timerPersistentState');
      localStorage.removeItem('activeEventId');
      localStorage.removeItem('mediaState');

      // Show a notification that the game has ended
      alert('Game has ended! Redirecting to event history...');

      // Redirect to history page
      window.location.href = '/events/history';
    } catch (error) {
      console.error('Error ending event automatically:', error);
    }
  }, [basketballState, mediaItems.length, setBasketballState, setActiveTimer, setIsEventEnded]);

  // Effect to update the timer display in real-time
  useEffect(() => {
    if (!basketballState?.isRunning || isEventEnded) {
      console.log('Timer not running or event ended:', {
        isRunning: basketballState?.isRunning,
        isEventEnded,
        currentGameTime,
        period: basketballState?.period
      });
      return;
    }

    const savedTimerPersistentState = localStorage.getItem('timerPersistentState');
    if (!savedTimerPersistentState) {
      console.log('No persistent timer state found');
      return;
    }

    const persistentState: TimerPersistentState = JSON.parse(savedTimerPersistentState);
    if (!persistentState.isRunning) {
      console.log('Persistent state indicates timer not running:', persistentState);
      return;
    }
    
    console.log('Timer state initialized:', {
      persistentState,
      basketballState,
      currentGameTime
    });
    
    // Initial calculation
    const calculateTime = () => {
      const elapsedSeconds = Math.floor((Date.now() - persistentState.startTime) / 1000);
      const newTime = Math.max(0, persistentState.initialGameTime - elapsedSeconds);
      console.log('Time calculation:', {
        startTime: new Date(persistentState.startTime).toISOString(),
        elapsedSeconds,
        initialGameTime: persistentState.initialGameTime,
        newTime,
        period: persistentState.period
      });
      return newTime;
    };
    
    setCurrentGameTime(calculateTime());

    // Update every second
    const interval = setInterval(() => {
      const newTime = calculateTime();
      setCurrentGameTime(newTime);

      // If time has run out
      if (newTime <= 0) {
        console.log('Period ended:', {
          period: persistentState.period,
          totalPeriods: basketballState?.totalPeriods,
          isLastPeriod: persistentState.period >= (basketballState?.totalPeriods || 4)
        });
        
        clearInterval(interval);
        
        // Check if this is the last period
        const totalPeriods = basketballState?.totalPeriods || 4;
        if (persistentState.period >= totalPeriods) {
          // Last period ended - automatically end the event
          const eventId = localStorage.getItem('activeEventId');
          if (!eventId || isEventEnded) return;
          console.log('Game complete - ending event');
          handleAutomaticEventEnd(eventId, persistentState);
        }
      }
    }, 1000);

    return () => {
      console.log('Cleaning up timer interval');
      clearInterval(interval);
    };
  }, [basketballState?.isRunning, basketballState?.totalPeriods, isEventEnded, handleAutomaticEventEnd, currentGameTime, basketballState]);

  // Update the display of period information
  const getPeriodDisplay = () => {
    if (!basketballState) return '';
    return `Period ${basketballState.period}/${basketballState.totalPeriods}`;
  };

  const handleEndEvent = async () => {
    if (!window.confirm('Are you sure you want to end this event? This action cannot be undone.')) return;

    const eventId = localStorage.getItem('activeEventId');
    if (!eventId) return;

    try {
      // Get the final state from persistent storage
      const savedTimerPersistentState = localStorage.getItem('timerPersistentState');
      const persistentState: TimerPersistentState = savedTimerPersistentState ? 
        JSON.parse(savedTimerPersistentState) : null;

      // Determine winning team
      const homeScore = basketballState?.homeScore ?? 0;
      const awayScore = basketballState?.awayScore ?? 0;
      const winningTeam = homeScore > awayScore ? 'Home' : 
                         awayScore > homeScore ? 'Away' : 'Tie';

      // Update the event settings with final state
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ENDED',
          settings: {
            ...basketballState,
            gameTime: currentGameTime,
            period: persistentState?.period ?? basketballState?.period,
            winningTeam,
            finalScore: {
              home: homeScore,
              away: awayScore
            },
            gameDetails: {
              periodLength: Math.floor((persistentState?.initialGameTime ?? 0) / 60),
              format: (persistentState?.period ?? 0) <= 2 ? 'Halves' : 'Quarters',
              intervals: 15,
              mediaCount: mediaItems.length
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end event');
      }

      // Broadcast event end to all display windows
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ type: 'END_EVENT', eventId });
      bc.close();

      // Clear all state
      setBasketballState(() => ({
        isRunning: false,
        gameTime: 0,
        period: 1,
        homeScore: 0,
        awayScore: 0,
        totalPeriods: 4
      }));
      setActiveTimer(null);
      setIsEventEnded(true);
      localStorage.removeItem('timerState');
      localStorage.removeItem('timerPersistentState');
      localStorage.removeItem('activeEventId');
      localStorage.removeItem('mediaState');

      // Redirect to history page
      window.location.href = '/events/history';
    } catch (error) {
      console.error('Error ending event:', error);
      alert('Failed to end event. Please try again.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newMediaItems: MediaItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      path: URL.createObjectURL(file),
      duration: file.type.startsWith('video/') ? undefined : 15,
    }));
    
    const updatedItems = [...mediaItems, ...newMediaItems];
    setMediaItems(updatedItems);
    storeMediaItems(updatedItems);
  };

  const handleRemoveMedia = (id: string) => {
    const updatedItems = mediaItems.filter(item => item.id !== id);
    setMediaItems(updatedItems);
    storeMediaItems(updatedItems);
  };

  const updateScore = (team: 'home' | 'away', points: number) => {
    if (!basketballState) return;

    // Calculate new score
    const currentScore = team === 'home' ? basketballState.homeScore : basketballState.awayScore;
    const newScore = Math.max(0, currentScore + points);
    const newHomeScore = team === 'home' ? newScore : basketballState.homeScore;
    const newAwayScore = team === 'away' ? newScore : basketballState.awayScore;

    // Update scores using the context method that preserves timer state
    updateBasketballScore(newHomeScore, newAwayScore);

    // Send score update to the server
    const eventId = localStorage.getItem('activeEventId');
    if (eventId) {
      // Broadcast score update to other windows
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ 
        type: 'SCORE_UPDATE',
        source: 'current-window',
        state: {
          homeScore: newHomeScore,
          awayScore: newAwayScore
        }
      });
      bc.close();

      fetch(`/api/events/${eventId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeScore: newHomeScore,
          awayScore: newAwayScore,
        }),
      }).catch(error => {
        console.error('Error updating score:', error);
      });
    }
  };

  // Add handleEndPokerEvent function
  const handleEndPokerEvent = async () => {
    if (!window.confirm('Are you sure you want to end this poker event? This action cannot be undone.')) return;

    const eventId = localStorage.getItem('activeEventId');
    if (!eventId) return;

    try {
      // Update the event settings with final state
      const response = await fetch(`/api/events/${eventId}`, {
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
              totalLevels: pokerState?.levels.length,
              currentLevel: pokerState?.currentLevel,
              totalPlayTime: pokerState?.totalPlayTime,
              mediaCount: mediaItems.length,
              roomManagement: {
                isRoomManagementEnabled: true,
                tables,
                waitingList
              }
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end event');
      }

      // Broadcast event end to all display windows
      const bc = new BroadcastChannel('lumeo-events');
      bc.postMessage({ type: 'END_EVENT', eventId });
      bc.close();

      // Clear all state
      setPokerState(null);
      setActiveTimer(null);
      setIsEventEnded(true);
      setMediaItems([]);
      
      // Clear all localStorage items
      localStorage.removeItem('timerState');
      localStorage.removeItem('pokerRoomState');
      localStorage.removeItem('activeEventId');
      localStorage.removeItem('mediaState');
      localStorage.removeItem('displaySettings');

      // Redirect to history page
      window.location.href = '/events/history';
    } catch (error) {
      console.error('Error ending event:', error);
      alert('Failed to end event. Please try again.');
    }
  };

  const handlePauseResume = () => {
    if (!pokerState) return;
    setPokerState({
      ...pokerState,
      isRunning: !pokerState.isRunning
    });
  };

  if (!activeTimer) {
    return (
      <div className="min-h-screen bg-[#161618] border-l border-t border-[#2C2C2E] rounded-tl-[32px] p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-8">Active Events</h1>
          <div className="text-center text-text-secondary py-12">
            No active events. Create a new event to get started.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161618] border-l border-t border-[#2C2C2E] rounded-tl-[32px] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-8">Active Events</h1>

        {activeTimer === 'poker' && pokerState && (
          <div className="grid grid-cols-[400px_1fr] gap-8">
            {/* Left Column - Game Details & Waitlist */}
            <div className="space-y-6">
              {/* Game Details */}
              <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-text-primary">Game Details</h2>
                  <p className="text-text-secondary mt-2">Current game status and controls</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-[64px] font-bold text-white leading-none">
                      {formatTime(pokerState.timeRemaining)}
                    </div>
                    <div className="text-text-secondary mt-2">
                      Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-text-secondary mb-1">Small Blind</div>
                      <div className="text-xl font-mono text-text-primary">
                        ${pokerState.levels[pokerState.currentLevel].smallBlind}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-text-secondary mb-1">Big Blind</div>
                      <div className="text-xl font-mono text-text-primary">
                        ${pokerState.levels[pokerState.currentLevel].bigBlind}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePauseResume}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        pokerState.isRunning
                          ? 'bg-status-error hover:bg-status-error/90 text-white'
                          : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                      }`}
                    >
                      {pokerState.isRunning ? 'Pause Timer' : 'Start Timer'}
                    </button>
                    <button
                      onClick={handleEndPokerEvent}
                      className="px-4 py-2 rounded-lg font-medium bg-dark-surface text-text-primary hover:bg-dark-surface-lighter transition-colors"
                    >
                      End Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Waitlist */}
              <WaitingList
                players={waitingList}
                onAddPlayerAction={addToWaitingList}
                onRemovePlayerAction={removeFromWaitingList}
                onReorderPlayersAction={reorderWaitingList}
              />
            </div>

            {/* Right Column - Table Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-text-primary">Table Management</h2>
                  <p className="text-text-secondary mt-2">Manage poker tables and seating</p>
                </div>
                <button
                  onClick={addTable}
                  className="px-4 py-2 rounded-lg font-medium bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors"
                >
                  +Add Table
                </button>
              </div>

              <TableManager
                tables={tables}
                onAssignSeatAction={assignSeat}
                onEmptySeatAction={emptySeat}
                onRemoveTableAction={removeTable}
              />
            </div>
          </div>
        )}

        {activeTimer === 'basketball' && basketballState && (
          <div className="bg-dark-surface/80 backdrop-blur-sm border border-[#2C2C2E] rounded-[24px] p-8">
            {/* Event Header */}
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{eventName}</h2>
                <p className="text-text-secondary mt-2">
                  Display URL: <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">{displayUrl}</a>
                </p>
              </div>
              {!isEventEnded && (
                <button
                  onClick={handleEndEvent}
                  className="px-4 py-2 bg-status-error hover:bg-status-error/90 text-white font-medium rounded-lg transition-colors"
                >
                  End Lumeo
                </button>
              )}
            </div>

            <div className="grid grid-cols-[400px_1fr] gap-8">
              {/* Left Column - Display Card */}
              <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">{eventName}</h3>
                <div className="text-[64px] font-bold text-white leading-none mb-8">
                  {formatTime(currentGameTime)}
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Period Length</div>
                    <div className="text-xl font-mono text-text-primary">{Math.floor(currentGameTime / 60)} min</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Format</div>
                    <div className="text-xl font-mono text-text-primary">
                      {basketballState.totalPeriods === 2 ? 'Halves' : 'Quarters'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-text-secondary mb-1">Period</div>
                    <div className="text-xl font-mono text-text-primary">
                      {getPeriodDisplay()}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-text-secondary mb-1">Intervals</div>
                    <div className="text-xl font-mono text-text-primary">15 seconds</div>
                  </div>
                </div>

                {!isEventEnded && (
                  <button
                    onClick={() => {
                      const protocol = window.location.protocol;
                      const host = window.location.host;
                      const displayUrl = `${protocol}//${host}/display`;
                      window.open(displayUrl, '_blank');
                    }}
                    className="w-full py-3 mt-8 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors"
                  >
                    View Lumeo
                  </button>
                )}
              </div>

              {/* Right Column - Management Panel */}
              <div>
                {/* Tabs */}
                <div className="border-b border-[#2C2C2E] mb-6">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('time-score')}
                      className={`px-6 py-3 text-sm font-medium ${
                        activeTab === 'time-score'
                          ? 'text-brand-primary border-b-2 border-brand-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Score Card
                    </button>
                    <button
                      onClick={() => setActiveTab('media')}
                      className={`px-6 py-3 text-sm font-medium ${
                        activeTab === 'media'
                          ? 'text-brand-primary border-b-2 border-brand-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Media
                    </button>
                  </div>
                </div>

                {activeTab === 'time-score' && !isEventEnded && (
                  <>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Basketball Score Card</h3>
                    <p className="text-text-secondary mb-6">Manage the games score card</p>

                    <div className="">
                      {/* Score Management */}
                      <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-6">Score</h3>
                        <div className="grid grid-cols-2 gap-8">
                          {/* Home Team */}
                          <div>
                            <div className="text-sm font-medium text-text-secondary mb-1">Home Team</div>
                            <div className="text-3xl font-bold text-center mb-4 text-text-primary">{basketballState.homeScore}</div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <button
                                onClick={() => updateScore('home', 1)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => updateScore('home', 2)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                              >
                                +2
                              </button>
                              <button
                                onClick={() => updateScore('home', 3)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                              >
                                +3
                              </button>
                            </div>
                            <button
                              onClick={() => updateScore('home', -1)}
                              className="w-full bg-status-error hover:bg-status-error/90 text-white rounded-lg p-2 transition-colors duration-200"
                            >
                              Undo (-1)
                            </button>
                          </div>

                          {/* Away Team */}
                          <div>
                            <div className="text-sm font-medium text-text-secondary mb-1">Away Team</div>
                            <div className="text-3xl font-bold text-center mb-4 text-text-primary">{basketballState.awayScore}</div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <button
                                onClick={() => updateScore('away', 1)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => updateScore('away', 2)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                              >
                                +2
                              </button>
                              <button
                                onClick={() => updateScore('away', 3)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                              >
                                +3
                              </button>
                            </div>
                            <button
                              onClick={() => updateScore('away', -1)}
                              className="w-full bg-status-error hover:bg-status-error/90 text-white rounded-lg p-2 transition-colors duration-200"
                            >
                              Undo (-1)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">Media Items</h3>
                        <p className="text-text-secondary">Manage display media sequence</p>
                      </div>
                      {!isEventEnded && (
                        <div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="media-upload"
                          />
                          <label
                            htmlFor="media-upload"
                            className="inline-flex items-center border border-[#2C2C2E] text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            +Add Media
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="group relative aspect-video bg-[#1F1F21] rounded-lg overflow-hidden border border-[#2C2C2E]"
                        >
                          {item.type === 'image' ? (
                            <Image
                              src={item.path}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <video
                              src={item.path}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {!isEventEnded && (
                            <button
                              onClick={() => handleRemoveMedia(item.id)}
                              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {mediaItems.length === 0 && (
                      <div className="text-center py-12 bg-[#1F1F21] rounded-lg border border-[#2C2C2E]">
                        <p className="text-text-primary text-lg">No media items</p>
                        <p className="text-text-secondary text-sm mt-2">
                          {isEventEnded 
                            ? 'This event has ended'
                            : 'Click +Add Media to get started'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isEventEnded && (
                  <div className="text-center py-6">
                    <p className="text-status-error">This event has ended and can no longer be modified.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 