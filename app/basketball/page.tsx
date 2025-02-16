'use client';

import { useState, useEffect } from 'react';
import { BasketballTimerState } from '../types';
import { useTimer } from '../contexts/TimerContext';

const PERIOD_LENGTH = 12 * 60; // 12 minutes in seconds
const SHOT_CLOCK_LENGTH = 24; // 24 seconds

export default function BasketballTimer() {
  const { setActiveTimer, setBasketballState } = useTimer();
  const [timerState, setTimerState] = useState<BasketballTimerState>({
    isRunning: false,
    gameTime: PERIOD_LENGTH,
    period: 1,
    homeScore: 0,
    awayScore: 0,
    shotClockTime: SHOT_CLOCK_LENGTH,
  });

  // Set this timer as active when mounted
  useEffect(() => {
    setActiveTimer('basketball');
    return () => setActiveTimer(null);
  }, [setActiveTimer]);

  // Update the shared timer state immediately when local state changes
  useEffect(() => {
    console.log('Basketball timer state changed:', timerState);
    setBasketballState(timerState);
    
    // Update localStorage
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      localStorage.setItem('timerState', JSON.stringify({
        ...parsedState,
        basketballState: timerState
      }));
    }
  }, [timerState, setBasketballState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setTimerState(prev => {
          const newGameTime = prev.gameTime - 1;
          const newShotClockTime = prev.shotClockTime - 1;
          
          if (newGameTime <= 0) {
            // End of period
            const savedState = localStorage.getItem('timerState');
            const totalPeriods = savedState ? JSON.parse(savedState).basketballState?.totalPeriods || 4 : 4;
            
            if (prev.period < totalPeriods) {
              return {
                ...prev,
                isRunning: false,
                period: prev.period + 1,
                gameTime: PERIOD_LENGTH,
                shotClockTime: SHOT_CLOCK_LENGTH,
              };
            } else {
              // End of game
              return { ...prev, isRunning: false };
            }
          }
          
          return {
            ...prev,
            gameTime: newGameTime,
            shotClockTime: newShotClockTime <= 0 ? SHOT_CLOCK_LENGTH : newShotClockTime,
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const updateScore = (team: 'home' | 'away', points: number) => {
    // Log the update request
    console.log('Score update requested:', { team, points, currentState: timerState });
    
    // Calculate the new score ensuring it doesn't go below 0
    const currentScore = team === 'home' ? timerState.homeScore : timerState.awayScore;
    const newScore = Math.max(0, currentScore + points);
    
    console.log('New score calculated:', { team, currentScore, newScore });

    // Create a new state object with the updated score
    const updatedState = {
      ...timerState,
      [team === 'home' ? 'homeScore' : 'awayScore']: newScore
    };

    // Update both local and shared state
    setTimerState(updatedState);
    setBasketballState(updatedState);
    
    // Update localStorage immediately
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      const newStoredState = {
        ...parsedState,
        basketballState: updatedState
      };
      localStorage.setItem('timerState', JSON.stringify(newStoredState));
      console.log('Score updated in localStorage:', newStoredState.basketballState);
    }
  };

  // Load initial state from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.basketballState) {
        console.log('Loading saved basketball state:', parsedState.basketballState);
        setTimerState(parsedState.basketballState);
      }
    }
  }, []);

  // Get the total periods from localStorage
  const savedState = localStorage.getItem('timerState');
  const totalPeriods = savedState ? JSON.parse(savedState).basketballState?.totalPeriods || 4 : 4;
  const periodText = totalPeriods === 2 ? 'Half' : 'Quarter';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Basketball Timer</h1>
        
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Home Team */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Home</h2>
            <div className="text-6xl font-mono mb-4">{timerState.homeScore}</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateScore('home', 1)}
                className="bg-blue-500 text-white rounded p-2"
              >
                +1
              </button>
              <button
                onClick={() => updateScore('home', 2)}
                className="bg-blue-500 text-white rounded p-2"
              >
                +2
              </button>
              <button
                onClick={() => updateScore('home', 3)}
                className="bg-blue-500 text-white rounded p-2"
              >
                +3
              </button>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl font-mono mb-4">
              {formatTime(timerState.gameTime)}
            </div>
            <div className="text-2xl mb-4">
              {periodText} {timerState.period} of {totalPeriods}
            </div>
            <div className="text-xl mb-4">
              Shot Clock: {timerState.shotClockTime}
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  timerState.isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {timerState.isRunning ? 'Stop' : 'Start'}
              </button>
              <button
                onClick={() => setTimerState(prev => ({ ...prev, shotClockTime: SHOT_CLOCK_LENGTH }))}
                className="px-6 py-2 rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Reset Shot
              </button>
            </div>
          </div>

          {/* Away Team */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Away</h2>
            <div className="text-6xl font-mono mb-4">{timerState.awayScore}</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateScore('away', 1)}
                className="bg-red-500 text-white rounded p-2"
              >
                +1
              </button>
              <button
                onClick={() => updateScore('away', 2)}
                className="bg-red-500 text-white rounded p-2"
              >
                +2
              </button>
              <button
                onClick={() => updateScore('away', 3)}
                className="bg-red-500 text-white rounded p-2"
              >
                +3
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the game?')) {
                setTimerState({
                  isRunning: false,
                  gameTime: PERIOD_LENGTH,
                  period: 1,
                  homeScore: 0,
                  awayScore: 0,
                  shotClockTime: SHOT_CLOCK_LENGTH,
                });
              }
            }}
            className="px-6 py-2 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white"
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
} 