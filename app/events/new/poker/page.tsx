'use client';

import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import BlindLevelsStep from './components/BlindLevelsStep';
import RoomManagementStep from './components/RoomManagementStep';
import MediaSelectionStep from './components/MediaSelectionStep';
import DisplaySettingsStep from './components/DisplaySettingsStep';
import ReviewSubmitStep from './components/ReviewSubmitStep';
import { BlindLevel, MediaItem } from '@/app/types';
import { useTimer } from '@/app/contexts/TimerContext';
import { useMedia } from '@/app/contexts/MediaContext';
import { usePokerRoom } from '@/app/contexts/PokerRoomContext';
import { useRouter } from 'next/navigation';

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
  const [eventId, setEventId] = useState<string | null>(null);
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

  const { setActiveTimer, setPokerState } = useTimer();
  const { storeMediaItems } = useMedia();
  const { setState } = usePokerRoom();
  const router = useRouter();

  // Create event when component mounts
  useEffect(() => {
    const createEvent = async () => {
      try {
        console.log('[Init] Starting poker event creation');
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: eventName,
            type: 'POKER',
            status: 'SCHEDULED',
            settings: {
              isRunning: false,
              currentLevel: 0,
              timeRemaining: 0,
              levels: [],
              breakDuration: 0,
              totalPlayTime: 0
            },
            mediaItems: [],
            displaySettings: {
              aspectRatio: '16:9',
              timerPosition: 'top-right',
              mediaInterval: 15,
              showTimer: true,
              theme: 'dark',
              customColors: {
                timerText: '#FFFFFF',
                timerBackground: '#000000',
              },
            },
            roomManagement: {
              isRoomManagementEnabled: false,
              showWaitlistOnDisplay: false
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create event');
        }

        const createdEvent = await response.json();
        console.log('[Init] Event created successfully:', {
          id: createdEvent.id,
          name: createdEvent.name,
          type: createdEvent.type,
          status: createdEvent.status
        });

        // Store event ID in state and localStorage
        setEventId(createdEvent.id);
        localStorage.setItem('activeEventId', createdEvent.id);
        
        console.log('[Init] Event ID stored:', {
          stateEventId: createdEvent.id,
          localStorageEventId: localStorage.getItem('activeEventId')
        });

      } catch (error) {
        console.error('[Init] Error:', error);
        alert(error instanceof Error ? error.message : 'Failed to create event');
      }
    };

    createEvent();
  }, [eventName]);

  const handleBlindLevelsComplete = async (blindLevels: BlindLevel[]) => {
    if (!eventId) return;

    setEventData({ ...eventData, blindLevels });

    // Update event settings in database
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            ...eventData.settings,
            levels: blindLevels
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update blind levels');
      }
    } catch (error) {
      console.error('Error updating blind levels:', error);
    }
  };

  const handleRoomManagementComplete = async (roomSettings: { 
    isRoomManagementEnabled: boolean; 
    showWaitlistOnDisplay: boolean 
  }) => {
    if (!eventId) return;

    setEventData({ ...eventData, roomManagement: roomSettings });

    // Update event settings in database
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomManagement: roomSettings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update room management settings');
      }
    } catch (error) {
      console.error('Error updating room management settings:', error);
    }
  };

  const handleMediaComplete = async (mediaItems: MediaItem[]) => {
    if (!eventId) return;

    setEventData({ ...eventData, mediaItems });

    // Update event settings in database
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaItems
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update media items');
      }
    } catch (error) {
      console.error('Error updating media items:', error);
    }
  };

  const handleDisplaySettingsComplete = async (displaySettings: {
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
    if (!eventId) return;

    setEventData({ ...eventData, displaySettings });

    // Update event settings in database
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displaySettings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update display settings');
      }
    } catch (error) {
      console.error('Error updating display settings:', error);
    }
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
      if (!eventId || !eventData.blindLevels) {
        throw new Error('Event ID or blind levels not configured');
      }

      // Create initial poker state
      const pokerSettings = {
        isRunning: true,
        currentLevel: 0,
        timeRemaining: eventData.blindLevels[0].duration * 60,
        levels: eventData.blindLevels,
        breakDuration: 0,
        totalPlayTime: eventData.blindLevels.reduce((total, level) => total + level.duration, 0)
      };

      console.log('[Launch] Activating poker event with settings:', {
        eventName,
        type: 'POKER',
        settings: pokerSettings,
        mediaItemsCount: eventData.mediaItems?.length,
        roomManagement: eventData.roomManagement
      });

      // Update event status to ACTIVE and set final settings
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ACTIVE',
          startedAt: new Date().toISOString(),
          name: eventName,
          settings: pokerSettings,
          mediaItems: eventData.mediaItems || [],
          displaySettings: eventData.displaySettings,
          roomManagement: eventData.roomManagement
        })
      });

      if (!response.ok) {
        throw new Error('Failed to activate event');
      }

      console.log('[Launch] Event activated successfully');

      // Initialize poker room state
      const initialPokerRoomState = {
        tables: [],
        waitingList: [],
        showRoomInfo: true,
        isRoomManagementEnabled: eventData.roomManagement?.isRoomManagementEnabled ?? false,
        showWaitlistOnDisplay: eventData.roomManagement?.showWaitlistOnDisplay ?? false
      };
      localStorage.setItem('pokerRoomState', JSON.stringify(initialPokerRoomState));

      // Initialize timer state
      setActiveTimer('poker');
      setPokerState(pokerSettings);

      // Initialize media state
      if (eventData.mediaItems) {
        storeMediaItems(eventData.mediaItems);
      }

      // Store display settings
      if (eventData.displaySettings) {
        localStorage.setItem('displaySettings', JSON.stringify(eventData.displaySettings));
      }

      // Navigate to event management page
      router.push(`/events/active/${eventId}`);

    } catch (error) {
      console.error('[Launch] Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to launch event');
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