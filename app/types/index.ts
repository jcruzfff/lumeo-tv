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
  totalPeriods: number;
}

export interface CustomTimerState {
  isRunning: boolean;
  timeRemaining: number;
  duration: number; // in minutes
}

export interface MediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  displayOrder: number;
  duration?: number; // for videos
}

export interface DisplayState {
  currentMediaIndex: number;
  mediaItems: MediaItem[];
  showTimer: boolean;
  cycleInterval: number;
} 