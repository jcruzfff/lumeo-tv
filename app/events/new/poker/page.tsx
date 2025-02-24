'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';
import BlindLevelsStep from '@/app/events/new/poker/components/BlindLevelsStep';
import RoomManagementStep from '@/app/events/new/poker/components/RoomManagementStep';
import MediaSelectionStep from '@/app/events/new/poker/components/MediaSelectionStep';
import DisplaySettingsStep from '@/app/events/new/poker/components/DisplaySettingsStep';
import ReviewSubmitStep from '@/app/events/new/poker/components/ReviewSubmitStep';
import { BlindLevel, MediaItem } from '@/app/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface EventData {
  blindLevels: BlindLevel[];
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
  mediaItems: MediaItem[];
  roomManagement?: {
    isRoomManagementEnabled: boolean;
    showWaitlistOnDisplay: boolean;
  };
  settings?: {
    isRunning: boolean;
    currentLevel: number;
    timeRemaining: number;
    levels: BlindLevel[];
    breakDuration: number;
    totalPlayTime: number;
  };
}

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
  const hasCreatedEvent = useRef(false);
  const [eventData, setEventData] = useState<EventData>({
    blindLevels: [],
    displaySettings: undefined,
    mediaItems: []
  });
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  // Create event when component mounts
  useEffect(() => {
    const createEvent = async () => {
      console.log('[Init] Checking event creation status:', {
        hasCreated: hasCreatedEvent.current,
        eventId
      });

      if (hasCreatedEvent.current || eventId) {
        console.log('[Init] Event already created, skipping');
        return;
      }

      hasCreatedEvent.current = true;
      console.log('[Init] Setting hasCreatedEvent to true');

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
              isRoomManagementEnabled: false,
              showWaitlistOnDisplay: false,
              timer: {
                isRunning: false,
                currentLevel: 0,
                timeRemaining: 0,
                levels: []
              },
              display: {
                aspectRatio: '16:9',
                timerPosition: 'top-right',
                mediaInterval: 15,
                showTimer: true,
                theme: 'dark',
                customColors: {
                  timerText: '#FFFFFF',
                  timerBackground: '#000000'
                }
              }
            }
          })
        });

        if (!response.ok) {
          hasCreatedEvent.current = false;
          throw new Error('Failed to create event');
        }

        const createdEvent = await response.json();
        console.log('[Init] Event created successfully:', createdEvent);

        setEventId(createdEvent.id);
        localStorage.setItem('activeEventId', createdEvent.id);
        
        console.log('[Init] Event ID stored:', {
          stateEventId: createdEvent.id,
          localStorageEventId: localStorage.getItem('activeEventId')
        });

      } catch (error) {
        console.error('[Init] Error:', error);
        hasCreatedEvent.current = false;
        alert(error instanceof Error ? error.message : 'Failed to create event');
      }
    };

    createEvent();
  }, [eventId, eventName]); // Add missing dependencies

  const handleBlindLevelsComplete = async (blindLevels: BlindLevel[]) => {
    if (!eventId) return;

    setEventData({ ...eventData, blindLevels });

    try {
      console.log('[BlindLevels] Updating blind levels:', blindLevels);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            isRunning: false,
            currentLevel: 0,
            timeRemaining: 0,
            levels: blindLevels.map(level => ({
              ...level,
              duration: level.duration * 60 // Convert minutes to seconds
            })),
            isRoomManagementEnabled: eventData.roomManagement?.isRoomManagementEnabled ?? false,
            showWaitlistOnDisplay: eventData.roomManagement?.showWaitlistOnDisplay ?? false
          }
        })
      });

      const responseText = await response.text();
      console.log('[BlindLevels] Raw response:', responseText);

      if (!response.ok) {
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.details || error.error || 'Failed to update blind levels');
        } catch {
          throw new Error(`Failed to update blind levels: ${responseText}`);
        }
      }

      try {
        const updatedEvent = JSON.parse(responseText);
        console.log('[BlindLevels] Update successful:', updatedEvent);
      } catch (e) {
        console.error('[BlindLevels] Failed to parse response:', e);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('[BlindLevels] Error:', error);
      throw error;
    }
  };

  const handleRoomManagementComplete = (roomSettings: { isRoomManagementEnabled: boolean; showWaitlistOnDisplay: boolean }) => {
    console.log('[RoomManagementComplete] Received settings:', roomSettings);
    
    // Get current poker room state
    const pokerRoomState = localStorage.getItem('pokerRoomState');
    const currentState = pokerRoomState ? JSON.parse(pokerRoomState) : { tables: [], waitingList: [] };
    
    // Update event data with room management settings
    setEventData(prev => ({
      ...prev,
      roomManagement: roomSettings
    }));

    // Store updated state in localStorage
    localStorage.setItem('pokerRoomState', JSON.stringify({
      ...currentState,
      showRoomInfo: true,
      isRoomManagementEnabled: roomSettings.isRoomManagementEnabled,
      showWaitlistOnDisplay: roomSettings.showWaitlistOnDisplay
    }));

    console.log('[RoomManagementComplete] Updated event data and localStorage');
    handleNextStep();
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
          mediaItems: mediaItems.map(item => ({
            type: item.type,
            url: item.url,
            displayOrder: item.displayOrder,
            duration: item.duration
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
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

    // Store display settings in localStorage
    try {
      console.log('[Display] Storing display settings in localStorage:', displaySettings);
      localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
    } catch (error) {
      console.error('Error storing display settings:', error);
    }

    // Update event settings in database
    try {
      console.log('[Display] Updating display settings:', {
        eventId,
        displaySettings,
        currentEventData: eventData
      });

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displaySettings,
          settings: eventData.settings // Include current event settings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to update display settings');
      }

      console.log('[Display] Settings updated successfully');
    } catch (error) {
      console.error('Error updating display settings:', error);
      throw error; // Re-throw to handle in the UI
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

  const handleSaveEvent = async () => {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      if (!eventData.blindLevels) {
        throw new Error('Blind levels are required');
      }

      setIsSaving(true);
      toast.loading('Saving event...');

      // Log the current state before saving
      console.log('[SaveEvent] Current event data:', {
        eventId,
        blindLevels: eventData.blindLevels,
        mediaItems: eventData.mediaItems,
        roomManagement: eventData.roomManagement,
        displaySettings: eventData.displaySettings
      });

      // Get current poker room state from localStorage
      const pokerRoomState = localStorage.getItem('pokerRoomState');
      console.log('[SaveEvent] Current poker room state from localStorage:', pokerRoomState ? JSON.parse(pokerRoomState) : null);

      // Create poker settings with timer initially stopped
      const pokerSettings = {
        isRunning: false,
        levels: eventData.blindLevels.map((level: BlindLevel) => ({
          smallBlind: level.smallBlind,
          bigBlind: level.bigBlind,
          duration: level.duration,
        })),
        currentLevel: 0,
        timeRemaining: eventData.blindLevels[0].duration * 60,
        breakDuration: 0,
        totalPlayTime: 0,
      };

      // Get tables and waitlist from poker room state
      const roomState = pokerRoomState ? JSON.parse(pokerRoomState) : { tables: [], waitingList: [] };
      console.log('[SaveEvent] Room state to be saved:', roomState);

      // Save event with SCHEDULED status
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SCHEDULED',
          settings: pokerSettings,
          displaySettings: eventData.displaySettings || {
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
          tables: roomState.tables || [],
          waitingList: roomState.waitingList || [],
          mediaItems: eventData.mediaItems || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      const savedEvent = await response.json();
      console.log('[SaveEvent] Event saved successfully:', savedEvent);

      toast.dismiss();
      toast.success('Event saved successfully!');

      // Navigate to active events page after a short delay
      setTimeout(() => {
        router.push('/events/active');
      }, 1000);
    } catch (error) {
      console.error('[SaveEvent] Error saving event:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setIsSaving(false);
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
        // Log all state before rendering review step
        console.log('[Review] Current state before review:', {
          eventId,
          eventName,
          eventData,
          localStorage: {
            pokerRoomState: localStorage.getItem('pokerRoomState'),
            displaySettings: localStorage.getItem('displaySettings'),
            activeEventId: localStorage.getItem('activeEventId')
          }
        });

        // Get current poker room state from localStorage
        const pokerRoomState = localStorage.getItem('pokerRoomState');
        const roomState = pokerRoomState ? JSON.parse(pokerRoomState) : { tables: [], waitingList: [] };
        
        console.log('[Review] Room state from localStorage:', {
          raw: pokerRoomState,
          parsed: roomState,
          tables: roomState.tables || [],
          waitingList: roomState.waitingList || [],
          isRoomManagementEnabled: roomState.isRoomManagementEnabled,
          showWaitlistOnDisplay: roomState.showWaitlistOnDisplay
        });

        // Log the props being passed to ReviewSubmitStep
        const reviewProps = {
          eventName,
          blindLevels: eventData.blindLevels,
          roomManagement: eventData.roomManagement || {
            isRoomManagementEnabled: roomState.isRoomManagementEnabled || false,
            showWaitlistOnDisplay: roomState.showWaitlistOnDisplay || false
          },
          mediaItems: eventData.mediaItems,
          displaySettings: eventData.displaySettings || {
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
          tables: roomState.tables || [],
          waitingList: roomState.waitingList || []
        };

        console.log('[Review] Props being passed to ReviewSubmitStep:', reviewProps);
        
        return (
          <ReviewSubmitStep
            {...reviewProps}
          />
        );
      default:
        return null;
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

          {/* Save Button */}
          {currentStep === 5 && (
            <div className="mt-12">
              <button
                onClick={handleSaveEvent}
                disabled={isSaving}
                className={`w-full max-w-md mx-auto block px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-all ${
                  isSaving ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </div>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 