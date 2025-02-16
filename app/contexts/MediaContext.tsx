'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MediaItem } from '../types';

interface MediaContextType {
  mediaItems: MediaItem[];
  currentMediaIndex: number;
  setMediaItems: (items: MediaItem[]) => void;
  setCurrentMediaIndex: (index: number) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Load media state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('mediaState');
    if (savedState) {
      const { mediaItems: savedMediaItems, currentMediaIndex: savedIndex } = JSON.parse(savedState);
      setMediaItems(savedMediaItems);
      setCurrentMediaIndex(savedIndex);
    }
  }, []);

  // Save media state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mediaState', JSON.stringify({
      mediaItems,
      currentMediaIndex,
    }));
  }, [mediaItems, currentMediaIndex]);

  return (
    <MediaContext.Provider
      value={{
        mediaItems,
        currentMediaIndex,
        setMediaItems,
        setCurrentMediaIndex,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
} 