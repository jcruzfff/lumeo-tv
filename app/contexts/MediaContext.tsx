'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MediaItem } from '../types';

interface MediaContextType {
  mediaItems: MediaItem[];
  currentMediaIndex: number;
  setMediaItems: (items: MediaItem[]) => void;
  setCurrentMediaIndex: (index: number) => void;
  storeMediaItems: (items: MediaItem[]) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Store media items in localStorage and state
  const storeMediaItems = useCallback((items: MediaItem[]) => {
    setMediaItems(items);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mediaState', JSON.stringify({
          mediaItems: items,
          currentMediaIndex: 0,
        }));
      } catch (error) {
        console.error('Error saving media state:', error);
      }
    }
  }, []);

  // Load media state from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedState = localStorage.getItem('mediaState');
      if (savedState) {
        const { mediaItems: savedMediaItems, currentMediaIndex: savedIndex } = JSON.parse(savedState);
        setMediaItems(savedMediaItems);
        setCurrentMediaIndex(savedIndex);
      }
    } catch (error) {
      console.error('Error loading media state:', error);
    }
  }, [isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <MediaContext.Provider
      value={{
        mediaItems,
        currentMediaIndex,
        setMediaItems,
        setCurrentMediaIndex,
        storeMediaItems,
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