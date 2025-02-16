'use client';

import { useState, useEffect } from 'react';
import { PokerTimerState, BlindLevel } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTimer } from '../contexts/TimerContext';

const defaultLevels: BlindLevel[] = [
  { id: uuidv4(), smallBlind: 25, bigBlind: 50, duration: 20 },
  { id: uuidv4(), smallBlind: 50, bigBlind: 100, duration: 20 },
  { id: uuidv4(), smallBlind: 100, bigBlind: 200, duration: 20 },
];

export default function PokerTimer() {
  const { setActiveTimer, setPokerState } = useTimer();
  const [timerState, setTimerState] = useState<PokerTimerState>({
    isRunning: false,
    currentLevel: 0,
    timeRemaining: defaultLevels[0].duration * 60,
    levels: defaultLevels,
    breakDuration: 10,
    totalPlayTime: 0,
  });

  // Set this timer as active when mounted
  useEffect(() => {
    setActiveTimer('poker');
    return () => setActiveTimer(null);
  }, [setActiveTimer]);

  // Update the shared timer state
  useEffect(() => {
    setPokerState(timerState);
  }, [timerState, setPokerState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeRemaining <= 0) {
            // Move to next level
            if (prev.currentLevel < prev.levels.length - 1) {
              return {
                ...prev,
                currentLevel: prev.currentLevel + 1,
                timeRemaining: prev.levels[prev.currentLevel + 1].duration * 60,
              };
            } else {
              // Stop timer if we're at the last level
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
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentLevel = timerState.levels[timerState.currentLevel];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Poker Timer</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center mb-8">
            <div className="text-6xl font-mono mb-4">
              {formatTime(timerState.timeRemaining)}
            </div>
            <div className="text-2xl">
              Blinds: {currentLevel.smallBlind}/{currentLevel.bigBlind}
            </div>
            <div className="text-gray-600">
              Level {timerState.currentLevel + 1} of {timerState.levels.length}
            </div>
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
              {timerState.isRunning ? 'Pause' : 'Start'}
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the timer?')) {
                  setTimerState(prev => ({
                    ...prev,
                    isRunning: false,
                    currentLevel: 0,
                    timeRemaining: prev.levels[0].duration * 60,
                    totalPlayTime: 0,
                  }));
                }
              }}
              className="px-6 py-2 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Blind Levels</h2>
          <div className="space-y-4">
            {timerState.levels.map((level, index) => (
              <div
                key={level.id}
                className={`p-4 rounded-lg ${
                  index === timerState.currentLevel
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">Level {index + 1}:</span>{' '}
                    {level.smallBlind}/{level.bigBlind}
                  </div>
                  <div className="text-gray-600">{level.duration} minutes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 