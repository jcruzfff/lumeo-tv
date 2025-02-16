'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PokerTimerState, BasketballTimerState, CustomTimerState } from '../types';

interface TimerContextType {
  activeTimer: 'poker' | 'basketball' | 'custom' | null;
  pokerState: PokerTimerState | null;
  basketballState: BasketballTimerState | null;
  customTimerState: CustomTimerState | null;
  setActiveTimer: (timer: 'poker' | 'basketball' | 'custom' | null) => void;
  setPokerState: (state: PokerTimerState | null) => void;
  setBasketballState: (state: BasketballTimerState | null) => void;
  setCustomTimerState: (state: CustomTimerState | null) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<'poker' | 'basketball' | 'custom' | null>(null);
  const [pokerState, setPokerState] = useState<PokerTimerState | null>(null);
  const [basketballState, setBasketballState] = useState<BasketballTimerState | null>(null);
  const [customTimerState, setCustomTimerState] = useState<CustomTimerState | null>(null);
  const [isClient, setIsClient] = useState(false);
  const isDisplayPage = isClient && typeof window !== 'undefined' && window.location.pathname === '/display';

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load state from localStorage on mount and start polling for updates if on display page
  useEffect(() => {
    if (!isClient) return;

    const loadState = () => {
      try {
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
          const { 
            activeTimer: savedActiveTimer, 
            pokerState: savedPokerState, 
            basketballState: savedBasketballState,
            customTimerState: savedCustomTimerState 
          } = JSON.parse(savedState);
          
          setActiveTimer(savedActiveTimer);
          setPokerState(savedPokerState);
          setBasketballState(savedBasketballState);
          setCustomTimerState(savedCustomTimerState);
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };

    // Initial load
    loadState();

    // If on display page, poll for updates
    let interval: NodeJS.Timeout;
    if (isDisplayPage) {
      interval = setInterval(loadState, 1000); // Poll every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isClient, isDisplayPage]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem('timerState', JSON.stringify({
        activeTimer,
        pokerState,
        basketballState,
        customTimerState,
      }));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, [activeTimer, pokerState, basketballState, customTimerState, isClient]);

  // Timer countdown logic for display page
  useEffect(() => {
    if (!isClient || !isDisplayPage) return;

    let interval: NodeJS.Timeout;

    if (activeTimer === 'basketball' && basketballState?.isRunning) {
      interval = setInterval(() => {
        setBasketballState(prev => {
          if (!prev) return null;
          const newGameTime = prev.gameTime - 1;
          const newShotClockTime = prev.shotClockTime - 1;

          if (newGameTime <= 0) {
            if (prev.period < 4) {
              return {
                ...prev,
                isRunning: false,
                period: prev.period + 1,
                gameTime: prev.gameTime,
                shotClockTime: 24,
              };
            } else {
              return { ...prev, isRunning: false };
            }
          }

          return {
            ...prev,
            gameTime: newGameTime,
            shotClockTime: newShotClockTime <= 0 ? 24 : newShotClockTime,
          };
        });
      }, 1000);
    } else if (activeTimer === 'poker' && pokerState?.isRunning) {
      interval = setInterval(() => {
        setPokerState(prev => {
          if (!prev) return null;
          
          if (prev.timeRemaining <= 0) {
            if (prev.currentLevel < prev.levels.length - 1) {
              return {
                ...prev,
                currentLevel: prev.currentLevel + 1,
                timeRemaining: prev.levels[prev.currentLevel + 1].duration * 60,
              };
            } else {
              return { ...prev, isRunning: false };
            }
          }

          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
            totalPlayTime: prev.totalPlayTime + 1,
          };
        });
      }, 1000);
    } else if (activeTimer === 'custom' && customTimerState?.isRunning) {
      interval = setInterval(() => {
        setCustomTimerState(prev => {
          if (!prev) return null;

          if (prev.timeRemaining <= 0) {
            return { ...prev, isRunning: false };
          }

          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isClient, isDisplayPage, activeTimer, basketballState?.isRunning, pokerState?.isRunning, customTimerState?.isRunning]);

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