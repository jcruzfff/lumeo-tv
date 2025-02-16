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
  const { activeTimer, pokerState, basketballState, customTimerState, setPokerState, setBasketballState, setCustomTimerState } = useTimer();
  const { mediaItems, currentMediaIndex, setCurrentMediaIndex } = useMedia();
  const { 
    waitingList, 
    isRoomManagementEnabled, 
    showWaitlistOnDisplay,
    setState: setPokerRoomState 
  } = usePokerRoom();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimerPage, setIsTimerPage] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  console.log('Display component rendered:', {
    mediaItemsLength: mediaItems.length,
    currentMediaIndex,
    activeTimer,
    isTimerPage
  });

  // Timer countdown effect - Only runs on display page
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer === 'basketball' && basketballState?.isRunning) {
      interval = setInterval(() => {
        if (!basketballState) return;
        
        const newGameTime = basketballState.gameTime - 1;
        const newShotClockTime = basketballState.shotClockTime - 1;

        if (newGameTime <= 0) {
          // End of period
          if (basketballState.period < 4) {
            setBasketballState({
              ...basketballState,
              isRunning: false,
              period: basketballState.period + 1,
              gameTime: basketballState.gameTime,
              shotClockTime: 24,
            });
          } else {
            // End of game
            setBasketballState({
              ...basketballState,
              isRunning: false,
            });
          }
        } else {
          setBasketballState({
            ...basketballState,
            gameTime: newGameTime,
            shotClockTime: newShotClockTime <= 0 ? 24 : newShotClockTime,
          });
        }
      }, 1000);
    } else if (activeTimer === 'poker' && pokerState?.isRunning) {
      interval = setInterval(() => {
        if (!pokerState) return;

        if (pokerState.timeRemaining <= 0) {
          if (pokerState.currentLevel < pokerState.levels.length - 1) {
            setPokerState({
              ...pokerState,
              currentLevel: pokerState.currentLevel + 1,
              timeRemaining: pokerState.levels[pokerState.currentLevel + 1].duration * 60,
            });
          } else {
            setPokerState({
              ...pokerState,
              isRunning: false,
            });
          }
        } else {
          setPokerState({
            ...pokerState,
            timeRemaining: pokerState.timeRemaining - 1,
            totalPlayTime: pokerState.totalPlayTime + 1,
          });
        }
      }, 1000);
    } else if (activeTimer === 'custom' && customTimerState?.isRunning) {
      interval = setInterval(() => {
        if (!customTimerState) return;

        if (customTimerState.timeRemaining <= 0) {
          setCustomTimerState({
            ...customTimerState,
            isRunning: false,
          });
        } else {
          setCustomTimerState({
            ...customTimerState,
            timeRemaining: customTimerState.timeRemaining - 1,
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTimer, basketballState, pokerState, customTimerState, setBasketballState, setPokerState, setCustomTimerState]);

  // Media cycling effect - Now includes dedicated timer page in rotation
  useEffect(() => {
    console.log('Media cycling effect triggered:', {
      isTimerPage,
      currentMediaIndex,
      mediaItemsLength: mediaItems.length
    });

    if (mediaItems.length === 0) {
      console.log('No media items available');
      return;
    }

    const cycleTimeout = setTimeout(() => {
      console.log('Cycle timeout triggered');
      if (isTimerPage) {
        // Switch from timer page to first/next media
        setIsTimerPage(false);
      } else {
        const isLastMedia = currentMediaIndex === mediaItems.length - 1;
        if (isLastMedia) {
          // If we're at the last media item, show timer page
          setIsTimerPage(true);
          setCurrentMediaIndex(0); // Reset to first media item
        } else {
          // Move to next media item
          setCurrentMediaIndex(currentMediaIndex + 1);
        }
      }
    }, 15000); // 15 seconds for both timer page and media

    return () => {
      console.log('Cleaning up cycle timeout');
      clearTimeout(cycleTimeout);
    };
  }, [isTimerPage, currentMediaIndex, mediaItems, setCurrentMediaIndex]);

  // Monitor state changes
  useEffect(() => {
    console.log('State changed:', {
      currentMediaIndex,
      mediaItemsPresent: mediaItems.length > 0
    });
  }, [currentMediaIndex, mediaItems]);

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

  // Poll for poker room state updates
  useEffect(() => {
    const loadPokerRoomState = () => {
      const savedState = localStorage.getItem('pokerRoomState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setPokerRoomState(parsedState);
      }
    };

    // Initial load
    loadPokerRoomState();

    // Poll for updates
    const interval = setInterval(loadPokerRoomState, 1000);

    return () => clearInterval(interval);
  }, [setPokerRoomState]);

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

  if (!isClient) {
    return null;
  }

  if (!activeTimer || (!pokerState && !basketballState && !customTimerState)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">No Active Timer</h1>
          <p>Please set up a timer in the admin dashboard first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
            unoptimized // Since we're using local blob URLs
          />
        )
      )}

      {/* Basketball Timer Display */}
      {activeTimer === 'basketball' && basketballState && (
        <>
          {/* Prominent center display when isTimerPage is true */}
          {isTimerPage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-8 rounded-lg text-center">
              <div className="text-8xl font-mono mb-6">
                {formatTime(basketballState.gameTime)}
              </div>
              <div className="text-6xl mb-4 flex items-center justify-center space-x-4">
                <div className="text-2xl font-semibold text-white/80">Home</div>
                <div>{basketballState.homeScore} - {basketballState.awayScore}</div>
                <div className="text-2xl font-semibold text-white/80">Away</div>
              </div>
              <div className="text-3xl opacity-75">
                {basketballState.period === 2 ? 'Half' : 'Quarter'} {basketballState.period}
              </div>
            </div>
          )}
          
          {/* Overlay display when showing media */}
          {!isTimerPage && (
            <div className="absolute top-4 right-4 bg-black/80 text-white p-6 rounded-lg text-right z-50">
              <div className="text-6xl font-mono mb-4">
                {formatTime(basketballState.gameTime)}
              </div>
              <div className="text-4xl mb-2 flex items-center justify-end space-x-4">
                <div className="text-sm font-semibold text-white/80">Home</div>
                <div>{basketballState.homeScore} - {basketballState.awayScore}</div>
                <div className="text-sm font-semibold text-white/80">Away</div>
              </div>
              <div className="text-xl opacity-75">
                {basketballState.period === 2 ? 'Half' : 'Quarter'} {basketballState.period}
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-8 rounded-lg text-center">
              <div className="text-8xl font-mono mb-6">
                {formatTime(pokerState.timeRemaining)}
              </div>
              <div className="text-4xl mb-4">
                Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
              </div>
              <div className="text-2xl opacity-75">
                Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
              </div>

              {/* Waitlist Display */}
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
                      <div className="text-lg opacity-75">
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
            <div className="absolute top-4 right-4 bg-black/80 text-white p-6 rounded-lg text-right z-50">
              <div className="text-6xl font-mono mb-4">
                {formatTime(pokerState.timeRemaining)}
              </div>
              <div className="text-3xl mb-2">
                Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
              </div>
              <div className="text-xl opacity-75">
                Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
              </div>

              {/* Compact Waitlist Display */}
              {isRoomManagementEnabled && showWaitlistOnDisplay && waitingList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20 text-left">
                  <h4 className="text-lg font-semibold mb-2">Next Up:</h4>
                  <div className="space-y-1">
                    {waitingList.slice(0, 3).map((player, index) => (
                      <div key={player.id} className="text-sm">
                        {index + 1}. {player.name}
                      </div>
                    ))}
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-8 rounded-lg text-center">
              <div className="text-8xl font-mono">
                {formatTime(customTimerState.timeRemaining)}
              </div>
            </div>
          )}
          
          {/* Overlay display when showing media */}
          {!isTimerPage && (
            <div className="absolute top-4 right-4 bg-black/80 text-white p-6 rounded-lg text-right z-50">
              <div className="text-6xl font-mono">
                {formatTime(customTimerState.timeRemaining)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg hover:bg-black/90 transition-colors"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </button>
    </div>
  );
} 