'use client';
import { useState, useCallback } from 'react';
import { BasketballTimerState } from '@/app/types';

interface TimerSettingsStepProps {
  onCompleteAction: (settings: BasketballTimerState) => void;
}

export default function TimerSettingsStep({ onCompleteAction }: TimerSettingsStepProps) {
  const [periodLength, setPeriodLength] = useState<number | null>(null);
  const [totalPeriods, setTotalPeriods] = useState(4);
  const [periodInputValue, setPeriodInputValue] = useState('');

  // Simple callback to update parent with current settings
  const handleSettingsChange = useCallback(() => {
    console.log('handleSettingsChange called with:', { periodLength, totalPeriods });
    if (periodLength === null) {
      console.log('Period length is null, returning early');
      return;
    }

    const settings: BasketballTimerState = {
      isRunning: false,
      gameTime: periodLength * 60, // Convert minutes to seconds
      period: 1,
      homeScore: 0,
      awayScore: 0,
      totalPeriods: parseInt(String(totalPeriods)) // Ensure it's a number and not a string
    };
    console.log('Created settings:', settings);

    // Save persistent state for timer initialization
    const persistentState = {
      startTime: Date.now(),
      initialGameTime: periodLength * 60,
      periodLength: periodLength,
      isRunning: false,
      period: 1,
      totalPeriods: parseInt(String(totalPeriods)) // Ensure it's a number and not a string
    };
    localStorage.setItem('timerPersistentState', JSON.stringify(persistentState));
    console.log('Saved persistent state:', persistentState);
    onCompleteAction(settings);
  }, [periodLength, totalPeriods, onCompleteAction]);

  const handlePeriodLengthChange = (value: string) => {
    console.log('handlePeriodLengthChange called with:', value);
    // Allow empty string for clearing the input
    if (value === '') {
      console.log('Empty value, clearing input');
      setPeriodInputValue('');
      setPeriodLength(null);
      return;
    }

    const parsedValue = parseInt(value);
    console.log('Parsed value:', parsedValue);
    // Only update if it's a valid number
    if (!isNaN(parsedValue) && parsedValue > 0) {
      console.log('Setting period length to:', parsedValue);
      setPeriodInputValue(value);
      setPeriodLength(parsedValue);
      handleSettingsChange();
    }
  };

  const handleTotalPeriodsChange = (value: string) => {
    const periods = parseInt(value);
    if (periods >= 1 && periods <= 4) {
      setTotalPeriods(periods);
      if (periodLength !== null) {
        // Immediately update settings with new total periods
        const settings: BasketballTimerState = {
          isRunning: false,
          gameTime: periodLength * 60,
          period: 1,
          homeScore: 0,
          awayScore: 0,
          totalPeriods: periods
        };
        onCompleteAction(settings);
      }
    }
  };

  const handleInputBlur = () => {
    console.log('handleInputBlur called with current value:', periodInputValue);
    const parsedValue = parseInt(periodInputValue);
    console.log('Parsed blur value:', parsedValue);
    // If empty or invalid, clear the input and don't set a default
    if (periodInputValue === '' || isNaN(parsedValue) || parsedValue < 1) {
      console.log('Invalid value on blur, clearing input');
      setPeriodInputValue('');
      setPeriodLength(null);
    } else {
      console.log('Valid value on blur, updating settings');
      setPeriodLength(parsedValue);
      handleSettingsChange();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white pb-2">Set the Timer</h2>
        <p className="text-text-secondary">Configure period length and number of periods</p>
      </div>

      {/* Period Duration */}
      <div className="bg-dark-surface backdrop-blur-md border border-[#2C2C2E] p-4 mb-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Period Duration</h3>
            <p className="text-sm text-text-secondary">Set how many minutes each period will last</p>
          </div>
          <div className="relative">
            <input
              type="number"
              value={periodInputValue}
              onChange={(e) => handlePeriodLengthChange(e.target.value)}
              onBlur={handleInputBlur}
              autoFocus
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-[200px] px-4 py-3 text-2xl font-medium rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none bg-dark-surface text-text-primary text-center"
              placeholder="Minutes"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-base">min</span>
          </div>
        </div>
      </div>

      {/* Number of Periods */}
      <div className="bg-dark-surface backdrop-blur-md border border-[#2C2C2E] p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Number of Periods</h3>
            <p className="text-sm text-text-secondary">Select total periods for the game</p>
          </div>
          <div className="relative">
            <select
              value={totalPeriods}
              onChange={(e) => handleTotalPeriodsChange(e.target.value)}
              className="w-[200px] px-4 py-3 text-2xl font-medium rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none bg-dark-surface text-text-primary text-center appearance-none"
            >
              <option value={1}>1 Period</option>
              <option value={2}>2 Periods</option>
              <option value={3}>3 Periods</option>
              <option value={4}>4 Periods</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 