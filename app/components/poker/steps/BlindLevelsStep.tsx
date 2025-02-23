'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BlindLevel } from '@/app/types';

interface BlindLevelsStepProps {
  onCompleteAction: (blindLevels: BlindLevel[]) => void;
}

export default function BlindLevelsStep({ onCompleteAction }: BlindLevelsStepProps) {
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>([
    { id: uuidv4(), smallBlind: 25, bigBlind: 50, duration: 20 }
  ]);

  // Add new blind level
  const addBlindLevel = () => {
    const lastLevel = blindLevels[blindLevels.length - 1];
    const newLevel: BlindLevel = {
      id: uuidv4(),
      smallBlind: lastLevel.smallBlind * 2,
      bigBlind: lastLevel.bigBlind * 2,
      duration: lastLevel.duration
    };
    const newLevels = [...blindLevels, newLevel];
    setBlindLevels(newLevels);
    onCompleteAction(newLevels);
  };

  // Update blind level
  const updateBlindLevel = (index: number, field: keyof BlindLevel, value: number) => {
    const newLevels = [...blindLevels];
    const parsedValue = parseInt(value.toString());
    if (!isNaN(parsedValue)) {
      newLevels[index] = { ...newLevels[index], [field]: parsedValue };
      setBlindLevels(newLevels);
      onCompleteAction(newLevels);
    }
  };

  // Remove a level
  const removeLevel = (indexToRemove: number) => {
    if (blindLevels.length > 1) {
      const newLevels = blindLevels.filter((_, index) => index !== indexToRemove);
      setBlindLevels(newLevels);
      onCompleteAction(newLevels);
    }
  };

  return (
    <div>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white pb-2">Set the Blinds</h2>
          <p className="text-text-secondary">Configure blind levels and their durations</p>
        </div>

        {/* Duration Auto Select */}
        <div className="bg-dark-surface backdrop-blur-md border border-[#2C2C2E] p-4 mb-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">Quick Duration Set</h3>
              <p className="text-sm text-text-secondary">Set duration for all levels at once</p>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Minutes"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-[200px] px-4 py-2.5 rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary/20 focus:outline-none bg-dark-surface text-text-primary"
                min="1"
                onChange={(e) => {
                  const duration = parseInt(e.target.value);
                  if (!isNaN(duration) && duration > 0) {
                    const newLevels = blindLevels.map(level => ({
                      ...level,
                      duration
                    }));
                    setBlindLevels(newLevels);
                    onCompleteAction(newLevels);
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">min</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Blind Levels</h3>
            <p className="text-text-secondary mt-2">Configure tournament blind structure</p>
          </div>
          <button
            onClick={addBlindLevel}
            className="inline-flex items-center border border-[#2C2C2E] text-sm font-medium bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            +Add Level
          </button>
        </div>

        <div className="overflow-hidden">
          {/* Column Headers */}
          <div className="grid grid-cols-5 gap-4 mb-4 px-4 text-text-secondary">
            <div>Level</div>
            <div>Small Blind ($)</div>
            <div>Big Blind ($)</div>
            <div>Duration (min)</div>
            <div></div>
          </div>

          <div className="space-y-3">
            {blindLevels.map((level, index) => (
              <div 
                key={level.id} 
                className="grid grid-cols-5 gap-4 items-center p-4 rounded-lg bg-dark-surface border border-[#2C2C2E] transition-all hover:border-brand-primary"
              >
                <div className="text-text-primary">Level {index + 1}</div>
                <div>
                  <input
                    type="number"
                    value={level.smallBlind}
                    onChange={(e) => updateBlindLevel(index, 'smallBlind', e.target.value ? parseInt(e.target.value) : 0)}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-dark-surface text-text-primary border border-[#2C2C2E] focus:border-brand-primary/20 focus:outline-none rounded-[8px] px-4 py-2.5"
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={level.bigBlind}
                    onChange={(e) => updateBlindLevel(index, 'bigBlind', e.target.value ? parseInt(e.target.value) : 0)}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-dark-surface text-text-primary border border-[#2C2C2E] focus:border-brand-primary/20 focus:outline-none rounded-[8px] px-4 py-2.5"
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={level.duration}
                    onChange={(e) => updateBlindLevel(index, 'duration', e.target.value ? parseInt(e.target.value) : 1)}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-dark-surface text-text-primary border border-[#2C2C2E] focus:border-brand-primary/20 focus:outline-none rounded-[8px] px-4 py-2.5"
                    min="1"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeLevel(index)}
                    disabled={blindLevels.length === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      blindLevels.length === 1
                        ? 'text-text-tertiary cursor-not-allowed'
                        : 'text-status-error hover:bg-status-error/10'
                    }`}
                    title={blindLevels.length === 1 ? "Can't delete the last level" : "Remove this level"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-sm text-text-secondary bg-[#1F1F21] p-4 rounded-lg border border-[#2C2C2E]">
          <ul className="space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
              <span className="text-text-secondary">Small Blind: The initial forced bet for the player to the left of the dealer</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
              <span className="text-text-secondary">Big Blind: Usually double the small blind, placed by the player two positions left of the dealer</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
              <span className="text-text-secondary">Duration: How long this level will last in minutes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 