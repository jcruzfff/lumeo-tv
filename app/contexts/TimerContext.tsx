'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PokerTimerState, BasketballTimerState, CustomTimerState } from '../types';

interface TimerContextType {
  activeTimer: 'poker' | 'basketball' | 'custom' | null;
  pokerState: PokerTimerState | null;
  basketballState: BasketballTimerState | null;
  customTimerState: CustomTimerState | null;
  setActiveTimer: (timer: 'poker' | 'basketball' | 'custom' | null) => void;
  setPokerState: (state: PokerTimerState | null) => void;
  setBasketballState: (state: BasketballTimerState | ((prev: BasketballTimerState) => BasketballTimerState)) => void;
  setCustomTimerState: (state: CustomTimerState | null) => void;
  updateBasketballScore: (homeScore: number, awayScore: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Set to true only when debugging timer issues
const DEBUG_TIMER = false;

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<'poker' | 'basketball' | 'custom' | null>(null);
  const [pokerState, setPokerStateInternal] = useState<PokerTimerState | null>(null);
  const [basketballState, setBasketballStateInternal] = useState<BasketballTimerState | null>(null);
  const [customTimerState, setCustomTimerState] = useState<CustomTimerState | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Add updateBasketballScore function
  const updateBasketballScore = useCallback((homeScore: number, awayScore: number) => {
    setBasketballStateInternal(prev => {
      if (!prev) return null;
      return {
        ...prev,
        homeScore,
        awayScore
      };
    });
  }, []);

  // Initialize state from localStorage
  useEffect(() => {
    setIsClient(true);
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const { activeTimer: savedActiveTimer, pokerState: savedPokerState, basketballState: savedBasketballState, customTimerState: savedCustomTimerState } = JSON.parse(savedState);
        if (savedActiveTimer) setActiveTimer(savedActiveTimer);
        if (savedPokerState) setPokerStateInternal(savedPokerState);
        if (savedBasketballState) setBasketballStateInternal(savedBasketballState);
        if (savedCustomTimerState) setCustomTimerState(savedCustomTimerState);
      } catch (error) {
        console.error('Error parsing saved timer state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;

    try {
      if (activeTimer && (pokerState || basketballState || customTimerState)) {
        localStorage.setItem('timerState', JSON.stringify({
          activeTimer,
          pokerState,
          basketballState,
          customTimerState,
        }));
      }
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, [activeTimer, pokerState, basketballState, customTimerState, isClient]);

  // Centralized timer countdown logic with accurate timing
  useEffect(() => {
    if (!isClient) return;

    let lastUpdate = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastUpdate) / 1000);
      
      if (deltaSeconds >= 1) {
        lastUpdate = now - (deltaSeconds % 1) * 1000; // Adjust for partial seconds

        // Poker timer logic
        if (activeTimer === 'poker' && pokerState?.isRunning) {
          setPokerStateInternal(prev => {
            if (!prev) return null;
            
            const newTimeRemaining = Math.max(0, prev.timeRemaining - deltaSeconds);
            
            if (DEBUG_TIMER) {
              console.log(`Poker timer update: ${newTimeRemaining}s remaining`);
            }
            
            if (newTimeRemaining <= 0) {
              if (prev.currentLevel < prev.levels.length - 1) {
                // Move to next level
                const nextLevel = prev.currentLevel + 1;
                if (DEBUG_TIMER) {
                  console.log(`Moving to level ${nextLevel + 1}`);
                }
                return {
                  ...prev,
                  currentLevel: nextLevel,
                  timeRemaining: prev.levels[nextLevel].duration * 60,
                };
              } else {
                // End of tournament
                if (DEBUG_TIMER) {
                  console.log('Tournament ended');
                }
                return { ...prev, isRunning: false, timeRemaining: 0 };
              }
            }

            return {
              ...prev,
              timeRemaining: newTimeRemaining,
            };
          });

          // Broadcast timer update
          try {
            const bc = new BroadcastChannel('lumeo-events');
            bc.postMessage({ type: 'TIMER_UPDATE' });
            bc.close();
          } catch (error) {
            // Only log broadcast errors if they're not about BroadcastChannel being undefined
            if (!(error instanceof ReferenceError)) {
              console.error('Error broadcasting timer update:', error);
            }
          }
        }
        
        // Basketball timer logic
        else if (activeTimer === 'basketball' && basketballState?.isRunning) {
          const persistentStateStr = localStorage.getItem('timerPersistentState');
          if (persistentStateStr) {
            const persistentState = JSON.parse(persistentStateStr);
            const elapsedSeconds = Math.floor((now - persistentState.startTime) / 1000);
            const newGameTime = Math.max(0, persistentState.initialGameTime - elapsedSeconds);

            if (DEBUG_TIMER) {
              console.log(`Basketball timer update: ${newGameTime}s remaining`);
            }

            setBasketballStateInternal(prev => {
              if (!prev || !prev.isRunning) return prev;

              if (newGameTime <= 0) {
                if (prev.period < prev.totalPeriods) {
                  // Start new period
                  const newPeriodState = {
                    ...persistentState,
                    startTime: now,
                    isRunning: false
                  };
                  localStorage.setItem('timerPersistentState', JSON.stringify(newPeriodState));

                  if (DEBUG_TIMER) {
                    console.log(`Starting period ${prev.period + 1}`);
                  }

                  return {
                    ...prev,
                    isRunning: false,
                    period: prev.period + 1,
                    gameTime: persistentState.periodLength * 60
                  };
                } else {
                  // End of game
                  if (DEBUG_TIMER) {
                    console.log('Game ended');
                  }
                  return { ...prev, isRunning: false, gameTime: 0 };
                }
              }

              return {
                ...prev,
                gameTime: newGameTime
              };
            });
          }
        }
        
        // Custom timer logic
        else if (activeTimer === 'custom' && customTimerState?.isRunning) {
          setCustomTimerState(prev => {
            if (!prev) return null;
            
            if (prev.timeRemaining <= 0) {
              if (DEBUG_TIMER) {
                console.log('Custom timer ended');
              }
              return { ...prev, isRunning: false };
            }

            const newTimeRemaining = Math.max(0, prev.timeRemaining - deltaSeconds);
            if (DEBUG_TIMER) {
              console.log(`Custom timer update: ${newTimeRemaining}s remaining`);
            }

            return {
              ...prev,
              timeRemaining: newTimeRemaining,
            };
          });
        }
      }
    }, 500); // Reduced polling frequency from 100ms to 500ms

    return () => clearInterval(interval);
  }, [isClient, activeTimer, pokerState?.isRunning, basketballState?.isRunning, customTimerState?.isRunning]);

  const setBasketballState = useCallback((newState: BasketballTimerState | ((prev: BasketballTimerState) => BasketballTimerState)) => {
    setBasketballStateInternal(prev => {
      if (!prev) return typeof newState === 'function' ? newState(prev as BasketballTimerState) : newState;
      return typeof newState === 'function' ? newState(prev) : newState;
    });
  }, []);

  const setPokerState = useCallback((newState: PokerTimerState | null | ((prev: PokerTimerState | null) => PokerTimerState | null)) => {
    setPokerStateInternal(prevState => {
      const nextState = typeof newState === 'function' ? newState(prevState) : newState;
      return nextState;
    });
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        pokerState,
        basketballState,
        customTimerState,
        setActiveTimer,
        setPokerState,
        setBasketballState,
        setCustomTimerState,
        updateBasketballScore,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
} 