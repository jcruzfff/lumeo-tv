'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import BlindLevelsStep from './components/BlindLevelsStep';
import RoomManagementStep from './components/RoomManagementStep';
import MediaSelectionStep from './components/MediaSelectionStep';
import DisplaySettingsStep from './components/DisplaySettingsStep';
import ReviewSubmitStep from './components/ReviewSubmitStep';
import { BlindLevel, MediaItem } from '@/app/types';
import { useRouter } from 'next/navigation';
import { useTimer } from '@/app/contexts/TimerContext';
import { useMedia } from '@/app/contexts/MediaContext';
import { usePokerRoom } from '@/app/contexts/PokerRoomContext';

const steps = [
  { id: 1, name: 'Set Blind Levels', href: '#' },
  { id: 2, name: 'Room Management', href: '#' },
  { id: 3, name: 'Select Media', href: '#' },
  { id: 4, name: 'Display Settings', href: '#' },
  { id: 5, name: 'Review & Submit', href: '#' },
];

export default function NewPokerEvent() {
  const [eventName, setEventName] = useState('New Poker Event');
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState<{
    blindLevels?: BlindLevel[];
    roomManagement?: {
      isRoomManagementEnabled: boolean;
      showWaitlistOnDisplay: boolean;
    };
    mediaItems?: MediaItem[];
    displaySettings?: {
      aspectRatio: '16:9' | '4:3' | '21:9';
      timerPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      mediaInterval: number;
      showTimer: boolean;
      theme: 'dark' | 'light';
      customColors: {
        timerText: string;
        timerBackground: string;
      };
    };
  }>({
    roomManagement: {
      isRoomManagementEnabled: false,
      showWaitlistOnDisplay: false
    }
  });

  const router = useRouter();
  const { setActiveTimer, setPokerState } = useTimer();
  const { storeMediaItems } = useMedia();
  const { setState: setPokerRoomState } = usePokerRoom();

  const handleBlindLevelsComplete = (blindLevels: BlindLevel[]) => {
    setEventData({ ...eventData, blindLevels });
  };

  const handleRoomManagementComplete = (roomSettings: { 
    isRoomManagementEnabled: boolean; 
    showWaitlistOnDisplay: boolean 
  }) => {
    setEventData({ ...eventData, roomManagement: roomSettings });
  };

  const handleMediaComplete = (mediaItems: MediaItem[]) => {
    setEventData({ ...eventData, mediaItems });
  };

  const handleDisplaySettingsComplete = (displaySettings: {
    aspectRatio: '16:9' | '4:3' | '21:9';
    timerPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    mediaInterval: number;
    showTimer: boolean;
    theme: 'dark' | 'light';
    customColors: {
      timerText: string;
      timerBackground: string;
    };
  }) => {
    setEventData({ ...eventData, displaySettings });
  };

  const handleNextStep = () => {
    if (currentStep === 1 && eventData.blindLevels && eventData.blindLevels.length > 0) {
      setCurrentStep(2);
    } else if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      // If we're at the first step, go back to the dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleLaunchLumeo = async () => {
    try {
      if (!eventData.blindLevels || eventData.blindLevels.length === 0) {
        throw new Error('Blind levels not configured');
      }

      // Create the initial poker state
      const pokerSettings = {
        isRunning: true,
        currentLevel: 0,
        timeRemaining: eventData.blindLevels[0].duration * 60, // Convert minutes to seconds
        levels: eventData.blindLevels,
        breakDuration: 0,
        totalPlayTime: eventData.blindLevels.reduce((total, level) => total + level.duration, 0)
      };

      console.log('Creating poker event with settings:', pokerSettings);

      // Create the event in the database
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventName,
          type: 'POKER',
          status: 'ACTIVE',
          startedAt: new Date().toISOString(),
          settings: pokerSettings,
          mediaItems: eventData.mediaItems || [],
          roomManagement: eventData.roomManagement || {
            isRoomManagementEnabled: false,
            showWaitlistOnDisplay: false
          }
        }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to create event');
      }

      const event = await response.json();
      console.log('Event created:', event);

      // Update timer state
      setPokerState(pokerSettings);
      setActiveTimer('poker');

      // Store media items
      if (eventData.mediaItems) {
        storeMediaItems(eventData.mediaItems);
        localStorage.setItem('mediaState', JSON.stringify({
          mediaItems: eventData.mediaItems,
          currentMediaIndex: 0,
        }));
      }

      // Store display settings
      if (eventData.displaySettings) {
        localStorage.setItem('displaySettings', JSON.stringify(eventData.displaySettings));
      }

      // Store room management state if enabled
      if (eventData.roomManagement?.isRoomManagementEnabled) {
        // Get existing poker room state
        const existingState = localStorage.getItem('pokerRoomState');
        const parsedExistingState = existingState ? JSON.parse(existingState) : null;
        
        setPokerRoomState({
          tables: parsedExistingState?.tables || [],
          waitingList: parsedExistingState?.waitingList || [], // Preserve existing waitlist
          showRoomInfo: true,
          isRoomManagementEnabled: eventData.roomManagement.isRoomManagementEnabled,
          showWaitlistOnDisplay: eventData.roomManagement.showWaitlistOnDisplay
        });
      }

      // Store the event ID
      localStorage.setItem('activeEventId', event.id);

      // Get the actual host URL and open display in new window
      const protocol = window.location.protocol;
      const host = window.location.host;
      const displayUrl = `${protocol}//${host}/display`;
      window.open(displayUrl, '_blank');

      // Navigate to active events
      router.push('/events/active');
    } catch (error) {
      console.error('Error launching display:', error);
      if (error instanceof Error) {
        alert(`Failed to launch display: ${error.message}`);
      } else {
        alert('Failed to launch display. Please try again.');
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BlindLevelsStep onCompleteAction={handleBlindLevelsComplete} />;
      case 2:
        return <RoomManagementStep onCompleteAction={handleRoomManagementComplete} />;
      case 3:
        return <MediaSelectionStep onCompleteAction={handleMediaComplete} />;
      case 4:
        return <DisplaySettingsStep 
          onCompleteAction={handleDisplaySettingsComplete} 
          selectedMedia={eventData.mediaItems || []}
        />;
      case 5:
        return <ReviewSubmitStep 
          eventName={eventName}
          blindLevels={eventData.blindLevels || []}
          roomManagement={eventData.roomManagement || { isRoomManagementEnabled: false, showWaitlistOnDisplay: false }}
          mediaItems={eventData.mediaItems || []}
          displaySettings={eventData.displaySettings || {
            aspectRatio: '16:9',
            timerPosition: 'top-right',
            mediaInterval: 15,
            showTimer: true,
            theme: 'dark',
            customColors: {
              timerText: '#FFFFFF',
              timerBackground: '#000000',
            },
          }}
        />;
      default:
        return <div>Step {currentStep} content coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8 flex flex-col">
      <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] px-4 py-8 pt-12">
        <div className="max-w-6xl mx-auto">

           {/* Event Name */}
           <div className="mb-12 text-center">
            {isEditingName ? (
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-2xl font-bold bg-transparent border-b border-brand-primary focus:outline-none text-text-primary text-center"
                autoFocus
              />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold text-text-primary">{eventName}</h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>
          {/* Progress Steps with Navigation */}
          <div className="mb-12 relative">
            <div className="w-[70%] mx-auto flex items-center justify-between relative px-4">
              {/* Left Navigation Button */}
              <button 
                onClick={handleBackStep}
                className="absolute -left-32 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors bg-dark-surface border border-dark-border hover:bg-dark-surface-lighter"
              >
                {currentStep === 1 ? 'Exit' : 'Go Back'}
              </button>

              {/* Right Navigation Button */}
              {currentStep < 5 && (
                <button
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && (!eventData.blindLevels || eventData.blindLevels.length === 0)}
                  className="absolute -right-32 px-4 py-2 rounded-lg font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              )}

              {/* Progress Line */}
              <div className="absolute left-20 right-20 top-[16px] -translate-y-1/2 h-[2px]">
                {/* Dotted background line */}
                <div className="absolute inset-0 border-t-2 border-dotted border-dark-border"></div>
                {/* Solid progress line */}
                <div 
                  className="absolute left-0 h-[2px] bg-brand-primary transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Steps */}
              {steps.map((step) => (
                <div key={step.id} className="relative z-10">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step.id === currentStep
                          ? 'bg-brand-primary text-white'
                          : step.id < currentStep
                          ? 'bg-brand-primary text-white'
                          : 'bg-dark-surface text-text-tertiary'
                      } border-2 ${
                        step.id <= currentStep ? 'border-brand-primary' : 'border-dark-border'
                      }`}
                    >
                      {step.id < currentStep ? '✓' : step.id}
                    </div>
                    <span className="mt-2 text-sm font-medium text-text-secondary">
                      {step.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

         

          {/* Content Area */}
          <div className="bg-dark-surface/80 backdrop-blur-sm border border-[#2C2C2E] p-8 rounded-[24px] overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Launch Button */}
          {currentStep === 5 && (
            <div className="mt-12">
              <button
                onClick={handleLaunchLumeo}
                className="w-full max-w-md mx-auto block px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors"
              >
                Launch Lumeo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 