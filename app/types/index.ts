export interface BlindLevel {
  id: string;
  smallBlind: number;
  bigBlind: number;
  duration: number; // in minutes
}

export interface PokerTimerState {
  isRunning: boolean;
  currentLevel: number;
  timeRemaining: number;
  levels: BlindLevel[];
  breakDuration: number;
  totalPlayTime: number;
}

export interface BasketballTimerState {
  isRunning: boolean;
  gameTime: number;
  period: number;
  homeScore: number;
  awayScore: number;
  shotClockTime: number;
}

export interface CustomTimerState {
  isRunning: boolean;
  timeRemaining: number;
  duration: number; // in minutes
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  path: string;
  duration?: number; // for videos
}

export interface DisplayState {
  currentMediaIndex: number;
  mediaItems: MediaItem[];
  showTimer: boolean;
  cycleInterval: number;
} 