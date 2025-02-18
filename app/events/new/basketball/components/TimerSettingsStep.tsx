'use client';
import { useState } from 'react';
import { BasketballTimerState } from '@/app/types';

interface TimerSettingsStepProps {
  onCompleteAction: (settings: BasketballTimerState) => void;
}

export default function TimerSettingsStep({ onCompleteAction }: TimerSettingsStepProps) {
  const [quarterLength, setQuarterLength] = useState(12); // minutes
  const [totalPeriods, setTotalPeriods] = useState<number | null>(null);

  const handleFormatSelection = (periods: number) => {
    setTotalPeriods(periods);
    const settings: BasketballTimerState = {
      isRunning: false,
      gameTime: quarterLength * 60, // Convert to seconds
      period: 1,
      homeScore: 0,
      awayScore: 0,
      shotClockTime: 24,
    };
    onCompleteAction(settings);
  };

  const handleQuarterLengthChange = (value: number) => {
    setQuarterLength(value);
    if (totalPeriods) {
      const settings: BasketballTimerState = {
        isRunning: false,
        gameTime: value * 60, // Convert to seconds
        period: 1,
        homeScore: 0,
        awayScore: 0,
        shotClockTime: 24,
      };
      onCompleteAction(settings);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white pb-2">Set the Timer</h2>
        <p className="text-text-secondary">Configure game format and period length</p>
      </div>

      {/* Period Length Quick Set */}
      <div className="bg-dark-surface backdrop-blur-md border border-[#2C2C2E] p-4 mb-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Period Length</h3>
            <p className="text-sm text-text-secondary">Set the duration for each period</p>
          </div>
          <div className="relative">
            <input
              type="number"
              value={quarterLength}
              onChange={(e) => handleQuarterLengthChange(e.target.value ? parseInt(e.target.value) : 1)}
              autoFocus
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-[200px] px-4 py-3 text-2xl font-medium rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none bg-dark-surface text-text-primary text-center"
              min="1"
              placeholder="Minutes"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-base">min</span>
          </div>
        </div>
      </div>

      {/* Game Format */}
      <div className="bg-dark-surface backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Game Format</h3>
            <p className="text-text-secondary mt-2">Select period structure</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleFormatSelection(2)}
            className={`p-4 rounded-xl border ${
              totalPeriods === 2
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-[#2C2C2E] hover:border-brand-primary/50'
            } transition-all`}
          >
            <div className="text-center">
              <h4 className="text-lg font-medium text-text-primary mb-2">Halves</h4>
              <p className="text-sm text-text-secondary">2 Periods</p>
            </div>
          </button>

          <button
            onClick={() => handleFormatSelection(4)}
            className={`p-4 rounded-xl border ${
              totalPeriods === 4
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-[#2C2C2E] hover:border-brand-primary/50'
            } transition-all`}
          >
            <div className="text-center">
              <h4 className="text-lg font-medium text-text-primary mb-2">Quarters</h4>
              <p className="text-sm text-text-secondary">4 Periods</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 