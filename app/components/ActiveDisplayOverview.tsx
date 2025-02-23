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
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the active event ID from localStorage
      const eventId = localStorage.getItem('activeEventId');
      setActiveEventId(eventId);
      if (eventId) {
        setDisplayUrl(`${window.location.origin}/display/${eventId}`);
      }
    }
  }, []);

  const openDisplayWindow = () => {
    if (!displayUrl) return;
    
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

    const displayWindow = window.open(displayUrl, `lumeo_display_${activeEventId}`, featuresString);
    if (displayWindow) {
      displayWindow.focus();
    } else {
      alert('Please allow popups to open the display window');
    }
  };

  const handleEndTimer = () => {
    if (!window.confirm('Are you sure you want to end this timer?')) return;

    switch (activeTimer) {
      case 'poker':
        setPokerState({
          isRunning: false,
          currentLevel: 0,
          timeRemaining: 0,
          levels: [],
          breakDuration: 0,
          totalPlayTime: 0
        });
        break;
      case 'basketball':
        setBasketballState({
          isRunning: false,
          gameTime: 0,
          period: 1,
          homeScore: 0,
          awayScore: 0,
          totalPeriods: 4
        });
        break;
      case 'custom':
        setCustomTimerState({
          isRunning: false,
          timeRemaining: 0,
          duration: 0
        });
        break;
    }
    setActiveTimer(null);
    localStorage.removeItem('timerState');
    localStorage.removeItem('timerPersistentState');
  };

  if (!activeTimer) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Active Display Timer
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              Display URL: <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{displayUrl}</a>
            </p>
            <button
              onClick={openDisplayWindow}
              className="px-3 py-1 bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors text-sm"
            >
              Open Display
            </button>
          </div>
        </div>
        <button
          onClick={handleEndTimer}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          End Timer
        </button>
      </div>

      {activeTimer === 'poker' && pokerState && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Current Level</h3>
              <div className="space-y-2">
                <p className="text-4xl font-mono text-gray-900">{formatTime(pokerState.timeRemaining)}</p>
                <p className="text-lg text-gray-700">
                  Blinds: {pokerState.levels[pokerState.currentLevel].smallBlind}/{pokerState.levels[pokerState.currentLevel].bigBlind}
                </p>
                <p className="text-gray-600">Level {pokerState.currentLevel + 1} of {pokerState.levels.length}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Status</h3>
              <div className="space-y-2">
                <p className="text-gray-700">Tournament in Progress</p>
                <p className="text-sm text-gray-500">
                  {pokerState.currentLevel < pokerState.levels.length - 1 
                    ? `${pokerState.levels.length - pokerState.currentLevel - 1} levels remaining` 
                    : 'Final level'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTimer === 'basketball' && basketballState && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Game Time</h3>
              <div className="space-y-2">
                <p className="text-4xl font-mono text-gray-900">{formatTime(basketballState.gameTime)}</p>
                <p className="text-lg text-gray-700">
                  Score: {basketballState.homeScore} - {basketballState.awayScore}
                </p>
                <p className="text-gray-600">Period {basketballState.period} of {basketballState.totalPeriods}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Status</h3>
              <div className="space-y-2">
                <p className="text-gray-700">{basketballState.isRunning ? 'Game in Progress' : 'Game Paused'}</p>
                <p className="text-sm text-gray-500">
                  {basketballState.period < basketballState.totalPeriods 
                    ? `${basketballState.totalPeriods - basketballState.period} periods remaining` 
                    : 'Final period'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTimer === 'custom' && customTimerState && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Timer</h3>
            <p className="text-4xl font-mono mb-2 text-gray-900">{formatTime(customTimerState.timeRemaining)}</p>
            <p className="text-gray-600">
              {customTimerState.isRunning ? 'Running' : 'Paused'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 