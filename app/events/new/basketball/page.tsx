'use client';

import { useState } from 'react';
import { BasketballTimerState, MediaItem } from '@/app/types';
import TimerSettingsStep from './components/TimerSettingsStep';
import MediaSelectionStep from '../poker/components/MediaSelectionStep';
import DisplaySettingsStep from '../poker/components/DisplaySettingsStep';
import ReviewSubmitStep from '../poker/components/ReviewSubmitStep';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, name: 'Timer' },
  { id: 2, name: 'Select Media' },
  { id: 3, name: 'Display Settings' },
  { id: 4, name: 'Review & Submit' },
];

export default function NewBasketballEvent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventName, setEventName] = useState('New Basketball Event');
  const [isEditingName, setIsEditingName] = useState(false);
  const [timerSettings, setTimerSettings] = useState<BasketballTimerState | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [displaySettings, setDisplaySettings] = useState({
    aspectRatio: '16:9' as '16:9' | '4:3' | '21:9',
    timerPosition: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    mediaInterval: 15,
    showTimer: true,
    theme: 'dark' as 'dark' | 'light',
    customColors: {
      timerText: '#FFFFFF',
      timerBackground: '#000000',
    },
  });

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/dashboard');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TimerSettingsStep
            onCompleteAction={(settings) => {
              setTimerSettings(settings);
            }}
          />
        );
      case 2:
        return (
          <MediaSelectionStep
            onCompleteAction={(media) => {
              setSelectedMedia(media);
              handleNextStep();
            }}
          />
        );
      case 3:
        return (
          <DisplaySettingsStep
            onCompleteAction={(settings) => {
              setDisplaySettings(settings);
            }}
            selectedMedia={selectedMedia}
          />
        );
      case 4:
        if (!timerSettings) return null;
        return (
          <ReviewSubmitStep
            eventName={eventName}
            blindLevels={[]}
            roomManagement={{
              isRoomManagementEnabled: false,
              showWaitlistOnDisplay: false,
            }}
            mediaItems={selectedMedia}
            displaySettings={displaySettings}
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
              {currentStep < 4 && (
                <button
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && !timerSettings}
                  className="absolute -right-32 px-4 py-2 rounded-lg font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              )}

              {/* Progress Line */}
              <div className="absolute left-5 right-20 top-[16px] -translate-y-1/2 h-[2px]">
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
          {currentStep === 4 && (
            <div className="mt-12">
              <button
                onClick={() => {/* TODO: Implement launch functionality */}}
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