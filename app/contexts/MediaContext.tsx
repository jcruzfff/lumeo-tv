'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MediaItem } from '../types';

interface MediaContextType {
  mediaItems: MediaItem[];
  currentMediaIndex: number;
  setMediaItems: (items: MediaItem[]) => void;
  setCurrentMediaIndex: (index: number) => void;
  storeMediaItems: (items: MediaItem[]) => void;
  startMediaCycle: () => void;
  stopMediaCycle: () => void;
  isMediaCycling: boolean;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isMediaCycling, setIsMediaCycling] = useState(false);
  const cycleTimeoutRef = useRef<NodeJS.Timeout>();
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

  const startMediaCycle = useCallback(() => {
    console.log('[Media] Starting media cycle');
    setIsMediaCycling(true);
  }, []);

  const stopMediaCycle = useCallback(() => {
    console.log('[Media] Stopping media cycle');
    setIsMediaCycling(false);
    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isMediaCycling || mediaItems.length === 0) {
      console.log('[Media] Media cycle inactive or no items');
      return;
    }

    console.log('[Media] Setting up media cycle timeout');
    cycleTimeoutRef.current = setTimeout(() => {
      setCurrentMediaIndex((current) => (current + 1) % mediaItems.length);
      console.log('[Media] Cycling to next media item');
    }, 10000); // 10 seconds per item

    return () => {
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
      }
    };
  }, [isMediaCycling, mediaItems.length, currentMediaIndex]);

  if (!isClient) {
    return null;
  }

  const value = {
    mediaItems,
    setMediaItems,
    currentMediaIndex,
    setCurrentMediaIndex,
    storeMediaItems,
    startMediaCycle,
    stopMediaCycle,
    isMediaCycling
  };

  return (
    <MediaContext.Provider value={value}>
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