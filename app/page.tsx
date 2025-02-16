'use client';

import { useState, useCallback } from 'react';
import { BlindLevel, MediaItem } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useTimer } from './contexts/TimerContext';
import Image from 'next/image';
import ActiveDisplayOverview from './components/ActiveDisplayOverview';

export default function AdminDashboard() {
  // Timer Mode Selection
  const [timerMode, setTimerMode] = useState<'poker' | 'basketball' | 'custom' | null>(null);
  
  // Poker Settings
  const [pokerLevels, setPokerLevels] = useState<BlindLevel[]>([
    { id: uuidv4(), smallBlind: 25, bigBlind: 50, duration: 20 }
  ]);

  // Basketball Settings
  const [quarterLength, setQuarterLength] = useState(12); // minutes
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [totalPeriods, setTotalPeriods] = useState(4);

  // Media Management
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  // Timer Context
  const { setActiveTimer, setPokerState, setBasketballState, setCustomTimerState } = useTimer();

  // Custom Timer Settings
  const [customDuration, setCustomDuration] = useState(5); // 5 minutes default

  // Add new blind level
  const addBlindLevel = () => {
    const lastLevel = pokerLevels[pokerLevels.length - 1];
    const newLevel: BlindLevel = {
      id: uuidv4(),
      smallBlind: lastLevel.smallBlind * 2,
      bigBlind: lastLevel.bigBlind * 2,
      duration: lastLevel.duration
    };
    setPokerLevels([...pokerLevels, newLevel]);
  };

  // Update blind level
  const updateBlindLevel = (index: number, field: keyof BlindLevel, value: number) => {
    const newLevels = [...pokerLevels];
    const parsedValue = parseInt(value.toString());
    if (!isNaN(parsedValue)) {
      newLevels[index] = { ...newLevels[index], [field]: parsedValue };
      setPokerLevels(newLevels);
    }
  };

  // Handle media upload
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newMediaItems: MediaItem[] = files.map(file => ({
      id: uuidv4(),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      path: URL.createObjectURL(file),
      duration: file.type.startsWith('video/') ? undefined : 15,
    }));
    const updatedItems = [...mediaItems, ...newMediaItems];
    setMediaItems(updatedItems);
    
    // Store updated media items in localStorage
    localStorage.setItem('mediaState', JSON.stringify({
      mediaItems: updatedItems,
      currentMediaIndex: 0,
    }));
  }, [mediaItems]);

  // Handle media reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const newItems = [...mediaItems];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, removed);
    setMediaItems(newItems);

    // Update localStorage with new order
    localStorage.setItem('mediaState', JSON.stringify({
      mediaItems: newItems,
      currentMediaIndex: 0,
    }));
  };

  // Launch display mode
  const launchDisplay = () => {
    if (timerMode === 'poker') {
      setPokerState({
        isRunning: true,
        currentLevel: 0,
        timeRemaining: pokerLevels[0].duration * 60,
        levels: pokerLevels,
        breakDuration: 10,
        totalPlayTime: 0,
      });
    } else if (timerMode === 'basketball') {
      setBasketballState({
        isRunning: true,
        gameTime: quarterLength * 60,
        period: 1,
        homeScore,
        awayScore,
        shotClockTime: 24,
      });
    } else if (timerMode === 'custom') {
      setCustomTimerState({
        isRunning: true,
        timeRemaining: customDuration * 60,
        duration: customDuration,
      });
    }
    setActiveTimer(timerMode);

    // Store media items in localStorage before opening display
    localStorage.setItem('mediaState', JSON.stringify({
      mediaItems,
      currentMediaIndex: 0,
    }));

    window.open('/display', '_blank');
  };

  // Add new function to remove a level
  const removeLevel = (indexToRemove: number) => {
    if (pokerLevels.length > 1) {
      setPokerLevels(prev => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E9] px-4 py-8">
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-5xl font-bold text-center pb-8 mb-8 text-black" style={{ fontFamily: 'Raleway, sans-serif' }}>
          Pool Event Timer Dashboard
        </h1>
        
        <ActiveDisplayOverview />

        {/* Timer Mode Selection */}
        <div className="modern-card p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-black" style={{ fontFamily: 'Raleway, sans-serif' }}>Select Timer Mode</h2>
          <div className="flex gap-6">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="radio"
                value="poker"
                checked={timerMode === 'poker'}
                onChange={(e) => setTimerMode(e.target.value as 'poker')}
                className="modern-radio"
              />
              <span className="text-gray-600 group-hover:text-black transition-colors">Poker Timer</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="radio"
                value="basketball"
                checked={timerMode === 'basketball'}
                onChange={(e) => setTimerMode(e.target.value as 'basketball')}
                className="modern-radio"
              />
              <span className="text-gray-600 group-hover:text-black transition-colors">Basketball Timer</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="radio"
                value="custom"
                checked={timerMode === 'custom'}
                onChange={(e) => setTimerMode(e.target.value as 'custom')}
                className="modern-radio"
              />
              <span className="text-gray-600 group-hover:text-black transition-colors">Custom Timer</span>
            </label>
          </div>
        </div>

        {/* Custom Timer Settings */}
        {timerMode === 'custom' && (
          <div className="modern-card p-6 mb-8 timer-section-enter">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold text-black mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>Custom Timer Settings</h2>
              <p className="text-gray-600 mb-6">Set your countdown duration</p>

              <div className="glass-card p-6 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-black mb-4" style={{ fontFamily: 'Raleway, sans-serif' }}>Duration</h3>
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value ? parseInt(e.target.value) : 1)}
                  className="w-full text-xl text-center"
                  min="1"
                  placeholder="Minutes"
                />
                <p className="text-sm text-gray-600 mt-2">Enter the duration in minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* Timer Settings */}
        {timerMode === 'poker' && (
          <div className="modern-card p-6 mb-8 timer-section-enter">
            <div className="flex justify-between items-center mb-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-semibold text-black" style={{ fontFamily: 'Raleway, sans-serif' }}>Poker Timer Settings</h2>
                <p className="text-gray-600 mt-1">Configure blind levels and their durations</p>
              </div>
              <button
                onClick={addBlindLevel}
                className="btn-primary"
              >
                Add Level
              </button>
            </div>

            {/* Duration Auto Select */}
            <div className="glass-card p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">Quick Duration Set</h3>
                  <p className="text-sm text-gray-600">Set duration for all levels at once</p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Minutes"
                    className="w-[200px] px-4 py-2 rounded-lg border border-[#EBEBEB] focus:border-[#12C4E7] focus:ring-1 focus:ring-[#12C4E7] bg-white text-gray-700"
                    min="1"
                    onChange={(e) => {
                      const duration = parseInt(e.target.value);
                      if (!isNaN(duration) && duration > 0) {
                        setPokerLevels(prev => prev.map(level => ({
                          ...level,
                          duration
                        })));
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">min</span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden">
              {/* Column Headers */}
              <div className="grid grid-cols-5 gap-4 mb-4 px-4 text-gray-600">
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
                    className="grid grid-cols-5 gap-4 items-center p-4 rounded-lg bg-white border border-[#EBEBEB] transition-all hover:border-[#12C4E7]"
                  >
                    <div className="text-black">Level {index + 1}</div>
                    <div>
                      <input
                        type="number"
                        value={level.smallBlind}
                        onChange={(e) => updateBlindLevel(index, 'smallBlind', e.target.value ? parseInt(e.target.value) : 0)}
                        className="w-full"
                        min="0"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={level.bigBlind}
                        onChange={(e) => updateBlindLevel(index, 'bigBlind', e.target.value ? parseInt(e.target.value) : 0)}
                        className="w-full"
                        min="0"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={level.duration}
                        onChange={(e) => updateBlindLevel(index, 'duration', e.target.value ? parseInt(e.target.value) : 1)}
                        className="w-full"
                        min="1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeLevel(index)}
                        disabled={pokerLevels.length === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          pokerLevels.length === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-[#FE6651] hover:bg-red-50'
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

            <div className="mt-6 text-sm text-gray-600 bg-white p-4 rounded-lg border border-[#EBEBEB]">
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-[#12C4E7] rounded-full"></span>
                  <span>Small Blind: The initial forced bet for the player to the left of the dealer</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-[#12C4E7] rounded-full"></span>
                  <span>Big Blind: Usually double the small blind, placed by the player two positions left of the dealer</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-[#12C4E7] rounded-full"></span>
                  <span>Duration: How long this level will last in minutes</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {timerMode === 'basketball' && (
          <div className="modern-card p-6 mb-8 timer-section-enter">
            <div className="animate-fade-in">
              <div>
                <h2 className="text-2xl font-semibold text-black mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>Basketball Timer Settings</h2>
                <p className="text-gray-600 mb-6">Configure game format and quarter length</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-semibold text-black mb-4" style={{ fontFamily: 'Raleway, sans-serif' }}>Game Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Period Length (minutes)</label>
                      <input
                        type="number"
                        value={quarterLength}
                        onChange={(e) => setQuarterLength(e.target.value ? parseInt(e.target.value) : 1)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        min="1"
                        placeholder="Minutes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Game Format</label>
                      <div className="relative">
                        <select
                          value={totalPeriods}
                          onChange={(e) => setTotalPeriods(parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white appearance-none pr-10"
                        >
                          <option value={2}>Halves (2 Periods)</option>
                          <option value={4}>Quarters (4 Periods)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-xl font-semibold text-black mb-4" style={{ fontFamily: 'Raleway, sans-serif' }}>Score</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
                        <input
                          type="number"
                          value={homeScore}
                          onChange={(e) => {
                            const newScore = e.target.value ? parseInt(e.target.value) : 0;
                            setHomeScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                homeScore: newScore,
                              });
                            }
                          }}
                          className="w-full text-xl text-center"
                          min="0"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            const newScore = homeScore + 1;
                            setHomeScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                homeScore: newScore,
                              });
                            }
                          }}
                          className="btn-primary text-sm py-1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => {
                            const newScore = homeScore + 2;
                            setHomeScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                homeScore: newScore,
                              });
                            }
                          }}
                          className="btn-primary text-sm py-1"
                        >
                          +2
                        </button>
                        <button
                          onClick={() => {
                            const newScore = homeScore + 3;
                            setHomeScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                homeScore: newScore,
                              });
                            }
                          }}
                          className="btn-primary text-sm py-1"
                        >
                          +3
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const newScore = Math.max(0, homeScore - 1);
                          setHomeScore(newScore);
                          const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                          if (currentState.basketballState) {
                            setBasketballState({
                              ...currentState.basketballState,
                              homeScore: newScore,
                            });
                          }
                        }}
                        className="btn-danger w-full text-sm py-1"
                      >
                        Undo (-1)
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
                        <input
                          type="number"
                          value={awayScore}
                          onChange={(e) => {
                            const newScore = e.target.value ? parseInt(e.target.value) : 0;
                            setAwayScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                awayScore: newScore,
                              });
                            }
                          }}
                          className="w-full text-xl text-center"
                          min="0"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            const newScore = awayScore + 1;
                            setAwayScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                awayScore: newScore,
                              });
                            }
                          }}
                          className="btn-primary text-sm py-1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => {
                            const newScore = awayScore + 2;
                            setAwayScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                awayScore: newScore,
                              });
                            }
                          }}
                          className="btn-primary text-sm py-1"
                        >
                          +2
                        </button>
                        <button
                          onClick={() => {
                            const newScore = awayScore + 3;
                            setAwayScore(newScore);
                            const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                            if (currentState.basketballState) {
                              setBasketballState({
                                ...currentState.basketballState,
                                awayScore: newScore,
                              });
                            }
                          }}
                          className="btn-primary text-sm py-1"
                        >
                          +3
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const newScore = Math.max(0, awayScore - 1);
                          setAwayScore(newScore);
                          const currentState = JSON.parse(localStorage.getItem('timerState') || '{}');
                          if (currentState.basketballState) {
                            setBasketballState({
                              ...currentState.basketballState,
                              awayScore: newScore,
                            });
                          }
                        }}
                        className="btn-danger w-full text-sm py-1"
                      >
                        Undo (-1)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600 bg-white p-4 rounded-lg border border-[#EBEBEB]">
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-[#12C4E7] rounded-full"></span>
                    <span>Game Format: Choose between halves (2 periods) or quarters (4 periods)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-[#12C4E7] rounded-full"></span>
                    <span>Period Length: Set the duration of each period in minutes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Media Management */}
        <div className="modern-card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-black" style={{ fontFamily: 'Raleway, sans-serif' }}>Media Sequence</h2>
              <p className="text-gray-600 mt-1">Drag and drop to reorder your media</p>
            </div>
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="btn-primary cursor-pointer"
              >
                +Add Media
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {mediaItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center p-4 bg-white rounded-lg border border-[#EBEBEB] cursor-move hover:border-[#12C4E7] transition-colors"
              >
                <div className="relative w-16 h-16 mr-4 rounded-lg overflow-hidden bg-gray-100">
                  {item.type === 'video' ? (
                    <video
                      src={item.path}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={item.path}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized // Since we're using local blob URLs
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-black font-medium">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {index + 1}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Duration: {item.type === 'video' ? 'Full length' : '15 seconds'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMediaItems(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="ml-4 p-2 text-gray-400 hover:text-[#FE6651] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}

            {mediaItems.length === 0 && (
              <div className="text-center py-12 text-gray-600 bg-white rounded-lg border border-[#EBEBEB]">
                <p className="text-lg">No media items added</p>
                <p className="text-sm mt-2">Click +Add Media to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Launch Display */}
        <div className="flex justify-center">
          <button
            onClick={launchDisplay}
            disabled={!timerMode || mediaItems.length === 0}
            className={`px-8 py-4 rounded-lg font-semibold text-white transition-all ${
              !timerMode || mediaItems.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            Launch Lumeo
          </button>
        </div>
      </div>
    </div>
  );
}
