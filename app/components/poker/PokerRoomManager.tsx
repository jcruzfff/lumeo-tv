'use client';

import { useState } from 'react';
import { usePokerRoom } from '../../contexts/PokerRoomContext';
import { BlindLevel } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import TableManager from './TableManager';
import WaitingList from './WaitingList';
import { Button } from '../ui/button';

interface PokerRoomManagerProps {
  pokerLevels: BlindLevel[];
  onUpdatePokerLevelsAction: (levels: BlindLevel[]) => void;
}

export default function PokerRoomManager({ pokerLevels, onUpdatePokerLevelsAction }: PokerRoomManagerProps) {
  const [activeTab, setActiveTab] = useState<'timer' | 'room'>('timer');
  const {
    tables,
    waitingList,
    addTable,
    removeTable,
    assignSeat,
    emptySeat,
    addToWaitingList,
    removeFromWaitingList,
    reorderWaitingList,
    isRoomManagementEnabled,
    showWaitlistOnDisplay,
    setIsRoomManagementEnabled,
    setShowWaitlistOnDisplay,
  } = usePokerRoom();

  // Add new blind level
  const addBlindLevel = () => {
    const lastLevel = pokerLevels[pokerLevels.length - 1];
    const newLevel: BlindLevel = {
      id: uuidv4(),
      smallBlind: lastLevel.smallBlind * 2,
      bigBlind: lastLevel.bigBlind * 2,
      duration: lastLevel.duration
    };
    onUpdatePokerLevelsAction([...pokerLevels, newLevel]);
  };

  // Update blind level
  const updateBlindLevel = (index: number, field: keyof BlindLevel, value: number) => {
    const newLevels = [...pokerLevels];
    const parsedValue = parseInt(value.toString());
    if (!isNaN(parsedValue)) {
      newLevels[index] = { ...newLevels[index], [field]: parsedValue };
      onUpdatePokerLevelsAction(newLevels);
    }
  };

  // Remove a level
  const removeLevel = (indexToRemove: number) => {
    if (pokerLevels.length > 1) {
      onUpdatePokerLevelsAction(pokerLevels.filter((_, index) => index !== indexToRemove));
    }
  };

  return (
    <div className="bg-dark-surface/80 backdrop-blur-sm border border-[#2C2C2E] p-8 mb-4 rounded-[24px]">
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white pb-2">Poker Room Manager</h2>
          <p className="text-text-secondary">Configure blind levels and their durations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-8 border-b border-[#2C2C2E]">
          <button
            onClick={() => setActiveTab('timer')}
            className={`pb-2 text-lg transition-colors ${
              activeTab === 'timer'
                ? 'text-text-primary border-b-2 border-brand-primary font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Timer
          </button>
          <button
            onClick={() => setActiveTab('room')}
            className={`pb-2 text-lg transition-colors ${
              activeTab === 'room'
                ? 'text-text-primary border-b-2 border-brand-primary font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Poker Room
          </button>
        </div>

        {/* Room Management Tab */}
        {activeTab === 'room' && (
          <div>
            {/* Room Management Settings */}
            <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 mb-6 rounded-xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary pb-2">Room Management</h3>
                    <p className="text-sm text-text-secondary">Enable table and waitlist management</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRoomManagementEnabled}
                      onChange={(e) => setIsRoomManagementEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-dark-surface/80 border border-dark-border peer-focus:outline-none rounded-full peer dark:bg-dark-surface-lighter peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary hover:bg-dark-surface-lighter transition-colors"></div>
                  </label>
                </div>

                {isRoomManagementEnabled && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Show Waitlist on Display</h3>
                      <p className="text-sm text-text-secondary">Display the waitlist in the timer sequence</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showWaitlistOnDisplay}
                        onChange={(e) => setShowWaitlistOnDisplay(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-dark-surface/80 border border-dark-border peer-focus:outline-none rounded-full peer dark:bg-dark-surface-lighter peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary hover:bg-dark-surface-lighter transition-colors"></div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {isRoomManagementEnabled && (
              <div className="grid grid-cols-[1fr_300px] gap-8">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Button onClick={addTable} className="bg-brand-primary hover:bg-brand-primary/90">
                        +Add Tables
                      </Button>
                    </div>
                  </div>

                  <TableManager
                    tables={tables}
                    onAssignSeatAction={assignSeat}
                    onEmptySeatAction={emptySeat}
                    onRemoveTableAction={removeTable}
                  />
                </div>

                <WaitingList
                  players={waitingList}
                  onAddPlayerAction={addToWaitingList}
                  onRemovePlayerAction={removeFromWaitingList}
                  onReorderPlayersAction={reorderWaitingList}
                />
              </div>
            )}
          </div>
        )}

        {/* Timer Settings Tab */}
        {activeTab === 'timer' && (
          <div>
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
                        onUpdatePokerLevelsAction(pokerLevels.map(level => ({
                          ...level,
                          duration
                        })));
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">min</span>
                </div>
              </div>
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
                {pokerLevels.map((level, index) => (
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
                        disabled={pokerLevels.length === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          pokerLevels.length === 1
                            ? 'text-text-tertiary cursor-not-allowed'
                            : 'text-status-error hover:bg-status-error/10'
                        }`}
                        title={pokerLevels.length === 1 ? "Can't delete the last level" : "Remove this level"}
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
                  <span className="w-2 h-2 bg-brand-primary rounded-full "></span>
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
        )}
      </div>
    </div>
  );
} 