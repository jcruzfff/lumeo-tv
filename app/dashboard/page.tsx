'use client';

import { useState, useCallback } from 'react';
import { MediaItem, BlindLevel, PokerTimerState, BasketballTimerState, CustomTimerState } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTimer } from '../contexts/TimerContext';
import Image from 'next/image';
import ActiveDisplayOverview from '../components/ActiveDisplayOverview';
import PokerRoomManager from '../components/poker/PokerRoomManager';
import { useMedia } from '../contexts/MediaContext';
import { usePokerRoom } from '../contexts/PokerRoomContext';

export default function AdminDashboard() {
  // Timer Mode Selection
  const [timerMode, setTimerMode] = useState<'poker' | 'basketball' | 'custom' | null>(null);

  // Basketball Settings
  const [quarterLength, setQuarterLength] = useState(12); // minutes
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [totalPeriods, setTotalPeriods] = useState(4);

  // Media Management
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const { storeMediaItems } = useMedia();
  
  // Timer Context
  const { 
    setActiveTimer, 
    setPokerState, 
    setBasketballState, 
    setCustomTimerState,
    basketballState 
  } = useTimer();

  // Poker Room Context
  const {
    waitingList,
    isRoomManagementEnabled,
    showWaitlistOnDisplay,
    tables
  } = usePokerRoom();

  // Custom Timer Settings
  const [customDuration, setCustomDuration] = useState(5); // 5 minutes default

  // Poker Timer Settings
  const [pokerLevels, setPokerLevels] = useState<BlindLevel[]>([
    { id: uuidv4(), smallBlind: 25, bigBlind: 50, duration: 20 }
  ]);

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
    storeMediaItems(updatedItems);
  }, [mediaItems, storeMediaItems]);

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
    storeMediaItems(newItems);
  };

  // Launch display
  const launchDisplay = async () => {
    try {
      let eventSettings: PokerTimerState | BasketballTimerState | CustomTimerState;
      let eventName = '';

      if (timerMode === 'poker') {
        eventSettings = {
          isRunning: true,
          currentLevel: 0,
          timeRemaining: pokerLevels[0].duration * 60,
          levels: pokerLevels,
          breakDuration: 10,
          totalPlayTime: 0,
        };
        eventName = 'Poker Tournament';

        // Store poker room state in localStorage with current state
        const pokerRoomState = {
          tables,
          waitingList,
          showRoomInfo: true,
          isRoomManagementEnabled,
          showWaitlistOnDisplay,
        };
        console.log('Saving poker room state:', pokerRoomState);
        localStorage.setItem('pokerRoomState', JSON.stringify(pokerRoomState));
      } else if (timerMode === 'basketball') {
        eventSettings = {
          isRunning: true,
          gameTime: quarterLength * 60,
          period: 1,
          homeScore,
          awayScore,
          shotClockTime: 24,
        };
        eventName = 'Basketball Game';
      } else if (timerMode === 'custom') {
        eventSettings = {
          isRunning: true,
          timeRemaining: customDuration * 60,
          duration: customDuration,
        };
        eventName = 'Custom Timer';
      } else {
        throw new Error('No timer mode selected');
      }

      // Create the event in the database
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventName,
          type: timerMode?.toUpperCase(),
          settings: eventSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const event = await response.json();
      console.log('Event created:', event);

      // Update timer states
      if (timerMode === 'poker') {
        setPokerState(eventSettings as PokerTimerState);
      } else if (timerMode === 'basketball') {
        setBasketballState(eventSettings as BasketballTimerState);
      } else if (timerMode === 'custom') {
        setCustomTimerState(eventSettings as CustomTimerState);
      }
      setActiveTimer(timerMode);

      // Store media items in localStorage for now (we'll update this later)
      localStorage.setItem('mediaState', JSON.stringify({
        mediaItems,
        currentMediaIndex: 0,
      }));

      // Store the event ID in localStorage for the display page
      localStorage.setItem('activeEventId', event.id);

      // Open display in new window
      window.open('/display', '_blank');
    } catch (error) {
      console.error('Error launching display:', error);
      alert('Failed to launch display. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#161618] border-l border-t border-[#2C2C2E] rounded-tl-[32px] px-4 py-1">
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-2xl font-bold text-left pb-4 mb-2 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
          Pool Event Timer Dashboard
        </h1>
        
        <ActiveDisplayOverview />

        {/* Timer Mode Selection */}
        <div className="bg-dark-surface/80 
        backdrop-blur-sm border border-[#2C2C2E] p-8 mb-4 rounded-[24px]">
          <h2 className="text-2xl font-semibold mb-8 text-text-primary">Select Event Mode</h2>
          <div className="flex gap-8">
            <label className="flex items-center space-x-4 cursor-pointer group">
              <input
                type="radio"
                value="poker"
                checked={timerMode === 'poker'}
                onChange={(e) => setTimerMode(e.target.value as 'poker')}
                className="w-4 h-4 text-[#496cf2] bg-dark-surface"
              />
              <span className={`${timerMode === 'poker' ? 'text-[#496cf2]' : 'text-text-secondary'} group-hover:text-text-primary transition-colors`}>Poker</span>
            </label>
            <label className="flex items-center space-x-4 cursor-pointer group">
              <input
                type="radio"
                value="basketball"
                checked={timerMode === 'basketball'}
                onChange={(e) => setTimerMode(e.target.value as 'basketball')}
                className="w-4 h-4 text-[#496cf2] bg-dark-surface"
              />
              <span className={`${timerMode === 'basketball' ? 'text-[#496cf2]' : 'text-text-secondary'} group-hover:text-text-primary transition-colors`}>Basketball</span>
            </label>
            <label className="flex items-center space-x-4 cursor-pointer group">
              <input
                type="radio"
                value="custom"
                checked={timerMode === 'custom'}
                onChange={(e) => setTimerMode(e.target.value as 'custom')}
                className="w-4 h-4 text-[#496cf2] bg-dark-surface"
              />
              <span className={`${timerMode === 'custom' ? 'text-[#496cf2]' : 'text-text-secondary'} group-hover:text-text-primary transition-colors`}>Custom</span>
            </label>
          </div>
        </div>

        {/* Timer Settings */}
        {timerMode === 'poker' && (
          <PokerRoomManager
            pokerLevels={pokerLevels}
            onUpdatePokerLevelsAction={setPokerLevels}
          />
        )}

        {timerMode === 'basketball' && (
          <div className="bg-dark-surface/80 backdrop-blur-sm border border-white/5 p-8 mb-8 rounded-xl">
            <div className="animate-fade-in">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-2">Basketball Timer Settings</h2>
                <p className="text-text-secondary mb-8">Configure game format and quarter length</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-[#1F1F21] backdrop-blur-sm p-6 rounded-xl border border-white/5">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Game Configuration</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Period Length (minutes)</label>
                      <input
                        type="number"
                        value={quarterLength}
                        onChange={(e) => setQuarterLength(e.target.value ? parseInt(e.target.value) : 1)}
                        className="w-full px-4 py-2.5 rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 bg-dark-surface text-text-primary placeholder:text-text-tertiary"
                        min="1"
                        placeholder="Minutes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Game Format</label>
                      <div className="relative">
                        <select
                          value={totalPeriods}
                          onChange={(e) => setTotalPeriods(parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 bg-dark-surface text-text-primary appearance-none"
                        >
                          <option value={2}>Halves (2 Periods)</option>
                          <option value={4}>Quarters (4 Periods)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-tertiary">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1F1F21] backdrop-blur-sm p-6 rounded-xl border border-white/5">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Score</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Home Team</label>
                      <div className="text-3xl font-bold text-center mb-4 text-text-primary">{homeScore}</div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <button
                          onClick={() => {
                            setHomeScore((prev: number) => prev + 1);
                            if (basketballState) {
                              setBasketballState({
                                ...basketballState,
                                homeScore: basketballState.homeScore + 1
                              });
                            }
                          }}
                          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => {
                            setHomeScore((prev: number) => prev + 2);
                            if (basketballState) {
                              setBasketballState({
                                ...basketballState,
                                homeScore: basketballState.homeScore + 2
                              });
                            }
                          }}
                          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                        >
                          +2
                        </button>
                        <button
                          onClick={() => {
                            setHomeScore((prev: number) => prev + 3);
                            if (basketballState) {
                              setBasketballState({
                                ...basketballState,
                                homeScore: basketballState.homeScore + 3
                              });
                            }
                          }}
                          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                        >
                          +3
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setHomeScore((prev: number) => Math.max(0, prev - 1));
                          if (basketballState) {
                            setBasketballState({
                              ...basketballState,
                              homeScore: Math.max(0, basketballState.homeScore - 1)
                            });
                          }
                        }}
                        className="w-full bg-status-error hover:bg-status-error/90 text-white rounded-lg p-2 transition-colors duration-200"
                      >
                        Undo (-1)
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Away Team</label>
                      <div className="text-3xl font-bold text-center mb-4 text-text-primary">{awayScore}</div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <button
                          onClick={() => {
                            setAwayScore((prev: number) => prev + 1);
                            if (basketballState) {
                              setBasketballState({
                                ...basketballState,
                                awayScore: basketballState.awayScore + 1
                              });
                            }
                          }}
                          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => {
                            setAwayScore((prev: number) => prev + 2);
                            if (basketballState) {
                              setBasketballState({
                                ...basketballState,
                                awayScore: basketballState.awayScore + 2
                              });
                            }
                          }}
                          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                        >
                          +2
                        </button>
                        <button
                          onClick={() => {
                            setAwayScore((prev: number) => prev + 3);
                            if (basketballState) {
                              setBasketballState({
                                ...basketballState,
                                awayScore: basketballState.awayScore + 3
                              });
                            }
                          }}
                          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg p-2 transition-colors duration-200"
                        >
                          +3
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setAwayScore((prev: number) => Math.max(0, prev - 1));
                          if (basketballState) {
                            setBasketballState({
                              ...basketballState,
                              awayScore: Math.max(0, basketballState.awayScore - 1)
                            });
                          }
                        }}
                        className="w-full bg-status-error hover:bg-status-error/90 text-white rounded-lg p-2 transition-colors duration-200"
                      >
                        Undo (-1)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {timerMode === 'custom' && (
          <div className="bg-dark-surface/80 backdrop-blur-sm border border-white/5 p-8 mb-4 rounded-[24px]">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold text-text-primary mb-2">Custom Timer Settings</h2>
              <p className="text-text-secondary mb-8">Set your countdown duration</p>

              <div className="bg-[#1F1F21] backdrop-blur-sm p-6 rounded-xl border border-white/5 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-text-primary mb-6">Duration</h3>
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value ? parseInt(e.target.value) : 1)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full px-4 py-2.5 text-xl text-center rounded-[8px] border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 focus:outline-none bg-dark-surface text-text-primary"
                  min="1"
                  placeholder="Minutes"
                />
                <p className="text-sm text-text-secondary mt-3">Enter the duration in minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* Media Management */}
        <div className="bg-dark-surface/80 backdrop-blur-sm border border-[#2C2C2E] p-8 mb-8 rounded-[24px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Media Sequence</h2>
              <p className="text-text-secondary mt-2">Drag and drop to reorder your media</p>
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
                className="inline-flex items-center border border-[#2C2C2E] text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 px-4 py-2 rounded-lg transition-colors cursor-pointer"
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
                className="flex items-center p-4 bg-dark-surface backdrop-blur-sm rounded-lg border border-[#2C2C2E] cursor-move hover:border-brand-primary/50 transition-all duration-200"
              >
                <div className="relative w-16 h-16 mr-4 rounded-lg overflow-hidden bg-dark-surface">
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
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-text-primary font-medium">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {index + 1}
                  </div>
                  <div className="text-text-secondary text-sm">
                    Duration: {item.type === 'video' ? 'Full length' : '15 seconds'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMediaItems(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="ml-4 p-2 text-text-tertiary hover:text-status-error transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {mediaItems.length === 0 && (
            <div className="text-center py-12 bg-dark-surface backdrop-blur-sm rounded-lg border border-[#2C2C2E] ">
              <p className="text-text-primary text-lg">No media items added</p>
              <p className="text-text-secondary text-sm mt-2">Click +Add Media to get started</p>
            </div>
          )}
        </div>

        {/* Launch Display */}
        <div className="flex justify-center">
          <button
            onClick={launchDisplay}
            disabled={!timerMode || mediaItems.length === 0}
            className={`px-8 py-4 rounded-lg font-semibold text-white transition-all ${
              !timerMode || mediaItems.length === 0
                ? 'bg-dark-surface text-text-disabled cursor-not-allowed'
                : 'bg-brand-primary hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30'
            }`}
          >
            Launch Lumeo
          </button>
        </div>
      </div>
    </div>
  );
}
