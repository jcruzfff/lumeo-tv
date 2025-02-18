import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BlindLevel, MediaItem } from '@/app/types';
import Image from 'next/image';

interface ReviewSubmitStepProps {
  eventName: string;
  blindLevels: BlindLevel[];
  roomManagement: {
    isRoomManagementEnabled: boolean;
    showWaitlistOnDisplay: boolean;
  };
  mediaItems: MediaItem[];
  displaySettings: {
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
}

function GameDetailsCard({ eventName, blindLevels, displaySettings, mediaItems }: {
  eventName: string;
  blindLevels: BlindLevel[];
  roomManagement: ReviewSubmitStepProps['roomManagement'];
  displaySettings: ReviewSubmitStepProps['displaySettings'];
  mediaItems: MediaItem[];
}) {
  return (
    <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">{eventName}</h3>
      <div className="text-[64px] font-bold text-white leading-none mb-8">10:00</div>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-10">
        <div>
          <div className="text-sm text-text-secondary mb-1">Current Blind Level</div>
          <div className="text-xl font-mono text-text-primary">{blindLevels[0]?.smallBlind}/{blindLevels[0]?.bigBlind}</div>
        </div>
        
        <div>
          <div className="text-sm text-text-secondary mb-1">Next Blind Level</div>
          <div className="text-xl font-mono text-text-primary">{blindLevels[1]?.smallBlind}/{blindLevels[1]?.bigBlind}</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Players seated</div>
          <div className="text-xl font-mono text-text-primary">75</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Waitlist players</div>
          <div className="text-xl font-mono text-text-primary">13</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Intervals</div>
          <div className="text-xl font-mono text-text-primary">{displaySettings.mediaInterval} seconds</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Media</div>
          <div className="text-xl font-mono text-text-primary">{mediaItems.length}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewSubmitStep({
  eventName,
  blindLevels,
  roomManagement,
  mediaItems,
  displaySettings,
}: ReviewSubmitStepProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [startThumbnailIndex, setStartThumbnailIndex] = useState(0);

  const handlePrevMedia = () => {
    if (startThumbnailIndex > 0) {
      setStartThumbnailIndex(prev => prev - 1);
    } else if (mediaItems.length > 4) {
      setStartThumbnailIndex(mediaItems.length - 4);
    }
    setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
  };

  const handleNextMedia = () => {
    if (startThumbnailIndex < mediaItems.length - 4 && mediaItems.length > 4) {
      setStartThumbnailIndex(prev => prev + 1);
    } else if (mediaItems.length > 4) {
      setStartThumbnailIndex(0);
    }
    setCurrentMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
  };

  const visibleThumbnails = mediaItems.slice(startThumbnailIndex, startThumbnailIndex + 4);

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-[400px_1fr] gap-8">
        {/* Left Column - Game Details */}
        <GameDetailsCard 
          eventName={eventName}
          blindLevels={blindLevels}
          roomManagement={roomManagement}
          displaySettings={displaySettings}
          mediaItems={mediaItems}
        />

        {/* Right Column - Preview and Thumbnails */}
        <div className="space-y-4">
          {/* Preview Container */}
          <div className="relative w-full aspect-video bg-[#1D1D1F] rounded-2xl overflow-hidden">
            {/* Media Preview */}
            {mediaItems.length > 0 && (
              <div className="absolute inset-0">
                {mediaItems[currentMediaIndex].type === 'image' ? (
                  <Image
                    src={mediaItems[currentMediaIndex].path}
                    alt="Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <video
                    src={mediaItems[currentMediaIndex].path}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Timer Preview */}
            {displaySettings.showTimer && (
              <div
                className={`absolute p-3 rounded-lg ${
                  displaySettings.timerPosition === 'top-right' ? 'top-4 right-4' :
                  displaySettings.timerPosition === 'top-left' ? 'top-4 left-4' :
                  displaySettings.timerPosition === 'bottom-right' ? 'bottom-4 right-4' :
                  'bottom-4 left-4'
                }`}
                style={{
                  backgroundColor: displaySettings.customColors.timerBackground || 'rgba(0, 0, 0, 0.55)',
                  color: displaySettings.customColors.timerText
                }}
              >
                <div className="text-2xl font-mono whitespace-nowrap">12:34</div>
                <div className="text-sm whitespace-nowrap">Blinds: 50/100</div>
              </div>
            )}
          </div>

          {/* Media Thumbnails with Navigation */}
          {mediaItems.length > 0 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePrevMedia}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex gap-2">
                {visibleThumbnails.map((media, index) => (
                  <button
                    key={startThumbnailIndex + index}
                    onClick={() => setCurrentMediaIndex(startThumbnailIndex + index)}
                    className={`relative w-32 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      startThumbnailIndex + index === currentMediaIndex
                        ? 'border-brand-primary'
                        : 'border-dark-border hover:border-brand-primary/50'
                    }`}
                  >
                    {media.type === 'image' ? (
                      <Image
                        src={media.path}
                        alt={`Preview ${startThumbnailIndex + index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={media.path}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextMedia}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 