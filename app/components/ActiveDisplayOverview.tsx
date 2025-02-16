'use client';

import { useTimer } from '../contexts/TimerContext';
import { useEffect, useState } from 'react';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function ActiveDisplayOverview() {
  const { 
    activeTimer, 
    pokerState, 
    basketballState, 
    customTimerState,
    setActiveTimer,
    setPokerState,
    setBasketballState,
    setCustomTimerState
  } = useTimer();

  const [displayUrl, setDisplayUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDisplayUrl(`${window.location.origin}/display`);
    }
  }, []);

  const handleEndTimer = () => {
    if (!window.confirm('Are you sure you want to end this timer?')) return;

    switch (activeTimer) {
      case 'poker':
        setPokerState(null);
        break;
      case 'basketball':
        setBasketballState(null);
        break;
      case 'custom':
        setCustomTimerState(null);
        break;
    }
    setActiveTimer(null);
    localStorage.removeItem('timerState');
  };

  if (!activeTimer) return null;

  return (
    <div className="modern-card p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-black mb-2">
            Active Display Timer
          </h2>
          <p className="text-gray-600">
            Display URL: <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{displayUrl}</a>
          </p>
        </div>
        <button
          onClick={handleEndTimer}
          className="btn-danger"
        >
          End Timer
        </button>
      </div>

      {activeTimer === 'poker' && pokerState && (
        <div className="glass-card p-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Current Level</h3>
              <div className="space-y-2">
                <p className="text-4xl font-mono">{formatTime(pokerState.timeRemaining)}</p>
                <p className="text-lg">
                  Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
                </p>
                <p>Level {pokerState.currentLevel + 1} of {pokerState.levels.length}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Next Level</h3>
              {pokerState.currentLevel < pokerState.levels.length - 1 ? (
                <div className="space-y-2">
                  <p className="text-lg">
                    Blinds: {pokerState.levels[pokerState.currentLevel + 1].smallBlind}/{pokerState.levels[pokerState.currentLevel + 1].bigBlind}
                  </p>
                  <p>Starts in: {formatTime(pokerState.timeRemaining)}</p>
                </div>
              ) : (
                <p className="text-gray-600">Final Level</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTimer === 'basketball' && basketballState && (
        <div className="glass-card p-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Game Time</h3>
              <div className="space-y-2">
                <p className="text-4xl font-mono">{formatTime(basketballState.gameTime)}</p>
                <p className="text-lg">
                  Score: {basketballState.homeScore} - {basketballState.awayScore}
                </p>
                <p>Period {basketballState.period} | Shot Clock: {basketballState.shotClockTime}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Status</h3>
              <div className="space-y-2">
                <p>{basketballState.isRunning ? 'Game in Progress' : 'Game Paused'}</p>
                <p className="text-sm text-gray-600">
                  {basketballState.period < 4 ? `${4 - basketballState.period} periods remaining` : 'Final period'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTimer === 'custom' && customTimerState && (
        <div className="glass-card p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Timer</h3>
            <p className="text-4xl font-mono mb-2">{formatTime(customTimerState.timeRemaining)}</p>
            <p className="text-gray-600">
              {customTimerState.isRunning ? 'Running' : 'Paused'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 