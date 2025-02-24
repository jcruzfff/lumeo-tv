'use client';

import { useTimer } from '../contexts/TimerContext';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Timer() {
  const { activeTimer, pokerState, basketballState } = useTimer();

  if (!activeTimer || (!pokerState && !basketballState)) {
    return null;
  }

  if (activeTimer === 'poker' && pokerState) {
    const currentLevel = pokerState.levels[pokerState.currentLevel];
    return (
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg">
        <div className="text-4xl font-mono mb-2">
          {formatTime(pokerState.timeRemaining)}
        </div>
        <div className="text-xl">
          Blinds: {currentLevel.smallBlind}/{currentLevel.bigBlind}
        </div>
        <div className="text-sm opacity-75">
          Level {pokerState.currentLevel + 1} of {pokerState.levels.length}
        </div>
      </div>
    );
  }

  if (activeTimer === 'basketball' && basketballState) {
    return (
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg">
        <div className="text-4xl font-mono mb-2">
          {formatTime(basketballState.gameTime)}
        </div>
        <div className="text-xl">
          {basketballState.homeScore} - {basketballState.awayScore}
        </div>
        <div className="text-sm opacity-75">
          Period {basketballState.period} of {basketballState.totalPeriods}
        </div>
      </div>
    );
  }

  return null;
} 