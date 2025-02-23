import { useState } from 'react';
import { Monitor, Tv, Clock, Eye } from 'lucide-react';
import { MediaItem } from '@/app/types';
import Image from 'next/image';

interface DisplaySettings {
  aspectRatio: '16:9' | '4:3' | '21:9';
  timerPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  mediaInterval: number;
  showTimer: boolean;
  theme: 'dark' | 'light';
  customColors: {
    timerText: string;
    timerBackground: string;
  };
}

interface DisplaySettingsStepProps {
  onCompleteAction: (settings: DisplaySettings) => void;
  selectedMedia: MediaItem[];
}

export default function DisplaySettingsStep({ onCompleteAction, selectedMedia }: DisplaySettingsStepProps) {
  const [settings, setSettings] = useState<DisplaySettings>({
    aspectRatio: '16:9',
    timerPosition: 'top-right',
    mediaInterval: 15,
    showTimer: true,
    theme: 'dark',
    customColors: {
      timerText: '#FFFFFF',
      timerBackground: '#000000',
    },
  });

  const handleSettingChange = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onCompleteAction(newSettings);
  };

  // Preview content with smaller size
  const previewContent = (
    <div className="relative">
      {/* Container that maintains 16:9 as base ratio */}
      <div className="relative w-full aspect-video overflow-hidden">
        {/* Media Content Container */}
        <div className="absolute inset-0">
          {selectedMedia.length > 0 ? (
            <div className="absolute inset-0">
              {selectedMedia[0].type === 'image' ? (
                <Image 
                  src={selectedMedia[0].path} 
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <video 
                  src={selectedMedia[0].path}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
              <span className="text-text-secondary">No media selected</span>
            </div>
          )}
        </div>

        {/* Safe Area Guidelines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Center Guidelines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-500/30 mix-blend-screen"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/30 mix-blend-screen"></div>

          {/* Safe Area Border */}
          <div className={`absolute border-2 border-emerald-500/50 ${
            settings.aspectRatio === '16:9' ? 'inset-0' :
            settings.aspectRatio === '4:3' ? 'inset-y-0 left-[12.5%] right-[12.5%]' :
            'inset-x-0 top-[12.5%] bottom-[12.5%]'
          }`}>
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-emerald-500/50"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-emerald-500/50"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-emerald-500/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-emerald-500/50"></div>
          </div>

          {/* Aspect Ratio Label */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-emerald-500 font-medium">
            {settings.aspectRatio.toUpperCase()}
          </div>
        </div>

        {/* Timer preview */}
        {settings.showTimer && (
          <div 
            className={`absolute p-3 rounded-lg ${
              settings.timerPosition === 'top-right' ? 'top-4 right-4' :
              settings.timerPosition === 'top-left' ? 'top-4 left-4' :
              settings.timerPosition === 'bottom-right' ? 'bottom-4 right-4' :
              'bottom-4 left-4'
            }`}
            style={{
              backgroundColor: settings.customColors.timerBackground || 'rgba(0, 0, 0, 0.55)',
              color: settings.customColors.timerText
            }}
          >
            <div className="text-2xl font-mono whitespace-nowrap">12:34</div>
            <div className="text-sm whitespace-nowrap">Blinds: 50/100</div>
          </div>
        )}
      </div>

      {/* Safe Area Legend */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm border-2 border-emerald-500/50"></div>
          <span className="text-xs text-text-secondary whitespace-nowrap">Safe Area</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white pb-2">Display Settings</h2>
        <p className="text-text-secondary">Configure how your timer and media will appear on screen</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* Left column - Preview */}
        <div className="space-y-6">
          <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] rounded-xl">
            <h3 className="text-lg font-semibold text-text-primary p-6 pb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Live Preview
            </h3>
            <div className="p-6 pt-0">
              {previewContent}
            </div>
          </div>
        </div>

        {/* Right column - Settings */}
        <div className="space-y-6">
          {/* Screen Ratio */}
          <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Screen Ratio
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['16:9', '4:3', '21:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleSettingChange('aspectRatio', ratio)}
                  className={`p-3 rounded-lg border ${
                    settings.aspectRatio === ratio
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-dark-border hover:border-brand-primary/50'
                  } transition-all`}
                >
                  <div className="text-center">
                    <span className="text-sm font-medium text-text-primary">{ratio}</span>
                    <div 
                      className="mt-2 mx-auto bg-text-secondary/20 rounded"
                      style={{
                        width: '40px',
                        height: ratio === '16:9' ? '22.5px' :
                               ratio === '4:3' ? '30px' :
                               '17px'
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-dark-surface/80 rounded-lg border border-dark-border">
      
              <div className="text-text-secondary text-sm">
                {settings.aspectRatio === '16:9' ? 'Recommended size: 1920×1080 pixels (Full HD)' :
                 settings.aspectRatio === '4:3' ? 'Recommended size: 1600×1200 pixels (UXGA)' :
                 'Recommended size: 2560×1080 pixels (UW-FHD)'}
              </div>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Timer Settings</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-text-secondary">
                  {settings.showTimer ? 'Visible' : 'Hidden'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showTimer}
                    onChange={(e) => handleSettingChange('showTimer', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-surface/80 border border-dark-border peer-focus:outline-none rounded-full peer dark:bg-dark-surface-lighter peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
            </div>

            {settings.showTimer && (
              <div className="space-y-6">
                {/* Timer Position */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-3">Position</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => (
                      <button
                        key={position}
                        onClick={() => handleSettingChange('timerPosition', position as DisplaySettings['timerPosition'])}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          settings.timerPosition === position
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                            : 'border-dark-border text-text-secondary hover:border-brand-primary/50'
                        }`}
                      >
                        {position.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media Settings */}
          <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Media Display</h3>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-text-primary block mb-2">
                Media Interval (seconds)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={settings.mediaInterval}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 5 && value <= 300) {
                      handleSettingChange('mediaInterval', value);
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 5) {
                      handleSettingChange('mediaInterval', 5);
                    } else if (value > 300) {
                      handleSettingChange('mediaInterval', 300);
                    }
                  }}
                  min="5"
                  max="300"
                  className="w-full bg-dark-surface border border-dark-border text-text-primary rounded-lg px-4 py-2"
                />
                <p className="text-xs text-text-secondary">Choose between 5 and 300 seconds (5 minutes)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 